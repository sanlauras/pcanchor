import type { MetadataRoute } from 'next';

// メタデータのルートは内部的に Route Handler なので、
// 静的書き出し（output: 'export'）では静的化を明示する必要がある
export const dynamic = 'force-static';
import { absoluteUrl } from '@/lib/site';

/**
 * AI の学習用クローラーは、Cloudflare の設定で既に拒否されている（403 を返す。2026-09-26 の SEO監査で確認）。
 * robots.txt が「全部許可」のままだと、書いてあることと実際の動きが食い違うので、同じものを「不可」と書く（2026-09-27）。
 * 挙動は変わらない。検索エンジンと、検索結果の表示に使うクローラーは今まで通り許可する。
 *
 * AI の学習を許可する方針に変えるときは、Cloudflare 側の設定を外し、ここからも消すこと（両方を揃える）。
 */
const BLOCKED_AI_TRAINING = ['GPTBot', 'ClaudeBot', 'CCBot', 'Bytespider', 'cohere-ai', 'Amazonbot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_AI_TRAINING, disallow: '/' },
      { userAgent: '*', allow: '/' },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
