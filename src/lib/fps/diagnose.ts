import type { Cpu, Gpu } from '@/lib/data';
import {
  type GameProfile,
  type Prediction,
  type PresetProfile,
  type ResolutionId,
  predict,
  resolutionFactor,
} from './model';

/**
 * ボトルネック診断と、伸ばすための助言を組み立てる。
 *
 * 助言はすべてルールベース。AI推論は使わない（CLAUDE.md 絶対ルール4）。
 * 数値は model.ts の式を再計算して出しており、新しい数値は作っていない。
 */

/**
 * 交換先として提案する最低ライン。
 *
 * 指数の誤差が ±15〜20% あり、近接モデルの順位は信用できない
 * （CONTEXT.md「この指数の限界」）。誤差に埋もれる差を勧めないよう、
 * 20%以上の改善が見込める候補だけを出す。
 */
const MEANINGFUL_GAIN = 0.2;

export type Upgrade = {
  kind: 'gpu' | 'cpu';
  name: string;
  toFps: number;
  gain: number;
};

export type Diagnosis = {
  headline: string;
  detail: string;
  /** 買い替えずにできること */
  freeActions: string[];
  upgrades: Upgrade[];
  /** 交換しても意味がないと言い切れる側 */
  pointless: string | null;
  vramWarning: string | null;
  memoryNote: string | null;
  psuNote: string | null;
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function fmt(v: number): string {
  return v.toFixed(0);
}

/**
 * その解像度・プリセットでのVRAM要求量(MB)。
 * 4Kの実測値を基準に、画素比で概算する。
 * 実測では画質を下げてもVRAMがほとんど減らなかったため、
 * 解像度側だけを効かせ、下限は4K実測の6割としている。
 */
function vramNeedMb(preset: PresetProfile, resolution: ResolutionId): number | null {
  if (preset.vram4kMb === null) return null;
  if (resolution === '4k') return preset.vram4kMb;
  // 解像度が下がるとフレームバッファ分は減るが、テクスチャ等は残る
  const scale = resolution === '1440p' ? 0.85 : 0.75;
  return Math.round(preset.vram4kMb * scale);
}

export function diagnose(args: {
  gpu: Gpu;
  cpu: Cpu;
  resolution: ResolutionId;
  game: GameProfile;
  preset: PresetProfile;
  prediction: Prediction;
  gpus: readonly Gpu[];
  cpus: readonly Cpu[];
  memoryGb: number | null;
  psuWatts: number | null;
}): Diagnosis {
  const { gpu, cpu, resolution, game, preset, prediction, memoryGb, psuWatts } = args;
  const p = prediction;

  const recalc = (gpuFps4kHigh: number, cpuCeiling: number) =>
    predict({ gpuFps4kHigh, cpuCeiling, resolution, game, preset }).fps;

  // ---- 交換先の候補。同じ式で再計算し、意味のある差があるものだけ ----
  const upgrades: Upgrade[] = [];

  function collect<T>(
    kind: 'gpu' | 'cpu',
    pool: readonly T[],
    nameOf: (x: T) => string,
    fpsOf: (x: T) => number,
  ) {
    const scored = pool
      .map((x) => ({
        name: nameOf(x),
        toFps:
          kind === 'gpu'
            ? recalc(fpsOf(x), cpu.fpsValorantCeiling)
            : recalc(gpu.fpsValorant4kHigh, fpsOf(x)),
      }))
      .map((x) => ({ ...x, gain: x.toFps / p.fps - 1 }))
      .filter((x) => x.gain >= MEANINGFUL_GAIN)
      .sort((a, b) => a.gain - b.gain);

    if (scored.length === 0) return;
    // 最小構成の改善と、上限まで伸ばした場合の2つを出す
    const first = scored[0]!;
    const best = scored[scored.length - 1]!;
    upgrades.push({ kind, ...first });
    if (best.name !== first.name) upgrades.push({ kind, ...best });
  }

  let headline: string;
  let detail: string;
  const freeActions: string[] = [];
  let pointless: string | null = null;

  switch (p.bottleneck) {
    case 'cpu':
      headline = 'この構成は CPU律速 です';
      detail =
        `GPU側は ${fmt(p.gpuFps)} fps 出せる計算ですが、CPUが ${fmt(p.cpuFps)} fps で頭打ちになっています。` +
        `GPUには ${pct(p.gpuHeadroom)} の余力が残っています。`;
      freeActions.push(
        '解像度を上げても、画質を上げても、fpsはほとんど落ちません。余っているGPUを使い切る方向に振れます。',
      );
      pointless = 'GPUを交換してもfpsは変わりません。上限を決めているのはCPUです。';
      collect('cpu', args.cpus, (c) => c.name, (c) => c.fpsValorantCeiling);
      break;

    case 'gpu': {
      headline = 'この構成は GPU律速 です';
      detail =
        `CPUは ${fmt(p.cpuFps)} fps まで対応できますが、GPUが ${fmt(p.gpuFps)} fps で頭打ちになっています。` +
        `CPUには ${pct(p.cpuHeadroom)} の余力が残っています。`;

      // 1段軽いプリセットにしたときの伸びを、同じ式で計算して示す
      const lighter = game.presets.find((x) => x.factor > preset.factor);
      if (lighter) {
        const to = predict({
          gpuFps4kHigh: gpu.fpsValorant4kHigh,
          cpuCeiling: cpu.fpsValorantCeiling,
          resolution,
          game,
          preset: lighter,
        }).fps;
        freeActions.push(
          `画質を「${lighter.label}」にすると ${fmt(p.fps)} → ${fmt(to)} fps まで伸びます。`,
        );
      }
      if (resolution !== '1080p') {
        const lowerRes: ResolutionId = resolution === '4k' ? '1440p' : '1080p';
        const ratio =
          resolutionFactor(lowerRes, preset.k) / resolutionFactor(resolution, preset.k);
        freeActions.push(
          `解像度を ${lowerRes} に下げると約 ${ratio.toFixed(2)} 倍になります。GPUが律速なので効果が出ます。`,
        );
      }
      pointless = 'CPUを交換してもfpsは変わりません。上限を決めているのはGPUです。';
      collect('gpu', args.gpus, (g) => g.name, (g) => g.fpsValorant4kHigh);
      break;
    }

    case 'cap':
      headline = 'ゲーム側の上限に張り付きます';
      detail =
        `この構成はGPU ${fmt(p.gpuFps)} fps / CPU ${fmt(p.cpuFps)} fps の計算で、` +
        `どちらもゲームの上限 ${game.cap} fps を超えています。つまりこのゲームにはオーバースペックです。`;
      freeActions.push(
        '設定を上げても上限に張り付いたままなので、画質を上げる方が得です。',
      );
      pointless = 'GPUもCPUも交換する意味がありません。上限はゲーム側で決まっています。';
      break;

    default:
      headline = 'GPUとCPUが拮抗しています';
      detail =
        `GPU側 ${fmt(p.gpuFps)} fps / CPU側 ${fmt(p.cpuFps)} fps で、どちらも同じくらいの水準です。` +
        `片方だけ替えても伸びしろは限られます。`;
      collect('gpu', args.gpus, (g) => g.name, (g) => g.fpsValorant4kHigh);
      collect('cpu', args.cpus, (c) => c.name, (c) => c.fpsValorantCeiling);
      break;
  }

  // ---- VRAM。平均fpsではなく 1% Low（カクつき）に効く独立の軸 ----
  const needMb = vramNeedMb(preset, resolution);
  const haveMb = gpu.vramGb * 1024;
  let vramWarning: string | null = null;
  if (needMb !== null && haveMb < needMb) {
    vramWarning =
      `${game.name} をこの設定で動かすと、VRAMを約 ${(needMb / 1024).toFixed(1)}GB 使う見込みです` +
      `（4Kでの実測 ${(preset.vram4kMb! / 1024).toFixed(1)}GB を基準に算出）。` +
      `このGPUは ${gpu.vramGb}GB なので不足します。` +
      '平均fpsにはあまり出ませんが、カクつき（1% Low）の主因になります。' +
      '実測では画質を下げてもVRAM使用量はほとんど減らなかったため、設定を下げても解消しない可能性があります。';
  }

  // ---- 任意入力。どちらもfps推定には使っていない ----
  const memoryNote =
    memoryGb !== null && memoryGb <= 8
      ? `メモリ ${memoryGb}GB は現行のゲームには少なく、読み込みやカクつきの原因になりえます。ただし平均fpsへの影響は当サイトでは未実測です。`
      : null;

  const totalTdp = gpu.tdpW + cpu.tdpW;
  const psuNote =
    psuWatts !== null
      ? `GPUとCPUの公称TDPの合計は ${totalTdp}W です（GPU ${gpu.tdpW}W + CPU ${cpu.tdpW}W）。` +
        `入力された電源は ${psuWatts}W。` +
        (psuWatts <= totalTdp
          ? 'マザーボードやストレージの分が加わるため、この容量では足りません。'
          : 'これに加えてマザーボード・ストレージ・ファン等の消費が乗ります。') +
        'メーカーの推奨電源容量は当サイトでは保有していないため、推奨W数の断定はしていません。'
      : null;

  return {
    headline,
    detail,
    freeActions,
    upgrades,
    pointless,
    vramWarning,
    memoryNote,
    psuNote,
  };
}
