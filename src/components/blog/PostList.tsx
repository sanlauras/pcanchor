import Link from 'next/link';
import { findCategory } from '@/content/blog/categories';
import type { BlogPost } from '@/content/blog/types';

/** 記事の一覧の1行（ブログトップ・カテゴリ・関連記事で共通）。行全体がリンク */
export function PostList({ posts, compact = false }: { posts: BlogPost[]; compact?: boolean }) {
  if (posts.length === 0) return <p className="text-sm text-dim">まだ記事がありません。</p>;
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {posts.map(({ meta: m }) => (
        <li key={m.slug}>
          <Link href={`/blog/${m.slug}`} className="group block py-4 hover:bg-accent-soft sm:px-2">
            <p className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim">
              <span className="rounded bg-raise px-1.5 py-0.5 font-medium text-ink">{findCategory(m.category)?.label}</span>
              <time dateTime={m.updatedAt}>更新 {m.updatedAt}</time>
              {m.status === 'draft' && <span className="font-bold text-[#b45309]">下書き（開発中だけ表示）</span>}
            </p>
            <p className="font-cond text-lg leading-snug font-bold group-hover:text-accent">{m.title}</p>
            {!compact && <p className="mt-1 text-sm leading-relaxed text-dim">{m.description}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
