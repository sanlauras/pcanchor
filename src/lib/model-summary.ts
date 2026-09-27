import type { Cpu, Gpu } from '@/lib/data';
import { vramCapacityMb, vramNeedMb } from '@/lib/fps/diagnose';
import { GAMES } from '@/lib/fps/games';
import { type GameProfile, type PresetProfile, RESOLUTIONS, type ResolutionId, predict } from '@/lib/fps/model';
import { cpuSideFps } from '@/lib/fps/pairing';

/**
 * GPU・CPU の個別ページに出す「そのモデルだけの情報」の組み立て（2026-09-27 の SEO監査への対応）。
 *
 * 120ページが同じ型の表だけになっていたので、各モデル固有の事実（順位・前後の世代との差・
 * VRAM が足りなくなる条件）を足す。**新しい数字は作らない。** 使うのは性能指数（メーカー公式スペックからの自前計算）と、
 * fps予想と同じ predict() と、VRAM の見込み（diagnose.ts の vramNeedMb）だけ。
 */

/** 指数が自分より高いモデルの数 + 1。同じ指数のモデルは同じ順位にする（CSV の rank は同値でも別の順位になるため） */
export function rankByIndex<T extends { perfIndex: number }>(all: readonly T[], target: T): number {
  return all.filter((x) => x.perfIndex > target.perfIndex).length + 1;
}

/** 各ゲームの基準の画質（fps予想ツールやゲームページと同じもの） */
export function featuredPresets(): { game: GameProfile; preset: PresetProfile }[] {
  return GAMES.filter((g) => g.supported).flatMap((game) => {
    const preset = game.presets.find((p) => p.id === game.featuredPresetId);
    return preset ? [{ game, preset }] : [];
  });
}

/** この GPU に、組み合わせる CPU を付けたときの、各ゲーム・基準画質・1080p の推定fps（理論値） */
export function gpuHeadline(gpu: Gpu, cpu: Cpu) {
  return featuredPresets().map(({ game, preset }) => {
    const p = predict({
      gpuFps4kHigh: gpu.fpsValorant4kHigh,
      cpuCeiling: cpu.fpsValorantCeiling,
      resolution: '1080p',
      game,
      preset,
    });
    const floor = game.overpredictsBelowIndex;
    return {
      game,
      preset,
      uncapped: p.uncapped,
      capped: p.capped,
      overpredicts: floor !== null && gpu.perfIndex < floor,
    };
  });
}

/** この CPU で、各ゲームが出せる fps の上限（CPU 側の値。解像度と画質によらない） */
export function cpuHeadline(cpu: Cpu) {
  return featuredPresets().map(({ game, preset }) => ({
    game,
    fps: cpuSideFps(cpu, game, preset),
  }));
}

/*
 * 前の世代の同じクラス。型番の世代の数字だけを1つ戻したモデルを探す。
 * 名前の規則で機械的に探すだけなので、データに無ければ出さない（無理に当てはめない）。
 */

function previousGpuNames(name: string): string[] {
  // GeForce RTX 5070 Ti → GeForce RTX 4070 Ti（RTX 20 → GTX 10 は型番の付け方が違うので探さない）
  const nv = /^GeForce RTX ([3-5])0(\d0)(.*)$/.exec(name);
  if (nv) {
    const [, s, tier, rest] = nv;
    const base = `GeForce RTX ${Number(s) - 1}0${tier}`;
    // 「3080 12GB」のように容量違いがある型番は、容量を外した名前も探す
    return [base + rest, base + rest.replace(/ \d+GB$/, '')];
  }
  // Radeon RX 7800 XT → RX 6800 XT、6700 XT → 5700 XT。RX 9000 は 7000 と型番の付け方が違うので探さない
  const amd = /^Radeon RX ([67])(\d00)(.*)$/.exec(name);
  if (amd) {
    const [, s, tier, rest] = amd;
    return [`Radeon RX ${Number(s) - 1}${tier}${rest}`];
  }
  return [];
}

function previousCpuNames(name: string): string[] {
  // Ryzen の世代は 9000 → 7000 → 5000 → 3000（デスクトップ向け）
  const ryzen = /^Ryzen (\d) ([579])(\d{3}.*)$/.exec(name);
  if (ryzen) {
    const [, tier, s, rest] = ryzen;
    const prev = { '9': '7', '7': '5', '5': '3' }[s as '9' | '7' | '5'];
    return [`Ryzen ${tier} ${prev}${rest}`];
  }
  // Core i7-14700K → Core i7-13700K
  const core = /^Core i(\d)-(1[1-4])(\d{3}.*)$/.exec(name);
  if (core) {
    const [, tier, gen, rest] = core;
    return [`Core i${tier}-${Number(gen) - 1}${rest}`];
  }
  return [];
}

function findByNames<T extends { name: string }>(all: readonly T[], names: string[]): T | null {
  for (const n of names) {
    const hit = all.find((x) => x.name === n);
    if (hit) return hit;
  }
  return null;
}

export type GenerationLink<T> = { model: T; ratio: number };

/** 前の世代と次の世代の同じクラス（あれば）と、指数の比（このモデル ÷ 相手） */
export function generationNeighbors<T extends { name: string; perfIndex: number }>(
  all: readonly T[],
  target: T,
  kind: 'gpu' | 'cpu',
): { previous: GenerationLink<T> | null; next: GenerationLink<T> | null } {
  const prevNames = kind === 'gpu' ? previousGpuNames : previousCpuNames;
  const previous = findByNames(all, prevNames(target.name));
  // 次の世代 = 「前の世代」がこのモデルになるモデル
  const next = all.find((x) => x.name !== target.name && findByNames(all, prevNames(x.name))?.name === target.name) ?? null;
  return {
    previous: previous ? { model: previous, ratio: target.perfIndex / previous.perfIndex } : null,
    next: next ? { model: next, ratio: target.perfIndex / next.perfIndex } : null,
  };
}

/**
 * この GPU の VRAM では足りない見込みの条件。
 * fps予想ツールの VRAM の警告と同じ見込み（vramNeedMb。自前の実測とゲームごとの測定の 4K 値が基準）を使う。
 * VRAM の見込みが無いゲーム（Apex は測定側の値が概数のため不明扱い）は含まれない。
 */
export function vramShortfalls(gpu: Gpu) {
  const haveMb = vramCapacityMb(gpu);
  return GAMES.filter((g) => g.supported).flatMap((game) =>
    game.presets.flatMap((preset) =>
      RESOLUTIONS.flatMap((res) => {
        const need = vramNeedMb(preset, res.id as ResolutionId);
        return need !== null && need > haveMb
          ? [{ game, preset, resolution: res, needMb: need, measured4kMb: preset.vram4kMb! }]
          : [];
      }),
    ),
  );
}

/** 指数の比を「約12%高い」「約8%低い」「ほぼ同じ（±3%未満）」の言葉にする */
export function describeRatio(r: number): string {
  const pct = Math.round((r - 1) * 100);
  if (Math.abs(pct) < 3) return 'ほぼ同じ（差は3%未満）';
  return pct > 0 ? `約${pct}%高い` : `約${-pct}%低い`;
}
