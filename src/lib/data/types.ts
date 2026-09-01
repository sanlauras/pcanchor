// GPU / CPU スペックデータの型定義。
// 値の集合が閉じているものはリテラル型にしてある。
// arch の値は data/make_index.py のアーキ効率係数のキーと対応している。

export type GpuVendor = 'NVIDIA' | 'AMD';

export type GpuArch =
  | 'Pascal'
  | 'Turing'
  | 'Ampere'
  | 'Ada'
  | 'Blackwell'
  | 'RDNA'
  | 'RDNA2'
  | 'RDNA3'
  | 'RDNA4';

export type Gpu = {
  name: string;
  /** URL用の識別子。モデル名から機械的に生成する */
  slug: string;
  vendor: GpuVendor;
  arch: GpuArch;
  releaseYear: number;
  shaderUnits: number;
  boostClockMhz: number;
  vramGb: number;
  memType: string;
  busWidthBit: number;
  memSpeedGbps: number;
  bandwidthGbs: number;
  tdpW: number;
  infinityCacheMb: number;
  verified: string;
  /** gpu_index.csv 由来。性能指数の降順の順位 */
  rank: number;
  /** 性能指数。RX 9070 XT = 100。推定値・誤差±15〜20% */
  perfIndex: number;
  /** Valorant 4K全て高の推定fps。推定値・誤差±15〜20% */
  fpsValorant4kHigh: number;
};

export type CpuVendor = 'AMD' | 'Intel';

export type CpuArch =
  | 'Zen 3'
  | 'Zen 4'
  | 'Zen 5'
  | 'Comet Lake'
  | 'Rocket Lake'
  | 'Alder Lake'
  | 'Raptor Lake'
  | 'Raptor Lake-R'
  | 'Arrow Lake';

export type Cpu = {
  name: string;
  /** URL用の識別子。モデル名から機械的に生成する */
  slug: string;
  vendor: CpuVendor;
  arch: CpuArch;
  releaseYear: number;
  cores: number;
  threads: number;
  baseClockGhz: number;
  boostClockGhz: number;
  l3CacheMb: number;
  l2CacheMb: number;
  tdpW: number;
  socket: string;
  memSupport: string;
  has3dVCache: boolean;
  verified: string;
  /** cpu_index.csv 由来。性能指数の降順の順位 */
  rank: number;
  /** 性能指数。Ryzen 7 9800X3D = 100。推定値・誤差±15〜20% */
  perfIndex: number;
  /** Valorant のCPU天井の推定fps。推定値・誤差±15〜20% */
  fpsValorantCeiling: number;
};
