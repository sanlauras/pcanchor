import type { MetadataRoute } from 'next';
import { cpus, gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';
import { absoluteUrl } from '@/lib/site';

/**
 * サイトマップ。全ページを列挙する。
 * ページを増やしたらここにも足すこと（個別ページはデータから自動で入る）。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const fixed: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/tools', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/tools/fps', priority: 0.9, changeFrequency: 'weekly' },
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
      lastModified: now,
      changeFrequency: f.changeFrequency,
      priority: f.priority,
    })),
    ...GAMES.filter((g) => g.supported).map((g) => ({
      url: absoluteUrl(`/games/${g.id}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...gpus.map((g) => ({
      url: absoluteUrl(`/gpu/${g.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...cpus.map((c) => ({
      url: absoluteUrl(`/cpu/${c.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
