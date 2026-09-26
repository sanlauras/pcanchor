import type { Cpu, Gpu } from '@/lib/data';
import { isCurrentCpu, isCurrentGenGpu } from '@/lib/generation';
import { BALANCED_BAND, type GameProfile, type PresetProfile, type ResolutionId, predict } from './model';

/**
 * GPU と CPU の組み合わせの目安。GPU・CPU の個別ページで使う。
 *
 * 新しい数字は作らない。fps予想と同じ predict() で、GPU側とCPU側の値を比べるだけ
 * （構成の逆引き build.ts と同じ考え方）。
 *
 * 見るのは 1080p・そのゲームの基準画質。解像度が低いほど GPU 側の fps が伸び、
 * CPU の差が出やすいため（CPU を選ぶときに一番厳しい条件）。
 *
 * 「足を引っ張らない」は理論値（ゲーム側の上限を除いた値）で判定する。
 * 画面の主役を理論値にしている方針（2026-09-17）と揃えるため。
 *
 * 差が BALANCED_BAND（5%）以内なら「足を引っ張らない」とみなす。fps予想の診断で
 * 「拮抗」と出す範囲と同じ。これが無いと、GPU側971・CPU側970 のような誤差にも満たない差で
 * 「どのCPUでも届かない」と出てしまう（実際に出たので直した）。
 */

export const PAIRING_RESOLUTION: ResolutionId = '1080p';

/** このゲームのこの条件で、GPU が出せる fps（CPU の影響を除いた値） */
export function gpuSideFps(gpu: Gpu, game: GameProfile, preset: PresetProfile): number {
  return predict({
    gpuFps4kHigh: gpu.fpsValorant4kHigh,
    cpuCeiling: Number.POSITIVE_INFINITY,
    resolution: PAIRING_RESOLUTION,
    game,
    preset,
  }).gpuFps;
}

/** このゲームで CPU が出せる fps の上限（GPU の影響を除いた値。解像度と画質によらない） */
export function cpuSideFps(cpu: Cpu, game: GameProfile, preset: PresetProfile): number {
  return predict({
    gpuFps4kHigh: Number.POSITIVE_INFINITY,
    cpuCeiling: cpu.fpsValorantCeiling,
    resolution: PAIRING_RESOLUTION,
    game,
    preset,
  }).cpuFps;
}

export type CpuForGpu =
  /** GPU の性能を出し切れる、最も性能指数の低い現行世代の CPU */
  | { kind: 'ok'; cpu: Cpu; gpuFps: number; cpuFps: number }
  /** 現行世代のどの CPU でも CPU 側が上限になる。最も速い CPU を返す */
  | { kind: 'cpuBound'; cpu: Cpu; gpuFps: number; cpuFps: number };

/** この GPU と組み合わせるなら、どの CPU からなら CPU が足を引っ張らないか */
export function cpuForGpu(
  gpu: Gpu,
  game: GameProfile,
  preset: PresetProfile,
  cpus: readonly Cpu[],
): CpuForGpu | null {
  const pool = cpus.filter(isCurrentCpu);
  if (pool.length === 0) return null;
  const gpuFps = gpuSideFps(gpu, game, preset);

  const enough = pool
    .map((cpu) => ({ cpu, cpuFps: cpuSideFps(cpu, game, preset) }))
    .filter((x) => x.cpuFps >= gpuFps * (1 - BALANCED_BAND))
    // 性能指数が同じなら、コア数の少ない方（ゲーム性能が同じなら、より手頃な構成になりやすい）
    .sort((a, b) => a.cpu.perfIndex - b.cpu.perfIndex || a.cpu.cores - b.cpu.cores);
  if (enough.length > 0) return { kind: 'ok', gpuFps, ...enough[0]! };

  const fastest = [...pool].sort((a, b) => b.perfIndex - a.perfIndex || a.cores - b.cores)[0]!;
  return { kind: 'cpuBound', cpu: fastest, gpuFps, cpuFps: cpuSideFps(fastest, game, preset) };
}

export type GpuForCpu =
  /** この CPU が足を引っ張らずに済む、最も性能指数の高い現行世代の GPU */
  | { kind: 'ok'; gpu: Gpu; gpuFps: number; cpuFps: number }
  /** 現行世代で最も遅い GPU でも CPU 側が上限になる */
  | { kind: 'cpuBound'; gpu: Gpu; gpuFps: number; cpuFps: number };

/** この CPU と組み合わせるなら、どの GPU までなら CPU が足を引っ張らないか */
export function gpuForCpu(
  cpu: Cpu,
  game: GameProfile,
  preset: PresetProfile,
  gpus: readonly Gpu[],
): GpuForCpu | null {
  const pool = gpus.filter(isCurrentGenGpu);
  if (pool.length === 0) return null;
  const cpuFps = cpuSideFps(cpu, game, preset);

  const within = pool
    .map((gpu) => ({ gpu, gpuFps: gpuSideFps(gpu, game, preset) }))
    .filter((x) => x.gpuFps <= cpuFps * (1 + BALANCED_BAND))
    .sort((a, b) => b.gpu.perfIndex - a.gpu.perfIndex);
  if (within.length > 0) return { kind: 'ok', cpuFps, ...within[0]! };

  const slowest = [...pool].sort((a, b) => a.perfIndex - b.perfIndex)[0]!;
  return { kind: 'cpuBound', gpu: slowest, cpuFps, gpuFps: gpuSideFps(slowest, game, preset) };
}
