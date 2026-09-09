/**
 * 性能指数どうしを比べて「何倍か」を出す。
 *
 * 指数は推定値で誤差±15〜20%あるため、差が小さい相手との倍率には意味がない。
 * 出してよい場合だけ倍率を返し、そうでなければ倍率そのものを返さない。
 * こうしておけば、画面側で誤って小さい差を断定的に出しようがない。
 *
 * 閾値をアーキテクチャで変えているのは、指数の作りに理由がある。
 * 指数はアーキごとに1つの効率係数を掛けて出している（data/make_index.py）ので、
 *
 *   同じアーキ同士 … 同じ係数が分子と分母で打ち消し合う。比は比較的信用できる
 *   違うアーキ同士 … 係数自体の誤差がそのまま比に乗る
 *
 * CONTEXT.md「この指数の限界」の
 * 「近接モデルの順位は信用できない／世代をまたいだ大きな差はそれなりに信用できる」
 * を、数値の形にしたもの。
 */

/** 同じアーキ同士で倍率を出す最小の相対差 */
const SAME_ARCH_MIN = 0.05;

/** アーキが違うときに倍率を出す最小の相対差 */
const CROSS_ARCH_MIN = 0.15;

export type IndexComparison =
  /** 差が誤差に埋もれるので倍率を出さない */
  | { kind: 'similar'; diffPct: number; sameArch: boolean }
  /** 倍率を出してよい */
  | { kind: 'ratio'; ratio: number; diffPct: number; sameArch: boolean };

export type ComparedModel = {
  name: string;
  index: number;
  arch: string;
  /** 基準（選択中で最も指数が低いモデル）との比較結果。基準自身は null */
  vsBaseline: IndexComparison | null;
};

/** 2つの指数を比べる。base を 1 としたときの target の倍率 */
export function compareIndex(
  target: { index: number; arch: string },
  base: { index: number; arch: string },
): IndexComparison {
  const sameArch = target.arch === base.arch;
  const ratio = target.index / base.index;
  const diffPct = (ratio - 1) * 100;
  const min = sameArch ? SAME_ARCH_MIN : CROSS_ARCH_MIN;

  if (Math.abs(ratio - 1) < min) {
    return { kind: 'similar', diffPct, sameArch };
  }
  return { kind: 'ratio', ratio, diffPct, sameArch };
}

/**
 * 選択中のモデルを、指数の高い順に並べて倍率を付ける。
 * 基準は最も指数が低いモデル。2件でも3件でも同じ形になる。
 */
export function rankByIndex(
  models: readonly { name: string; index: number; arch: string }[],
): ComparedModel[] {
  if (models.length === 0) return [];

  const sorted = [...models].sort((a, b) => b.index - a.index);
  const base = sorted[sorted.length - 1]!;

  return sorted.map((m) => ({
    name: m.name,
    index: m.index,
    arch: m.arch,
    vsBaseline: m === base ? null : compareIndex(m, base),
  }));
}
