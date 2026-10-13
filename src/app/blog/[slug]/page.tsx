import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PostList } from '@/components/blog/PostList';
import { Toc } from '@/components/blog/Toc';
import { findCategory } from '@/content/blog/categories';
import { findPost, relatedPosts, visiblePosts } from '@/content/blog';
import { hasAdIn } from '@/content/products';
import { JsonLd, pageMetadata } from '@/lib/seo';
import { OPERATOR, SITE, absoluteUrl } from '@/lib/site';

/*
 * 記事のページ（2026-10-13）。並びは「パンくず → カテゴリ → 題名 → 導入 → 日付と筆者 → (広告の表示) → 要点 → 目次 → 本文 → 出典 → 筆者 → 関連記事」。
 * 結論は本文の最初（記事のファイルの Conclusion）に置き、後ろに隠さない。
 */

// 静的書き出しでは、ここで作った記事のページだけが存在する（下書きは公開のビルドでは作らない）
export const dynamicParams = false;

export function generateStaticParams() {
  return visiblePosts().map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return pageMetadata({ title: post.meta.title, description: post.meta.description, path: `/blog/${slug}` });
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const { meta: m, toc, Body } = post;
  const category = findCategory(m.category)!;
  const related = relatedPosts(post);
  const url = absoluteUrl(`/blog/${m.slug}`);

  return (
    <main className="mx-auto max-w-[760px] px-5 pb-12 text-[16.5px]">
      {/* 構造化データ（BlogPosting）。中身はページに表示している題名・日付・筆者だけ */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: m.title,
          description: m.description,
          datePublished: m.publishedAt,
          dateModified: m.updatedAt,
          inLanguage: 'ja',
          mainEntityOfPage: url,
          url,
          image: absoluteUrl('/opengraph-image.jpg'),
          author: { '@type': 'Person', '@id': `${SITE.url}/about#operator`, name: OPERATOR.name, url: absoluteUrl('/about') },
          publisher: { '@id': `${SITE.url}/#organization` },
        }}
      />
      <Breadcrumbs
        trail={[
          { href: '/blog', label: 'ブログ' },
          { href: `/blog/category/${category.id}`, label: category.label },
          { href: `/blog/${m.slug}`, label: m.title },
        ]}
        updated={m.updatedAt}
      />

      <header className="pt-7 pb-6">
        <Link
          href={`/blog/category/${category.id}`}
          className="inline-block rounded bg-raise px-2 py-0.5 text-xs font-medium text-ink hover:text-accent"
        >
          {category.label}
        </Link>
        <h1 className="mt-3 font-cond text-[clamp(1.6rem,4.6vw,2.3rem)] leading-[1.35] font-bold">{m.title}</h1>
        <p className="mt-4 leading-[1.95] text-dim">{m.lead}</p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
          <span>
            公開 <time dateTime={m.publishedAt}>{m.publishedAt}</time>
          </span>
          <span>
            更新 <time dateTime={m.updatedAt}>{m.updatedAt}</time>
          </span>
          <span>
            執筆{' '}
            <Link href="/about" className="text-accent underline">
              {OPERATOR.name}
            </Link>
          </span>
        </p>
        {m.status === 'draft' && (
          <p className="mt-3 rounded bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#7c2d12]">下書きです（開発中だけ表示。公開のページには出ません）</p>
        )}
        {/* 広告リンク（公開してよい製品）が記事に1つでもあるときだけ出す。無いのに出さない */}
        {hasAdIn(m.productSlots) && (
          <p className="mt-3 rounded border border-rule bg-raise px-3 py-2 text-xs text-dim">
            この記事には広告（アフィリエイトリンク）を含みます。リンク先で購入されると、当サイトに紹介料が入ることがあります。
          </p>
        )}
      </header>

      {m.keyPoints.length > 0 && (
        <section aria-label="この記事の要点" className="rounded-xl bg-raise p-5">
          <p className="mb-2 font-cond text-sm font-bold">この記事の要点</p>
          <ul className="list-disc space-y-1.5 pl-5 leading-[1.8] marker:text-accent">
            {m.keyPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>
      )}

      <Toc items={toc} />

      <article className="text-ink">
        <Body />
      </article>

      {m.sources.length > 0 && (
        <section className="mt-12 border-t border-rule pt-5 text-sm">
          <h2 className="mb-2 font-cond text-base font-bold">出典</h2>
          <ul className="space-y-1.5 text-dim">
            {m.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener" className="text-accent underline">
                  {s.label}
                </a>
                （{s.checkedOn} に確認）
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-xl border border-frame bg-panel p-5 text-sm">
        <p className="font-cond text-base font-bold">この記事を書いた人：{OPERATOR.name}</p>
        <p className="mt-1 leading-relaxed text-dim">
          {`${SITE.name}の運営者。小学生のころから FPS を遊んでいて10年以上。記事の fps は当サイトの計算による推定値で、運営者が実際に測ったものではありません。`}
          <Link href="/about" className="text-accent underline">
            運営者について
          </Link>
          {'・'}
          <Link href="/methodology" className="text-accent underline">
            算出方法
          </Link>
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-cond text-lg font-bold">関連する記事</h2>
          <PostList posts={related} compact />
        </section>
      )}
    </main>
  );
}
