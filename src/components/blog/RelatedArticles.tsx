import Link from 'next/link';
import { postsForPage } from '@/content/blog';

/**
 * 既存のページ（ツール・ゲーム別）に出す「関連する記事」の小さな入口（2026-10-13）。
 * 記事の meta.relatedPages にそのページの URL が書いてある記事だけを出す。1件も無ければ何も出さない。
 */
export function RelatedArticles({ path, className = '' }: { path: string; className?: string }) {
  const posts = postsForPage(path);
  if (posts.length === 0) return null;
  return (
    <section className={`border-t border-frame pt-5 ${className}`}>
      <h2 className="mb-1 font-cond text-lg font-bold">関連する記事</h2>
      <p className="mb-3 text-xs text-dim">選び方や数字の見方を、ブログで詳しく解説しています。</p>
      <ul className="space-y-2">
        {posts.map(({ meta: m }) => (
          <li key={m.slug}>
            <Link
              href={`/blog/${m.slug}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-frame bg-panel px-4 py-3 hover:border-accent"
            >
              <span className="font-cond text-sm font-bold group-hover:text-accent">{m.title}</span>
              <span aria-hidden className="shrink-0 font-mono text-accent">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
