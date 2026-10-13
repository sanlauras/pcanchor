import { post as fortnite240fpsPc } from './fortnite-240fps-pc';
import { post as fortniteGamingPc } from './fortnite-gaming-pc';
import { post as fortniteSystemRequirements } from './fortnite-system-requirements';
import { post as gamingPcMemory } from './gaming-pc-memory';
import { post as rtx5060FortniteFps } from './rtx-5060-fortnite-fps';
import type { BlogCategoryId, BlogPost } from './types';

/**
 * ブログ記事の一覧（2026-10-13）。記事を足したら、ここに import を1行足す。
 *
 * 下書き（status: 'draft'）は、開発中（npm run dev）だけ一覧に出す。公開のビルドでは、ページも作らず、
 * サイトマップにも入れない（下書きを公開済みとして扱わない）。
 */
const ALL: BlogPost[] = [fortniteGamingPc, fortnite240fpsPc, fortniteSystemRequirements, rtx5060FortniteFps, gamingPcMemory];

const showDrafts = process.env.NODE_ENV === 'development';

/** 見せてよい記事（公開済み。開発中は下書きも）。新しい順 */
export function visiblePosts(): BlogPost[] {
  return ALL.filter((p) => showDrafts || p.meta.status === 'published').sort((a, b) =>
    a.meta.publishedAt < b.meta.publishedAt ? 1 : a.meta.publishedAt > b.meta.publishedAt ? -1 : 0,
  );
}

/** 公開済みの記事だけ（サイトマップ用。開発中でも下書きは入れない） */
export function publishedPosts(): BlogPost[] {
  return visiblePosts().filter((p) => p.meta.status === 'published');
}

export function findPost(slug: string): BlogPost | undefined {
  return visiblePosts().find((p) => p.meta.slug === slug);
}

export function postsInCategory(id: BlogCategoryId): BlogPost[] {
  return visiblePosts().filter((p) => p.meta.category === id);
}

/** 関連記事。meta.related に書いた順で、見せてよいものだけ（まだ無い記事・下書きは飛ばす） */
export function relatedPosts(post: BlogPost): BlogPost[] {
  return post.meta.related.flatMap((slug) => {
    const p = findPost(slug);
    return p ? [p] : [];
  });
}

/** 既存ページ（/tools/fps など）に「関連する記事」として出す記事 */
export function postsForPage(path: string): BlogPost[] {
  return visiblePosts().filter((p) => p.meta.relatedPages.includes(path));
}

/*
 * 読み込んだ時点で記事の情報を確かめる（間違いを公開前にビルドで止める）。
 * slug の重複・使えない slug・存在しないカテゴリ・日付の形・更新日が公開日より前、を見る。
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const seen = new Set<string>();
for (const { meta: m } of ALL) {
  if (!SLUG.test(m.slug) || m.slug === 'category') throw new Error(`ブログ: 使えない slug「${m.slug}」`);
  if (seen.has(m.slug)) throw new Error(`ブログ: slug「${m.slug}」が重複しています`);
  seen.add(m.slug);
  if (!DATE.test(m.publishedAt) || !DATE.test(m.updatedAt)) throw new Error(`ブログ: ${m.slug} の日付の形が違います`);
  if (m.updatedAt < m.publishedAt) throw new Error(`ブログ: ${m.slug} の更新日が公開日より前です`);
  for (const s of m.sources) if (!DATE.test(s.checkedOn)) throw new Error(`ブログ: ${m.slug} の出典「${s.label}」の確認日の形が違います`);
}
