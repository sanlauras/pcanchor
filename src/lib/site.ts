/**
 * サイト全体の基本情報。
 *
 * URL は本番ドメインを既定にしてある。
 * ステージング等で変えたい場合は NEXT_PUBLIC_SITE_URL で上書きできる。
 * ここを変えれば canonical・sitemap・OGP がすべて追随する。
 */
export const SITE = {
  name: 'PCアンカー',
  nameEn: 'PC Anchor',
  tagline: 'ゲーミングPCの実測基準',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pcanchor.jp',
  description:
    'GPUとCPUを選ぶと、ゲームごとの推定fpsとボトルネックが分かります。モデル別の性能はメーカー公式スペックから自前で計算し、自前の実測を基準点にしています。',
} as const;

/** 絶対URLを作る。canonical と sitemap で使う */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}
