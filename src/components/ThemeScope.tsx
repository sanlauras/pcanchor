'use client';

import { usePathname } from 'next/navigation';

/**
 * ページ全体（ヘッダー・本文・フッター）を包み、ブログの URL のときだけ明るい配色（globals.css の .theme-light）を当てる
 * （2026-10-13。ユーザーの決定「ブログはヘッダー・フッターも含めて明るい専用の見た目」）。
 *
 * 既存ページのファイルを動かさずに済むよう、URL を見て色の設定を切り替えるだけにしている。
 * 静的書き出しでは、ページごとに URL が決まった状態で HTML が作られるので、最初の表示から正しい配色で出る（ちらつかない）。
 * ブログ以外では display: contents の箱になり、今までの並び方（body の縦並び）を変えない。
 */
export function ThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/');
  return isBlog ? (
    <div className="theme-light flex min-h-screen flex-1 flex-col">{children}</div>
  ) : (
    <div className="contents">{children}</div>
  );
}
