import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PostList } from '@/components/blog/PostList';
import { BLOG_CATEGORIES, findCategory } from '@/content/blog/categories';
import { postsInCategory } from '@/content/blog';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

// 見せてよい記事が1本も無いカテゴリは、ページを作らない（中身の無いページを検索に出さない）
export function generateStaticParams() {
  return BLOG_CATEGORIES.filter((c) => postsInCategory(c.id).length > 0).map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<'/blog/category/[category]'>): Promise<Metadata> {
  const { category } = await params;
  const c = findCategory(category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.label}の記事一覧｜ブログ`,
    description: `PC ANCHOR のブログの「${c.label}」の記事一覧。${c.description}`,
    path: `/blog/category/${c.id}`,
  });
}

export default async function BlogCategoryPage({ params }: PageProps<'/blog/category/[category]'>) {
  const { category } = await params;
  const c = findCategory(category);
  if (!c || postsInCategory(c.id).length === 0) notFound();
  const posts = postsInCategory(c.id);
  const latestUpdate = posts.map((p) => p.meta.updatedAt).sort().at(-1);

  return (
    <main className="mx-auto max-w-[920px] px-5 pb-10">
      <Breadcrumbs
        trail={[
          { href: '/blog', label: 'ブログ' },
          { href: `/blog/category/${c.id}`, label: c.label },
        ]}
        updated={latestUpdate}
      />
      <header className="border-b border-rule pt-8 pb-7">
        <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-accent">CATEGORY</p>
        <h1 className="font-cond text-[clamp(1.7rem,4.6vw,2.4rem)] leading-tight font-bold">{c.label}</h1>
        <p className="mt-3 max-w-[62ch] leading-[1.9] text-dim">{c.description}</p>
      </header>
      <section className="pt-8">
        <PostList posts={posts} />
      </section>
    </main>
  );
}
