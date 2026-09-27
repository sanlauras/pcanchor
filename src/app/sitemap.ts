import type { MetadataRoute } from 'next';

// メタデータのルートは内部的に Route Handler なので、
// 静的書き出し（output: 'export'）では静的化を明示する必要がある
export const dynamic = 'force-static';
import { lastUpdated } from '@/lib/changelog';
import { cpus, gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';
import { absoluteUrl } from '@/lib/site';

/**
 * サイトマップ。全ページを列挙する。
 * ページを増やしたらここにも足すこと（個別ページはデータから自動で入る）。
 *
 * lastmod（最終更新日）は、更新履歴（src/lib/changelog.ts）から決めた日付を入れる（2026-09-27）。
 * ページに表示している「最終更新」と同じ値。以前はビルドした時刻を全ページに入れていて、
 * 公開のたびに全ページが「更新された」ことになっていたため、一度外していた（2026-09-26）。
 *
 * priority と changefreq は入れない。Google はどちらも使っていないと公表している（2026-09-27 に外した）。
 */
const FIXED = [
  '/',
  '/tools',
  '/tools/fps',
  '/tools/build',
  '/tools/sensitivity',
  '/gpu',
  '/cpu',
  '/games',
  '/methodology',
  '/about',
  '/changelog',
  '/privacy',
  '/terms',
  '/contact',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...FIXED,
    ...GAMES.filter((g) => g.supported).map((g) => `/games/${g.id}`),
    ...gpus.map((g) => `/gpu/${g.slug}`),
    ...cpus.map((c) => `/cpu/${c.slug}`),
  ];
  return paths.map((path) => ({ url: absoluteUrl(path), lastModified: lastUpdated(path) }));
}
