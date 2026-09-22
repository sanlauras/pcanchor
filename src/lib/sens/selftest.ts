import { cm360, convertSens, edpi, scopedCm360, sensFromCm360 } from './convert';
import { findSensGame } from './games';

/**
 * 感度の係数が正しいかを、参考サイトが公開している換算の関係で確かめる。
 *
 * ツールのページ（Server Component）の読み込み時に実行しているので、
 * 係数をいじって出どころとズレたら **ビルドが落ちる**。
 *
 * 使っているのは、許諾を得たサイトが本文で公開している「◯◯の感度1.0は△△で約□□」
 * という関係。係数そのものとは別の書かれ方なので、係数の写し間違いを検出できる。
 * 出典は CONTEXT.md「感度換算の係数」。
 */

type RatioCase = {
  label: string;
  fromId: string;
  toId: string;
  /** 元のゲームの感度 */
  sens: number;
  /** 参考サイトが書いている換算後の値（同じDPI） */
  expected: number;
  /** 許容する相対誤差 */
  tolerance: number;
};

const RATIO_CASES: RatioCase[] = [
  {
    label: 'CS2 1.0 → Overwatch 2 約3.33',
    fromId: 'cs2', toId: 'overwatch2', sens: 1, expected: 3.33, tolerance: 0.01,
  },
  {
    label: 'CS2 1.0 → Fortnite 約3.96%',
    fromId: 'cs2', toId: 'fortnite', sens: 1, expected: 3.96, tolerance: 0.01,
  },
  {
    label: 'VALORANT 1.0 → CS:GO 3.18倍',
    fromId: 'valorant', toId: 'cs2', sens: 1, expected: 3.18, tolerance: 0.01,
  },
  {
    label: 'Apex 1.0 → CS2 1.0（同じスケール）',
    fromId: 'apex', toId: 'cs2', sens: 1, expected: 1, tolerance: 0.001,
  },
];

/** 往復や逆算の確認に使う条件。どのDPIでも成り立つはず */
const DPI_CASES = [400, 800, 1600];

export function assertSensConversionIsConsistent(): void {
  const problems: string[] = [];

  // 1. 参考サイトが公開している換算の関係を再現できるか
  for (const c of RATIO_CASES) {
    const from = findSensGame(c.fromId);
    const to = findSensGame(c.toId);
    const got = convertSens({ yaw: from.yaw, sens: c.sens, dpi: 800 }, { yaw: to.yaw, dpi: 800 });
    const diff = Math.abs(got - c.expected) / c.expected;
    if (diff > c.tolerance) {
      problems.push(
        `${c.label}: 参考サイトの ${c.expected} に対し計算値 ${got.toFixed(3)}` +
          `（ズレ ${(diff * 100).toFixed(1)}%、許容 ${(c.tolerance * 100).toFixed(1)}%）`,
      );
    }
  }

  for (const dpi of DPI_CASES) {
    const valorant = findSensGame('valorant');
    const apex = findSensGame('apex');
    const sens = 0.4;

    // 2. 往復変換。A→B→A で元の感度に戻る
    const toApex = convertSens({ yaw: valorant.yaw, sens, dpi }, { yaw: apex.yaw, dpi });
    const back = convertSens({ yaw: apex.yaw, sens: toApex, dpi }, { yaw: valorant.yaw, dpi });
    if (Math.abs(back - sens) > 1e-9) {
      problems.push(`往復変換(${dpi}DPI): ${sens} → ${toApex} → ${back} で元に戻らない`);
    }

    // 3. 振り向き距離をそろえる、という定義どおりになっているか
    const cmFrom = cm360({ yaw: valorant.yaw, sens, dpi });
    const cmTo = cm360({ yaw: apex.yaw, sens: toApex, dpi });
    if (Math.abs(cmTo - cmFrom) / cmFrom > 1e-9) {
      problems.push(`振り向き距離(${dpi}DPI): ${cmFrom} と ${cmTo} が一致しない`);
    }

    // 4. 振り向き距離からの逆算
    const reSens = sensFromCm360(cmFrom, valorant.yaw, dpi);
    if (Math.abs(reSens - sens) / sens > 1e-9) {
      problems.push(`逆算(${dpi}DPI): ${cmFrom}cm から ${reSens} が出たが、元は ${sens}`);
    }

    // 5. DPIを2倍にしたら、同じ振り向きに必要な感度は半分
    const halfSens = convertSens({ yaw: valorant.yaw, sens, dpi }, { yaw: valorant.yaw, dpi: dpi * 2 });
    if (Math.abs(halfSens - sens / 2) > 1e-9) {
      problems.push(`DPI2倍(${dpi}DPI): 感度が ${halfSens} で、半分の ${sens / 2} になっていない`);
    }

    // 6. eDPI
    if (edpi(sens, dpi) !== sens * dpi) {
      problems.push(`eDPI(${dpi}DPI): 計算が DPI × 感度 になっていない`);
    }

    // 7. 覗き込み時の振り向き距離。倍率が上がるほど距離は短くなる
    const hip = cm360({ yaw: valorant.yaw, sens, dpi });
    const scopeCases: [number, number][] = [
      [1, hip],
      [0.5, hip * 2],
      [2, hip / 2],
    ];
    for (const [mult, want] of scopeCases) {
      const got = scopedCm360(hip, mult);
      if (Math.abs(got - want) / want > 1e-9) {
        problems.push(`スコープ倍率 ${mult}(${dpi}DPI): ${got} で、${want} になっていない`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      '感度の換算が出どころと合いません。src/lib/sens/games.ts の係数を確認してください:\n' +
        problems.map((p) => `  - ${p}`).join('\n'),
    );
  }
}
