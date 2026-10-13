import type { BlogCategoryId } from './types';

/**
 * ブログのカテゴリ（2026-10-13）。最初は3つに絞っている（細かく分けすぎない）。記事が増えたら足す。
 * URL は /blog/category/[id]。
 */
export type BlogCategory = { id: BlogCategoryId; label: string; description: string };

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 'game-pc',
    label: 'ゲーム別おすすめPC',
    description: 'ゲームと目標fpsから、必要なGPU・CPUと選び方をまとめた記事です。',
  },
  {
    id: 'fps',
    label: 'FPS・性能',
    description: '特定のGPUやfpsの目標について、当サイトの推定値をもとに条件ごとに解説した記事です。',
  },
  {
    id: 'parts',
    label: 'CPU・GPU・パーツ解説',
    description: 'スペックの読み方や、メモリなどのパーツ選びの考え方を解説した記事です。',
  },
];

export function findCategory(id: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.id === id);
}
