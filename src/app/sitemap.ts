import type { MetadataRoute } from 'next';

// メタデータのルートは内部的に Route Handler なので、
// 静的書き出し（output: 'export'）では静的化を明示する必要がある
export const dynamic = 'force-static';
import { cpus, gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';
import { absoluteUrl } from '@/lib/site';

/**
 * サイトマップ。全ページを列挙する。
 * ページを増やしたらここにも足すこと（個別ページはデータから自動で入る）。
 *
 * lastmod（最終更新日）は入れない。以前はビルドした時刻を全ページに入れていたため、
 * 公開のたびに全ページが「更新された」ことになっていた。Google は不正確な lastmod を
 * 信用しなくなるので、正しい日付を持てない間は出さない方がよい（2026-09-26）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixed: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/tools', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/tools/fps', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/tools/build', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/tools/sensitivity', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/gpu', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/cpu', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/games', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.3, changeFrequency: 'yearly' },
  ];

  return [
    ...fixed.map((f) => ({
      url: absoluteUrl(f.path),
      changeFrequency: f.changeFrequency,
      priority: f.priority,
    })),
    ...GAMES.filter((g) => g.supported).map((g) => ({
      url: absoluteUrl(`/games/${g.id}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...gpus.map((g) => ({
      url: absoluteUrl(`/gpu/${g.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...cpus.map((c) => ({
      url: absoluteUrl(`/cpu/${c.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
