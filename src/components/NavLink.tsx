'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCurrentSection } from '@/lib/nav';

/**
 * ヘッダーのメニューの1項目。いま開いているページ（とその下のページ）に青の下線を引く
 * （2026-09-27 の暗いデザインへの作り直し。イメージ画像の「ホーム」の表示）。
 *
 * ページのパスを読むだけで、リンク先や文言は変えない。
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isCurrentSection(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex shrink-0 items-center px-2.5 font-cond text-sm font-bold whitespace-nowrap hover:text-accent
                  after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:content-['']
                  ${active ? 'text-accent after:bg-accent after:shadow-[0_0_8px_var(--accent)]' : 'text-dim'}`}
    >
      {label}
    </Link>
  );
}
