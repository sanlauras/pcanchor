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
  /** ヘッダーとフッターのロゴの下に添える文言（2026-09-30 ユーザーの指定） */
  logoTagline: 'あなたのPCを、最高のパフォーマンスへ。',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pcanchor.jp',
  description:
    'GPUとCPUを選ぶと、ゲームごとの推定fpsとボトルネックが分かります。モデル別の性能はメーカー公式スペックから自前で計算し、自前の実測を基準点にしています。',
} as const;

/**
 * 運営者（2026-09-27 追加）。ペンネームはユーザーの指定。
 * /about の紹介と、構造化データ（Person）の両方で使う。
 */
export const OPERATOR = {
  name: 'そうし',
} as const;

/** 絶対URLを作る。canonical と sitemap で使う */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}
