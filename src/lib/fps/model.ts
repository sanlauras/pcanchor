/**
 * fps予想の計算式。
 *
 *   予想fps = min(GPU由来fps, CPU由来fps, ゲーム固有の上限)
 *
 *   GPU由来fps = そのGPUの Valorant 4K高 推定fps
 *              × ゲームの重さ(gpuWeight)
 *              × プリセット係数(factor)
 *              × 解像度係数(画素比^k)
 *   CPU由来fps = そのCPUの Valorant 天井 推定fps × ゲームの重さ(cpuWeight)
 *
 * 係数の根拠はすべて CONTEXT.md にある。ここに新しい数値を足さないこと。
 * 係数を変えると selftest.ts が落ちる。
 */

export type ResolutionId = '1080p' | '1440p' | '4k';

/** 実測に使った構成（CONTEXT.md「実測データ」） */
export const ANCHOR = {
  gpuName: 'Radeon RX 9070 XT',
  cpuName: 'Ryzen 7 9800X3D',
  /** 条件B: Valorant 4K全て高 = 464.6 fps（完全GPU律速） */
  gpuFps4kHigh: 464.6,
  /** 条件A: Valorant 1080p全て低 = 970.3 fps（CPU律速） */
  cpuCeiling: 970.3,
} as const;

const PIXELS: Record<ResolutionId, number> = {
  '1080p': 1920 * 1080,
  '1440p': 2560 * 1440,
  '4k': 3840 * 2160,
};

export const RESOLUTIONS: { id: ResolutionId; label: string; short: string }[] = [
  { id: '1080p', label: 'フルHD 1920x1080', short: '1080p' },
  { id: '1440p', label: 'WQHD 2560x1440', short: '1440p' },
  { id: '4k', label: '4K 3840x2160', short: '4K' },
];

/**
 * Valorant の解像度指数。実測の 4K→1440p = x1.87 から導出する。
 * ハードコードせず割り算で出しているので、実測値を変えれば指数も追随する。
 */
export const VALORANT_RESOLUTION_K =
  Math.log(1.87) / Math.log(PIXELS['4k'] / PIXELS['1440p']);

/**
 * 4K を 1.0 とした解像度の倍率。
 * k はプリセットごとに違う（重い設定ほど画素数に比例して重くなるため）。
 */
export function resolutionFactor(res: ResolutionId, k: number): number {
  return Math.pow(PIXELS['4k'] / PIXELS[res], k);
}

export type PresetProfile = {
  id: string;
  label: string;
  /** そのゲームの基準プリセット（最も重いもの）に対する、4Kでの倍率 */
  factor: number;
  /** 解像度指数 */
  k: number;
  /** 4K でのVRAM使用量の実測(MB)。無ければ null */
  vram4kMb: number | null;
  /** このプリセット固有の注意書き */
  note?: string;
};

/**
 * 結果の読み方について、特に目立たせたい注意書き。
 * 「この数値がどういう条件での値なのか」を取り違えると
 * 利用者の体感と大きく食い違うため、独立した枠で見せる。
 */
export type GameHighlight = {
  title: string;
  body: string;
  /** 負荷の軽い環境での目安倍率 */
  lighterMultiplier: number;
  lighterLabel: string;
  measuredLabel: string;
};

export type GameProfile = {
  id: string;
  name: string;
  /** エンジン仕様のfps上限。無ければ null */
  cap: number | null;
  /** 係数が揃っていて fps 数値を出せるか */
  supported: boolean;
  /** 係数の根拠の強さ */
  confidence: 'measured' | 'derived';
  confidenceLabel: string;
  /** Valorant の 4K最高設定 を 1.0 とした GPU側の重さ */
  gpuWeight: number;
  /** Valorant の CPU天井 を 1.0 とした CPU側の重さ */
  cpuWeight: number;
  presets: PresetProfile[];
  /** 係数の出典。自前の実測なら null */
  source: { label: string; url: string } | null;
  /** 結果画面に必ず出す注意書き */
  notes: string[];
  /** 特に強調して出す注意書き。無ければ null */
  highlight: GameHighlight | null;
};

export type Bottleneck = 'gpu' | 'cpu' | 'cap' | 'balanced';

export type Prediction = {
  /** GPU側の理論値。上限やCPUで頭打ちになる前の値 */
  gpuFps: number;
  /** CPU側の天井 */
  cpuFps: number;
  cap: number | null;
  /** 実際の予想fps。上の3つの最小値 */
  fps: number;
  bottleneck: Bottleneck;
  /** 予想fpsに対する余力。0.38 なら「38%の余力」 */
  gpuHeadroom: number;
  cpuHeadroom: number;
};

/** 律速と判定する境界。この幅に収まっていれば拮抗とみなす */
const BALANCED_BAND = 0.05;

export function predict(input: {
  /** GPUの Valorant 4K全て高 の推定fps（gpu_index.csv 由来） */
  gpuFps4kHigh: number;
  /** CPUの Valorant 天井の推定fps（cpu_index.csv 由来） */
  cpuCeiling: number;
  resolution: ResolutionId;
  game: Pick<GameProfile, 'cap' | 'gpuWeight' | 'cpuWeight'>;
  preset: Pick<PresetProfile, 'factor' | 'k'>;
}): Prediction {
  const { gpuFps4kHigh, cpuCeiling, resolution, game, preset } = input;

  const gpuFps =
    gpuFps4kHigh *
    game.gpuWeight *
    preset.factor *
    resolutionFactor(resolution, preset.k);

  const cpuFps = cpuCeiling * game.cpuWeight;
  const cap = game.cap;

  const fps = Math.min(gpuFps, cpuFps, cap ?? Number.POSITIVE_INFINITY);

  let bottleneck: Bottleneck;
  if (cap !== null && cap <= gpuFps && cap <= cpuFps) {
    bottleneck = 'cap';
  } else if (Math.abs(gpuFps - cpuFps) / Math.max(gpuFps, cpuFps) <= BALANCED_BAND) {
    bottleneck = 'balanced';
  } else {
    bottleneck = gpuFps < cpuFps ? 'gpu' : 'cpu';
  }

  return {
    gpuFps,
    cpuFps,
    cap,
    fps,
    bottleneck,
    gpuHeadroom: gpuFps / fps - 1,
    cpuHeadroom: cpuFps / fps - 1,
  };
}
