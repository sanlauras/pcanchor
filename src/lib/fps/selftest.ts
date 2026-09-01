import { findGame } from './games';
import { ANCHOR, type ResolutionId, predict } from './model';

/**
 * 計算式が実測・読み取り値を再現するかを確認する。
 *
 * ツールのページ（Server Component）の読み込み時に実行しているので、
 * 係数をいじって元データとズレたら **ビルドが落ちる**。
 *
 * 出典:
 *   Valorant … CONTEXT.md「Valorant 実測4点」（自前の実測）
 *   Fortnite … CONTEXT.md「評価済みソース」Boss Benchmarks から読み取った15条件
 */

type Case = {
  label: string;
  gameId: string;
  presetId: string;
  resolution: ResolutionId;
  /** 測定機の Valorant 4K高 推定fps */
  gpuFps4kHigh: number;
  /** 測定機の Valorant CPU天井 推定fps */
  cpuCeiling: number;
  expected: number;
  /** 許容する相対誤差 */
  tolerance: number;
  expectBottleneck?: 'gpu' | 'cpu' | 'cap' | 'balanced';
};

/** 自前の実測機（RX 9070 XT + Ryzen 7 9800X3D） */
const OWN = { gpuFps4kHigh: ANCHOR.gpuFps4kHigh, cpuCeiling: ANCHOR.cpuCeiling };

/** Boss Benchmarks の測定機（RTX 5070 Ti + Ryzen 7 9800X3D） */
const BOSS = { gpuFps4kHigh: 467.5, cpuCeiling: ANCHOR.cpuCeiling };

const CASES: Case[] = [
  // ---------------------------------------------- Valorant（自前の実測4条件）
  {
    label: 'Valorant 条件B 4K/全て高（完全GPU律速）',
    gameId: 'valorant', presetId: 'high', resolution: '4k', ...OWN,
    expected: 464.6, tolerance: 0.001,
  },
  {
    label: 'Valorant 条件C 1440p/全て高',
    gameId: 'valorant', presetId: 'high', resolution: '1440p', ...OWN,
    // 解像度係数1.87は小数2桁に丸めた実測値なので、その分だけ緩める
    expected: 868.8, tolerance: 0.005,
  },
  {
    label: 'Valorant 条件D 4K/全て低',
    gameId: 'valorant', presetId: 'low', resolution: '4k', ...OWN,
    expected: 807.5, tolerance: 0.005,
  },
  {
    label: 'Valorant 条件A 1080p/全て低（CPU天井で頭打ち）',
    gameId: 'valorant', presetId: 'low', resolution: '1080p', ...OWN,
    expected: 970.3, tolerance: 0.001, expectBottleneck: 'cpu',
  },

  // ------------------------------------- Fortnite（4K = 係数の基準点。ぴったり合う）
  {
    label: 'Fortnite 4K/Epic（GPU 97%）',
    gameId: 'fortnite', presetId: 'epic', resolution: '4k', ...BOSS,
    expected: 40, tolerance: 0.01, expectBottleneck: 'gpu',
  },
  {
    label: 'Fortnite 4K/中（GPU 97%）',
    gameId: 'fortnite', presetId: 'medium', resolution: '4k', ...BOSS,
    expected: 208, tolerance: 0.01, expectBottleneck: 'gpu',
  },
  {
    label: 'Fortnite 4K/低（GPU 98%）',
    gameId: 'fortnite', presetId: 'low', resolution: '4k', ...BOSS,
    expected: 315, tolerance: 0.01, expectBottleneck: 'gpu',
  },
  {
    label: 'Fortnite 4K/Performance（GPU 98%）',
    gameId: 'fortnite', presetId: 'performance', resolution: '4k', ...BOSS,
    expected: 525, tolerance: 0.01, expectBottleneck: 'gpu',
  },

  // ------------------------------- Fortnite（4K以外。ここが係数の当てはまりを見る本番）
  {
    label: 'Fortnite 1440p/Epic',
    gameId: 'fortnite', presetId: 'epic', resolution: '1440p', ...BOSS,
    // 3点フィットのため 1440p は -8% ずれる。シーンのばらつき(約10%)の範囲内
    expected: 73, tolerance: 0.12,
  },
  {
    label: 'Fortnite 1080p/Epic',
    gameId: 'fortnite', presetId: 'epic', resolution: '1080p', ...BOSS,
    expected: 96, tolerance: 0.05,
  },
  {
    label: 'Fortnite 1440p/中',
    gameId: 'fortnite', presetId: 'medium', resolution: '1440p', ...BOSS,
    expected: 301, tolerance: 0.05,
  },
  {
    label: 'Fortnite 1080p/中',
    gameId: 'fortnite', presetId: 'medium', resolution: '1080p', ...BOSS,
    expected: 400, tolerance: 0.05,
  },
  {
    label: 'Fortnite 1440p/低',
    gameId: 'fortnite', presetId: 'low', resolution: '1440p', ...BOSS,
    expected: 459, tolerance: 0.05,
  },
  {
    label: 'Fortnite 1440p/Performance（CPU天井で頭打ち）',
    gameId: 'fortnite', presetId: 'performance', resolution: '1440p', ...BOSS,
    expected: 651, tolerance: 0.02, expectBottleneck: 'cpu',
  },
  {
    label: 'Fortnite 1080p/Performance（CPU天井で頭打ち）',
    gameId: 'fortnite', presetId: 'performance', resolution: '1080p', ...BOSS,
    // 読み取り値593はシーンが重かった回。CPU天井651で頭打ちになる予測とは約10%ずれる
    expected: 593, tolerance: 0.12, expectBottleneck: 'cpu',
  },
  {
    label: 'Fortnite 1080p/低（GPU79%の混在領域）',
    gameId: 'fortnite', presetId: 'low', resolution: '1080p', ...BOSS,
    // GPUもCPUも飽和していない混在領域。min()では表せず、モデルは過大評価する。
    // CONTEXT.md「この指数の限界」にある既知の制約。誤差の上限を固定するために置いている
    expected: 504, tolerance: 0.2,
  },
];

export function assertModelReproducesMeasurements(): void {
  const problems: string[] = [];

  for (const c of CASES) {
    const game = findGame(c.gameId);
    const preset = game.presets.find((p) => p.id === c.presetId);
    if (!preset) {
      problems.push(`${c.label}: プリセット ${c.presetId} が ${c.gameId} に無い`);
      continue;
    }

    const got = predict({
      gpuFps4kHigh: c.gpuFps4kHigh,
      cpuCeiling: c.cpuCeiling,
      resolution: c.resolution,
      game,
      preset,
    });

    const diff = Math.abs(got.fps - c.expected) / c.expected;
    if (diff > c.tolerance) {
      problems.push(
        `${c.label}: 元データ ${c.expected} に対し計算値 ${got.fps.toFixed(1)}` +
          `（ズレ ${(diff * 100).toFixed(1)}%、許容 ${(c.tolerance * 100).toFixed(1)}%）`,
      );
    }
    if (c.expectBottleneck && got.bottleneck !== c.expectBottleneck) {
      problems.push(
        `${c.label}: 律速の判定が ${c.expectBottleneck} のはずが ${got.bottleneck}`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      'fps計算式が元データを再現しません。src/lib/fps/games.ts の係数を確認してください:\n' +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
}
