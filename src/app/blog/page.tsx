import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PostList } from '@/components/blog/PostList';
import { ToolCta } from '@/components/blog/ToolCta';
import { BLOG_CATEGORIES } from '@/content/blog/categories';
import { postsInCategory, visiblePosts } from '@/content/blog';
import { BLOG_NAV } from '@/lib/nav';
import { pageMetadata } from '@/lib/seo';
import { OPERATOR, SITE } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  // メニューと同じ「PC選びのガイド」に統一（2026-11-09 段階6。URL は /blog のまま）
  title: 'PC選びのガイド｜ゲーミングPCの選び方と性能の解説',
  description:
    'PC ANCHOR のPC選びのガイド。ゲームと目標fpsから必要なGPU・CPUを選ぶ方法や、スペックの読み方を、当サイトの性能の推定値（誤差±15〜20%）と公式の情報をもとに解説します。',
  path: '/blog',
});

/*
 * ブログトップ（2026-10-13）。
 * 人気記事の欄は作らない（アクセスの実データが無い間に、架空の順位を作らない）。
 * 記事が少ない間は検索機能も作らない。
 */
export default function BlogIndexPage() {
  const posts = visiblePosts();
  const featured = posts.filter((p) => p.meta.featured);
  // 「まず読んでほしい記事」に出した記事は、新しい記事の一覧で繰り返さない（2026-11-09 段階6）
  const latest = posts.filter((p) => !p.meta.featured).slice(0, 10);
  const latestUpdate = posts.map((p) => p.meta.updatedAt).sort().at(-1);

  return (
    <main className="mx-auto max-w-[920px] px-5 pb-10">
      <Breadcrumbs trail={[{ href: '/blog', label: BLOG_NAV.label }]} updated={latestUpdate} />

      <header className="border-b border-rule pt-8 pb-8">
        <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-accent">PC ANCHOR GUIDE</p>
        <h1 className="font-cond text-[clamp(1.9rem,5vw,2.8rem)] leading-tight font-bold">{BLOG_NAV.label}</h1>
        <p className="mt-2 font-cond text-lg font-bold text-dim">{BLOG_NAV.sub}</p>
        <p className="mt-4 max-w-[62ch] leading-[1.9] text-dim">
          {`${SITE.name}の「${BLOG_NAV.label}」です。ゲームと目標のfpsから、必要なGPUとCPUを選ぶための記事を書いています。`}
          {'記事の fps は、当サイトのツールと同じ計算で出した推定値（誤差±15〜20%）で、測ったものではありません。公式の情報は出典と確認日を添えています。'}
          {`執筆は運営者の${OPERATOR.name}です。`}
        </p>
      </header>

      {featured.length > 0 && (
        <section className="pt-10">
          <h2 className="mb-4 font-cond text-xl font-bold">まず読んでほしい記事</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {featured.map(({ meta: m }) => (
              <li key={m.slug}>
                <Link
                  href={`/blog/${m.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-frame bg-panel p-5 hover:border-accent"
                >
                  <p className="mb-2 text-xs text-dim">
                    <time dateTime={m.updatedAt}>更新 {m.updatedAt}</time>
                  </p>
                  <p className="font-cond text-lg leading-snug font-bold group-hover:text-accent">{m.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{m.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest.length > 0 && (
        <section className="pt-12">
          <h2 className="mb-4 font-cond text-xl font-bold">{featured.length > 0 ? 'そのほかの新しい記事' : '新しい記事'}</h2>
          <PostList posts={latest} />
        </section>
      )}

      <section className="pt-12">
        <h2 className="mb-4 font-cond text-xl font-bold">カテゴリ</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {/* 記事が1本も無いカテゴリは出さない（ページも作っていない） */}
          {BLOG_CATEGORIES.filter((c) => postsInCategory(c.id).length > 0).map((c) => (
            <li key={c.id}>
              <Link
                href={`/blog/category/${c.id}`}
                className="group flex h-full flex-col rounded-xl border border-frame bg-panel p-4 hover:border-accent"
              >
                <span className="font-cond text-base font-bold group-hover:text-accent">{c.label}</span>
                <span className="mt-1 text-xs leading-relaxed text-dim">{c.description}</span>
                <span className="mt-2 font-mono text-[11px] text-dim">{postsInCategory(c.id).length} 記事</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ToolCta href="/tools/fps" title="自分のPCで何fps出るか、すぐに調べたい人は" button="fps予想を開く">
        GPUとCPUを選ぶだけで、ゲームごとの推定fpsと、GPUとCPUのどちらが上限を決めているかが分かります。
      </ToolCta>
    </main>
  );
}
