import type { Cpu, Gpu } from '@/lib/data';
import { cpus } from '@/lib/data';
import { GAMES } from './games';
import { RESOLUTIONS, type ResolutionId, predict } from './model';

/**
 * 個別モデルページとゲーム別ページで使う、ゲーム別fps表の組み立て。
 *
 * fpsツールとまったく同じ predict() を通すので、値がページ間でずれない。
 */

/** GPU単体のページで使う比較用CPU。上位帯の代表としてアンカー機のCPUを使う */
export const REFERENCE_CPU_NAME = 'Ryzen 7 9800X3D';

export function referenceCpu(): Cpu {
  return cpus.find((c) => c.name === REFERENCE_CPU_NAME) ?? cpus[0]!;
}

export type FpsCell = {
  resolution: ResolutionId;
  fps: number;
  bottleneck: 'gpu' | 'cpu' | 'cap' | 'balanced';
};

export type FpsRow = {
  presetId: string;
  presetLabel: string;
  cells: FpsCell[];
};

export type GameFpsTable = {
  gameId: string;
  gameName: string;
  confidenceLabel: string;
  notes: string[];
  rows: FpsRow[];
};

/** 係数が揃っていて数値を出せるゲームだけ */
export function supportedGames() {
  return GAMES.filter((g) => g.supported);
}

/**
 * ある GPU + CPU の組み合わせについて、対応ゲームすべての
 * 解像度 x プリセット の表を作る。
 */
export function buildFpsTables(gpu: Gpu, cpu: Cpu): GameFpsTable[] {
  return supportedGames().map((game) => ({
    gameId: game.id,
    gameName: game.name,
    confidenceLabel: game.confidenceLabel,
    notes: game.notes,
    rows: game.presets.map((preset) => ({
      presetId: preset.id,
      presetLabel: preset.label,
      cells: RESOLUTIONS.map((res) => {
        const p = predict({
          gpuFps4kHigh: gpu.fpsValorant4kHigh,
          cpuCeiling: cpu.fpsValorantCeiling,
          resolution: res.id,
          game,
          preset,
        });
        return { resolution: res.id, fps: p.fps, bottleneck: p.bottleneck };
      }),
    })),
  }));
}

/**
 * ゲーム別ページ用。全GPUについて、ある解像度・プリセットでの推定fpsを高い順に返す。
 */
export function rankGpusForGame(args: {
  gpus: readonly Gpu[];
  cpu: Cpu;
  gameId: string;
  presetId: string;
  resolution: ResolutionId;
}) {
  const game = GAMES.find((g) => g.id === args.gameId);
  const preset = game?.presets.find((p) => p.id === args.presetId);
  if (!game || !preset) return [];

  return args.gpus
    .map((gpu) => {
      const p = predict({
        gpuFps4kHigh: gpu.fpsValorant4kHigh,
        cpuCeiling: args.cpu.fpsValorantCeiling,
        resolution: args.resolution,
        game,
        preset,
      });
      return { gpu, fps: p.fps, bottleneck: p.bottleneck };
    })
    .sort((a, b) => b.fps - a.fps);
}

/** 指数が近いモデル。順位は断定できないので「近い帯」として見せる */
export function nearbyByIndex<T extends { perfIndex: number; name: string }>(
  all: readonly T[],
  target: T,
  count = 4,
): T[] {
  return all
    .filter((x) => x.name !== target.name)
    .map((x) => ({ x, d: Math.abs(x.perfIndex - target.perfIndex) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((e) => e.x);
}
