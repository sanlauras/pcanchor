import type { Cpu, Gpu } from '@/lib/data';
import { isCurrentCpu, isCurrentGenGpu } from '@/lib/generation';
import { vramNeedMb } from './diagnose';
import { findGame } from './games';
import { type GameProfile, type PresetProfile, type ResolutionId, predict } from './model';

/**
 * 目標fpsから構成を逆引きする。
 *
 * fps予想ツール（GPU+CPU → fps）の逆向き。
 * 予想の式は fps = min(GPU由来, CPU由来, ゲーム上限) で、
 * predict() が GPU由来と CPU由来を別々に返すので、探索は要らない。
 * 「GPU由来 ≧ 必要fps」「CPU由来 ≧ 必要fps」を満たす最小のモデルを選ぶだけ。
 *
 * 3段階の定義は CONTEXT.md「構成の逆引き」に記録している。
 * **価格データを持っていないので、円あたりの性能では選べない。**
 * 画面上でもその旨を明記すること。
 */

export type Tier = 'value' | 'headroom' | 'stable';

export const TIERS: { id: Tier; label: string; summary: string }[] = [
  {
    id: 'value',
    label: 'コスパ構成',
    summary: '平均fpsが目標にちょうど届く、最も性能の低い構成',
  },
  {
    id: 'headroom',
    label: '余裕構成',
    summary: '推定の誤差が下振れしても目標を割らないよう、2割の余裕を見た構成',
  },
  {
    id: 'stable',
    label: '安定構成',
    summary: 'カクつきの底（1% Low）まで目標を保てる構成',
  },
];

/** 余裕構成の係数。誤差 ±20% の下振れをちょうど吸収する */
const HEADROOM = 1.2;

export type Candidate<T> = { model: T; fps: number };

/** なぜ出せないかを型で区別する。画面側で理由を出し分けるため */
export type Unavailable =
  | { reason: 'cap'; cap: number }
  | { reason: 'noRatio' }
  | { reason: 'none' }
  | { reason: 'vendor' }
  | { reason: 'generation' };

export type Side<T> = { kind: 'ok'; candidates: Candidate<T>[] } | ({ kind: 'ng' } & Unavailable);

export type TierResult = {
  tier: Tier;
  /** この段階を満たすのに必要な平均fps */
  requiredAvg: number;
  gpu: Side<Gpu>;
  cpu: Side<Cpu>;
  /** 必要なVRAM(MB)。プリセットに実測が無ければ null */
  vramNeedMb: number | null;
};

export type BuildRequest = {
  gameId: string;
  presetId: string;
  resolution: ResolutionId;
  targetFps: number;
  /** null = 指定なし */
  gpuVendor: Gpu['vendor'] | null;
  cpuVendor: Cpu['vendor'] | null;
  /**
   * 新品で流通している可能性が高い世代だけに絞るか。
   *
   * 「目標を満たす最小」を出すと必然的に古いカードが選ばれる
   * （GTX 1070 など、新品では買えないもの）。買い物の助けとして使うなら絞る。
   */
  currentGenOnly: boolean;
};

/** 候補として並べる件数。1つに断定しないための帯 */
const BAND = 4;

/** その段階を満たすのに必要な平均fps。安定だけは 1% Low から逆算する */
function requiredAvg(tier: Tier, target: number, preset: PresetProfile): number | null {
  if (tier === 'value') return target;
  if (tier === 'headroom') return target * HEADROOM;
  // 安定: 1% Low が目標を満たす。レンジの低い側で見る（甘く見積もらない）
  if (!preset.lowRatio) return null;
  return target / preset.lowRatio.min;
}

function solveTier(args: {
  tier: Tier;
  req: BuildRequest;
  game: GameProfile;
  preset: PresetProfile;
  gpus: readonly Gpu[];
  cpus: readonly Cpu[];
}): TierResult {
  const { tier, req, game, preset, gpus, cpus } = args;
  const need = requiredAvg(tier, req.targetFps, preset);
  const vram = vramNeedMb(preset, req.resolution);

  if (need === null) {
    return { tier, requiredAvg: 0, gpu: { kind: 'ng', reason: 'noRatio' }, cpu: { kind: 'ng', reason: 'noRatio' }, vramNeedMb: vram };
  }

  // ゲーム側の上限を超えていたら、どんな構成でも届かない
  if (game.cap !== null && need > game.cap) {
    const ng = { kind: 'ng', reason: 'cap', cap: game.cap } as const;
    return { tier, requiredAvg: need, gpu: ng, cpu: ng, vramNeedMb: vram };
  }

  // GPU側だけを見たいので CPU天井は無限大にして predict を通す。
  // 逆も同様。こうすると min() に邪魔されず、片側の能力だけが出る。
  const gpuFpsOf = (g: Gpu) =>
    predict({
      gpuFps4kHigh: g.fpsValorant4kHigh,
      cpuCeiling: Number.POSITIVE_INFINITY,
      resolution: req.resolution,
      game,
      preset,
    }).gpuFps;

  const cpuFpsOf = (c: Cpu) =>
    predict({
      gpuFps4kHigh: Number.POSITIVE_INFINITY,
      cpuCeiling: c.fpsValorantCeiling,
      resolution: req.resolution,
      game,
      preset,
    }).cpuFps;

  function narrow<T extends { perfIndex: number; vendor: string }>(
    pool: readonly T[],
    vendor: string | null,
    fpsOf: (x: T) => number,
    vramOk: (x: T) => boolean,
    isCurrent: (x: T) => boolean,
  ): Side<T> {
    const clears = pool.filter((x) => fpsOf(x) >= need! && vramOk(x));
    if (clears.length === 0) return { kind: 'ng', reason: 'none' };

    // 絞り込みは段階的に外して、どこで消えたかを理由として返せるようにする
    const byGen = req.currentGenOnly ? clears.filter(isCurrent) : clears;
    if (byGen.length === 0) return { kind: 'ng', reason: 'generation' };

    const byVendor = vendor === null ? byGen : byGen.filter((x) => x.vendor === vendor);
    if (byVendor.length === 0) return { kind: 'ng', reason: 'vendor' };

    return {
      kind: 'ok',
      candidates: [...byVendor]
        .sort((a, b) => a.perfIndex - b.perfIndex)
        .slice(0, BAND)
        .map((model) => ({ model, fps: fpsOf(model) })),
    };
  }

  return {
    tier,
    requiredAvg: need,
    // VRAMが足りないGPUは、fpsが足りていても候補に入れない。
    // 平均fpsには出にくいが、カクつきの主因になるため（diagnose.ts と同じ考え方）
    gpu: narrow(
      gpus,
      req.gpuVendor,
      gpuFpsOf,
      (g) => vram === null || g.vramGb * 1024 >= vram,
      isCurrentGenGpu,
    ),
    cpu: narrow(cpus, req.cpuVendor, cpuFpsOf, () => true, isCurrentCpu),
    vramNeedMb: vram,
  };
}

export function solveBuild(args: {
  req: BuildRequest;
  gpus: readonly Gpu[];
  cpus: readonly Cpu[];
}): TierResult[] | null {
  const game = findGame(args.req.gameId);
  const preset = game.presets.find((p) => p.id === args.req.presetId);
  if (!game.supported || !preset) return null;

  return TIERS.map((t) =>
    solveTier({ tier: t.id, req: args.req, game, preset, gpus: args.gpus, cpus: args.cpus }),
  );
}

export type Alternative = {
  presetId: string;
  presetLabel: string;
  resolution: ResolutionId;
  gpu: Side<Gpu>;
};

/**
 * 設定を下げた場合の代替案。
 * 要求が高すぎて買えないときに、何を妥協すればどこまで下がるかを見せる。
 * 段階は「コスパ」固定（一番軽い条件で、どこまで落とせるかを見たいため）。
 */
export function alternatives(args: {
  req: BuildRequest;
  gpus: readonly Gpu[];
  cpus: readonly Cpu[];
  resolutions: readonly ResolutionId[];
}): Alternative[] {
  const game = findGame(args.req.gameId);
  if (!game.supported) return [];

  const out: Alternative[] = [];
  for (const preset of game.presets) {
    for (const resolution of args.resolutions) {
      // 今選んでいる条件そのものは代替案ではない
      if (preset.id === args.req.presetId && resolution === args.req.resolution) continue;
      const r = solveTier({
        tier: 'value',
        req: { ...args.req, presetId: preset.id, resolution },
        game,
        preset,
        gpus: args.gpus,
        cpus: args.cpus,
      });
      out.push({
        presetId: preset.id,
        presetLabel: preset.label,
        resolution,
        gpu: r.gpu,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ 自己テスト */

type InverseCase = {
  gameId: string;
  presetId: string;
  resolution: ResolutionId;
  targetFps: number;
};

/** 逆引きが妥当かを確かめる条件。極端な側（不可能になる条件）も入れてある */
const INVERSE_CASES: InverseCase[] = [
  { gameId: 'valorant', presetId: 'high', resolution: '1440p', targetFps: 144 },
  { gameId: 'valorant', presetId: 'low', resolution: '1080p', targetFps: 240 },
  { gameId: 'valorant', presetId: 'high', resolution: '4k', targetFps: 60 },
  { gameId: 'fortnite', presetId: 'performance', resolution: '1080p', targetFps: 240 },
  { gameId: 'fortnite', presetId: 'low', resolution: '1080p', targetFps: 144 },
  { gameId: 'fortnite', presetId: 'epic', resolution: '1440p', targetFps: 60 },
  { gameId: 'fortnite', presetId: 'medium', resolution: '1440p', targetFps: 144 },
];

/**
 * 逆引きの結果を予想ツールに入れ直して、本当に目標を満たすか確かめる。
 *
 * ツールのページ（Server Component）の読み込み時に実行しているので、
 * 逆引きと予想がずれたら **ビルドが落ちる**。
 * 片方だけ直して食い違う事故を防ぐのが目的。
 */
export function assertBuildInverts(gpus: readonly Gpu[], cpus: readonly Cpu[]): void {
  const problems: string[] = [];

  for (const c of INVERSE_CASES) {
    const game = findGame(c.gameId);
    const preset = game.presets.find((p) => p.id === c.presetId);
    if (!preset) {
      problems.push(`${c.gameId}/${c.presetId}: プリセットが無い`);
      continue;
    }

    const tiers = solveBuild({
      req: { ...c, gpuVendor: null, cpuVendor: null, currentGenOnly: false },
      gpus,
      cpus,
    });
    if (!tiers) {
      problems.push(`${c.gameId}/${c.presetId}: 解が返らない`);
      continue;
    }

    for (const t of tiers) {
      if (t.gpu.kind !== 'ok' || t.cpu.kind !== 'ok') continue;
      const gpu = t.gpu.candidates[0]!.model;
      const cpu = t.cpu.candidates[0]!.model;
      const label = `${game.name}/${c.resolution}/${preset.label}/${c.targetFps}fps/${t.tier}`;

      const p = predict({
        gpuFps4kHigh: gpu.fpsValorant4kHigh,
        cpuCeiling: cpu.fpsValorantCeiling,
        resolution: c.resolution,
        game,
        preset,
      });

      // 安定だけは 1% Low で判定する。他は平均fps
      const got = t.tier === 'stable' ? (p.fps1Low?.min ?? 0) : p.fps;
      const want = t.tier === 'stable' ? c.targetFps : t.requiredAvg;
      if (got < want - 0.01) {
        problems.push(
          `${label}: ${gpu.name} + ${cpu.name} を入れ直すと ${got.toFixed(0)}fps で、` +
            `必要な ${want.toFixed(0)}fps に届かない`,
        );
      }

      // VRAMも条件に入っているはずなので、足りないものが選ばれていないこと
      if (t.vramNeedMb !== null && gpu.vramGb * 1024 < t.vramNeedMb) {
        problems.push(
          `${label}: ${gpu.name} は VRAM ${gpu.vramGb}GB で、` +
            `必要な ${(t.vramNeedMb / 1024).toFixed(1)}GB に足りないのに選ばれている`,
        );
      }

      // 境界: 1つ下の指数のGPUでは届かないこと（＝本当に「最小」か）
      const below = [...gpus]
        .filter((g) => g.perfIndex < gpu.perfIndex)
        .sort((a, b) => b.perfIndex - a.perfIndex)[0];
      if (below) {
        const q = predict({
          gpuFps4kHigh: below.fpsValorant4kHigh,
          cpuCeiling: Number.POSITIVE_INFINITY,
          resolution: c.resolution,
          game,
          preset,
        });
        const vramOk = t.vramNeedMb === null || below.vramGb * 1024 >= t.vramNeedMb;
        if (q.gpuFps >= t.requiredAvg && vramOk) {
          problems.push(
            `${label}: ${gpu.name} より下の ${below.name} でも届くので、最小になっていない`,
          );
        }
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      '構成の逆引きが予想と食い違っています。src/lib/fps/build.ts を確認してください:\n' +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
}
