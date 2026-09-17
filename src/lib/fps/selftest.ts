import { cpus, gpus } from '@/lib/data';
import { findGame } from './games';
import { ANCHOR, type ResolutionId, lighterScene, predict } from './model';

/**
 * 計算式が実測・読み取り値を再現するかを確認する。
 *
 * ツールのページ（Server Component）の読み込み時に実行しているので、
 * 係数をいじって元データとズレたら **ビルドが落ちる**。
 *
 * 出典:
 *   Valorant … CONTEXT.md「Valorant 実測4点」（自前の実測）
 *   Fortnite … CONTEXT.md「評価済みソース」Boss Benchmarks から読み取った15条件
 *   Apex     … CONTEXT.md「Apex の係数の算出過程」ちもろぐ の測定から選んだ9条件
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
  /** 理論値を決めている側。上限で止まるかは expectUncappedAboveCap で別に見る */
  expectBottleneck?: 'gpu' | 'cpu' | 'balanced';
  /**
   * この条件で実測された 1% Low ÷ 平均fps。
   * プリセットに宣言した lowRatio がこの値を含むかを検証する。
   *
   * fps値そのものではなく比を書いているのは、第三者の測定値を
   * コードに残さないため（CLAUDE.md 絶対ルール1）。
   */
  expectedLowRatio?: number;
  /**
   * 'lighter' のとき、強調枠の「軽い場面」の値（lighterScene）で比べる。
   * 省略時は通常の予想fps。
   */
  scene?: 'lighter';
  /**
   * 上限で止まる条件で、理論値（上限が無い場合の値）が上限を超え、capped になっていることを確かめる。
   * 測定値（expected）は上限込みなので、fps（上限込み）と比べている。
   */
  expectUncappedAboveCap?: boolean;
};

/** 自前の実測機（RX 9070 XT + Ryzen 7 9800X3D） */
const OWN = { gpuFps4kHigh: ANCHOR.gpuFps4kHigh, cpuCeiling: ANCHOR.cpuCeiling };

/** Boss Benchmarks の測定機（RTX 5070 Ti + Ryzen 7 9800X3D） */
const BOSS = { gpuFps4kHigh: 467.5, cpuCeiling: ANCHOR.cpuCeiling };

/**
 * ちもろぐ の測定機。GPUの測定は Core i9 13900K、CPUの測定は RTX 4090 で行われている。
 *
 * 値はDBからモデル名で引く。Apex は30枚のGPUから係数を求めたので、
 * 指数を計算し直したら再現できるかを確かめ直す必要がある（直書きすると気づけない）。
 */
function gpuFpsOf(name: string): number {
  const g = gpus.find((x) => x.name === name);
  if (!g) throw new Error(`selftest: GPU「${name}」がDBに無い`);
  return g.fpsValorant4kHigh;
}
function cpuCeilingOf(name: string): number {
  const c = cpus.find((x) => x.name === name);
  if (!c) throw new Error(`selftest: CPU「${name}」がDBに無い`);
  return c.fpsValorantCeiling;
}
/** GPUの測定: そのGPU + Core i9 13900K */
const chimoGpu = (name: string) => ({
  gpuFps4kHigh: gpuFpsOf(name),
  cpuCeiling: cpuCeilingOf('Core i9-13900K'),
});
/** CPUの測定: RTX 4090 + そのCPU */
const chimoCpu = (name: string) => ({
  gpuFps4kHigh: gpuFpsOf('GeForce RTX 4090'),
  cpuCeiling: cpuCeilingOf(name),
});

const CASES: Case[] = [
  // ---------------------------------------------- Valorant（自前の実測4条件）
  {
    label: 'Valorant 条件B 4K/全て高（完全GPU律速）',
    gameId: 'valorant', presetId: 'high', resolution: '4k', ...OWN,
    expected: 464.6, tolerance: 0.001,
    expectedLowRatio: 0.833,
  },
  {
    label: 'Valorant 条件C 1440p/全て高',
    gameId: 'valorant', presetId: 'high', resolution: '1440p', ...OWN,
    // 解像度係数1.87は小数2桁に丸めた実測値なので、その分だけ緩める
    expected: 868.8, tolerance: 0.005,
    expectedLowRatio: 0.752,
  },
  {
    label: 'Valorant 条件D 4K/全て低',
    gameId: 'valorant', presetId: 'low', resolution: '4k', ...OWN,
    expected: 807.5, tolerance: 0.005,
    expectedLowRatio: 0.758,
  },
  {
    label: 'Valorant 条件A 1080p/全て低（CPU天井で頭打ち）',
    gameId: 'valorant', presetId: 'low', resolution: '1080p', ...OWN,
    expected: 970.3, tolerance: 0.001, expectBottleneck: 'cpu',
    expectedLowRatio: 0.697,
  },

  // ------------------------------------- Fortnite（4K = 係数の基準点。ぴったり合う）
  {
    label: 'Fortnite 4K/Epic（GPU 97%）',
    gameId: 'fortnite', presetId: 'epic', resolution: '4k', ...BOSS,
    expected: 40, tolerance: 0.01, expectBottleneck: 'gpu',
    expectedLowRatio: 0.75,
  },
  {
    label: 'Fortnite 4K/中（GPU 97%）',
    gameId: 'fortnite', presetId: 'medium', resolution: '4k', ...BOSS,
    expected: 208, tolerance: 0.01, expectBottleneck: 'gpu',
    expectedLowRatio: 0.601,
  },
  {
    label: 'Fortnite 4K/低（GPU 98%）',
    gameId: 'fortnite', presetId: 'low', resolution: '4k', ...BOSS,
    expected: 315, tolerance: 0.01, expectBottleneck: 'gpu',
    expectedLowRatio: 0.613,
  },
  {
    label: 'Fortnite 4K/Performance（GPU 98%）',
    gameId: 'fortnite', presetId: 'performance', resolution: '4k', ...BOSS,
    expected: 525, tolerance: 0.01, expectBottleneck: 'gpu',
    expectedLowRatio: 0.276,
  },

  // ------------------------------- Fortnite（4K以外。ここが係数の当てはまりを見る本番）
  {
    label: 'Fortnite 1440p/Epic',
    gameId: 'fortnite', presetId: 'epic', resolution: '1440p', ...BOSS,
    // 3点フィットのため 1440p は -8% ずれる。シーンのばらつき(約10%)の範囲内
    expected: 73, tolerance: 0.12,
    expectedLowRatio: 0.671,
  },
  {
    label: 'Fortnite 1080p/Epic',
    gameId: 'fortnite', presetId: 'epic', resolution: '1080p', ...BOSS,
    expected: 96, tolerance: 0.05,
    expectedLowRatio: 0.594,
  },
  {
    label: 'Fortnite 1440p/中',
    gameId: 'fortnite', presetId: 'medium', resolution: '1440p', ...BOSS,
    expected: 301, tolerance: 0.05,
    expectedLowRatio: 0.542,
  },
  {
    label: 'Fortnite 1080p/中',
    gameId: 'fortnite', presetId: 'medium', resolution: '1080p', ...BOSS,
    expected: 400, tolerance: 0.05,
    expectedLowRatio: 0.427,
  },
  {
    label: 'Fortnite 1440p/低',
    gameId: 'fortnite', presetId: 'low', resolution: '1440p', ...BOSS,
    expected: 459, tolerance: 0.05,
    expectedLowRatio: 0.481,
  },
  {
    label: 'Fortnite 1440p/Performance（CPU天井で頭打ち）',
    gameId: 'fortnite', presetId: 'performance', resolution: '1440p', ...BOSS,
    expected: 651, tolerance: 0.02, expectBottleneck: 'cpu',
    expectedLowRatio: 0.261,
  },
  {
    label: 'Fortnite 1080p/Performance（CPU天井で頭打ち）',
    gameId: 'fortnite', presetId: 'performance', resolution: '1080p', ...BOSS,
    // 読み取り値593はシーンが重かった回。CPU天井651で頭打ちになる予測とは約10%ずれる
    expected: 593, tolerance: 0.12, expectBottleneck: 'cpu',
    expectedLowRatio: 0.261,
  },
  {
    label: 'Fortnite 1080p/低（GPU79%の混在領域）',
    gameId: 'fortnite', presetId: 'low', resolution: '1080p', ...BOSS,
    // GPUもCPUも飽和していない混在領域。min()では表せず、モデルは過大評価する。
    // CONTEXT.md「この指数の限界」にある既知の制約。誤差の上限を固定するために置いている
    expected: 504, tolerance: 0.2,
    expectedLowRatio: 0.528,
  },

  // ---------------------------- Apex（ちもろぐ・GPUの測定。射撃訓練場の重い場面）
  // 係数は66点のフィットなので、ぴったり合う基準点は無い。ズレ＋2〜3%を許容にしている
  {
    label: 'Apex 4K/最高 RTX 4080',
    gameId: 'apex', presetId: 'max', resolution: '4k', ...chimoGpu('GeForce RTX 4080'),
    expected: 127.4, tolerance: 0.03, expectBottleneck: 'gpu',
    expectedLowRatio: 0.522,
  },
  {
    label: 'Apex 1440p/最高 RTX 4070',
    gameId: 'apex', presetId: 'max', resolution: '1440p', ...chimoGpu('GeForce RTX 4070'),
    expected: 154.1, tolerance: 0.06, expectBottleneck: 'gpu',
    expectedLowRatio: 0.573,
  },
  {
    // 効き方(gpuScaling)は基準GPU（指数100）を軸にしている。1 に戻すと
    // 指数の低いGPUほど低く出て、この条件（指数33）が約-35%ずれて落ちる
    label: 'Apex 1080p/最高 RTX 4060',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoGpu('GeForce RTX 4060'),
    expected: 142.0, tolerance: 0.08, expectBottleneck: 'gpu',
    expectedLowRatio: 0.548,
  },
  {
    label: 'Apex 1080p/最高 RTX 4070 SUPER',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoGpu('GeForce RTX 4070 SUPER'),
    expected: 219.3, tolerance: 0.08, expectBottleneck: 'gpu',
    expectedLowRatio: 0.627,
  },
  {
    label: 'Apex 1080p/低 RTX 3060 12GB',
    gameId: 'apex', presetId: 'low', resolution: '1080p', ...chimoGpu('GeForce RTX 3060 12GB'),
    expected: 151.8, tolerance: 0.05, expectBottleneck: 'gpu',
    expectedLowRatio: 0.545,
  },
  {
    // 中の設定係数は10枚の平均。RX 7600 はその中で最も中が伸びた1枚なので -11% ずれる
    label: 'Apex 1080p/中 RX 7600',
    gameId: 'apex', presetId: 'medium', resolution: '1080p', ...chimoGpu('Radeon RX 7600'),
    expected: 185.5, tolerance: 0.13, expectBottleneck: 'gpu',
    expectedLowRatio: 0.551,
  },
  {
    // 性能指数15未満は高めに出る（画面の注記にも書いている既知の制約）。
    // VRAM 4GB のカード。誤差の上限を固定するために置いている
    label: 'Apex 1080p/最高 GTX 1650 GDDR6（指数15未満・既知の過大評価）',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoGpu('GeForce GTX 1650 (GDDR6)'),
    expected: 50.6, tolerance: 0.35,
  },

  // ------------------------------ Apex（ちもろぐ・CPUの測定。キングスキャニオン）
  // CPU律速の条件の 1% Low 比は 0.74〜0.83 で、GPU律速から取った宣言レンジより高い。
  // 1% Low は低めに（安全側に）出る。GPU律速のレンジを広げると他が甘くなるので検証しない
  {
    label: 'Apex 1080p/最高 RTX 4090 + Ryzen 5 7500F（CPU律速）',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoCpu('Ryzen 5 7500F'),
    expected: 216.9, tolerance: 0.02, expectBottleneck: 'cpu',
  },
  {
    label: 'Apex 1080p/最高 RTX 4090 + Ryzen 7 9800X3D（300fps上限）',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoCpu('Ryzen 7 9800X3D'),
    // 画面上は300で止まるが、理論値はCPU側（9800X3D）で決まる
    expected: 298.4, tolerance: 0.02, expectBottleneck: 'cpu',
    expectUncappedAboveCap: true,
  },

  // ------------------- Apex（ちもろぐ・CPUの測定を「実戦マップでのプレイ」の再現に使う）
  // 場面の倍率 1.35 は、この1組目（13900K + 4090・4K最高）の射撃訓練場と実戦マップの比
  {
    label: 'Apex 実戦マップ 4K/最高 RTX 4090 + Core i9 13900K（GPU律速・倍率の出どころ）',
    gameId: 'apex', presetId: 'max', resolution: '4k', ...chimoCpu('Core i9-13900K'),
    scene: 'lighter',
    // 重い場面の予想が既に測定より +6% 高いので、倍率を掛けても +5.5% ずれる
    expected: 228.9, tolerance: 0.08,
  },
  {
    label: 'Apex 実戦マップ 1080p/最高 RTX 4090 + Ryzen 5 7500F（CPUが上限で伸びない）',
    gameId: 'apex', presetId: 'max', resolution: '1080p', ...chimoCpu('Ryzen 5 7500F'),
    scene: 'lighter',
    expected: 216.9, tolerance: 0.02,
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

    let fps = got.fps;
    if (c.scene === 'lighter') {
      const cmp = game.highlight?.comparison;
      if (!cmp) {
        problems.push(`${c.label}: 軽い場面の倍率（highlight.comparison）が無い`);
        continue;
      }
      fps = lighterScene(got, cmp).fps;
    }

    const diff = Math.abs(fps - c.expected) / c.expected;
    if (diff > c.tolerance) {
      problems.push(
        `${c.label}: 元データ ${c.expected} に対し計算値 ${fps.toFixed(1)}` +
          `（ズレ ${(diff * 100).toFixed(1)}%、許容 ${(c.tolerance * 100).toFixed(1)}%）`,
      );
    }
    if (c.expectUncappedAboveCap && !(got.capped && got.cap !== null && got.uncapped > got.cap)) {
      problems.push(
        `${c.label}: 上限で止まる条件なのに、理論値 ${got.uncapped.toFixed(1)} が上限を超えていない`,
      );
    }
    if (c.expectBottleneck && got.bottleneck !== c.expectBottleneck) {
      problems.push(
        `${c.label}: 律速の判定が ${c.expectBottleneck} のはずが ${got.bottleneck}`,
      );
    }

    // 1% Low の比。宣言したレンジが実測の比を含んでいるか
    if (c.expectedLowRatio !== undefined) {
      const r = preset.lowRatio;
      if (!r) {
        problems.push(`${c.label}: lowRatio が未設定`);
      } else if (c.expectedLowRatio < r.min || c.expectedLowRatio > r.max) {
        problems.push(
          `${c.label}: 実測の1%Low比 ${c.expectedLowRatio} が` +
            ` 宣言レンジ ${r.min}〜${r.max} の外にある`,
        );
      }
      if (got.fps1Low === null) {
        problems.push(`${c.label}: 1% Low が計算されていない`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      'fps計算式が元データを再現しません。src/lib/fps/games.ts の係数を確認してください:\n' +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
}
