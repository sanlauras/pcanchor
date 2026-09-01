import { cpus, gpus } from './index';

/**
 * ヘッダーに出す集計。
 * プロトタイプではハードコードされていたが、実データから数えると値がずれていたため
 * （「ソース確認済み 118」は実際には 113 件）、ここで算出する。
 */
export const tally = {
  gpuCount: gpus.length,
  cpuCount: cpus.length,
  /** verified が「準」で始まらない = 一次ソースで直接確認できたもの */
  verifiedCount: [...gpus, ...cpus].filter((r) => !r.verified.startsWith('準')).length,
  /**
   * 検証の過程でメーカー公式と食い違っていた件数。
   * CONTEXT.md「スペックデータの検証状況」に記録された3件で、
   * 修正済みのためデータからは数えられない定数。
   */
  correctionsFound: 3,
};
