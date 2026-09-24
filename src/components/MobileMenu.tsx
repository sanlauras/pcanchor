'use client';

import Link from 'next/link';
import { HEADER_NAV } from '@/lib/nav';

/**
 * スマホ幅のメニュー。
 *
 * 以前はヘッダーのメニューを横スクロールさせていたが、画面外の項目（感度換算など）に
 * 気づけなかった。MENU を押すと全項目が目次（INDEX）として縦に並ぶ形にした。
 *
 * 開閉は <details> に任せる（JavaScript が無くても開く）。
 * ただしページ移動はヘッダーを作り直さないので、そのままだと開いたまま残る。
 * リンクを押したときだけ、ここで閉じる。
 */
export function MobileMenu() {
  function close(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.closest('details')?.removeAttribute('open');
  }

  return (
    <details className="group ml-auto md:hidden">
      <summary
        className="cursor-pointer list-none border border-ink px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] select-none
                   group-open:bg-ink group-open:text-paper [&::-webkit-details-marker]:hidden"
      >
        MENU
      </summary>
      <nav
        aria-label="メイン"
        className="absolute inset-x-0 top-full border-b-2 border-ink bg-panel shadow-[0_8px_16px_rgba(18,20,22,0.08)]"
      >
        <p className="bg-ink px-5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-paper">
          INDEX
        </p>
        <ul>
          {HEADER_NAV.map((item) => (
            <li key={item.href} className="border-t border-rule-soft first:border-t-0">
              <Link
                href={item.href}
                onClick={close}
                className="block px-5 py-3 font-cond text-base font-bold hover:bg-accent-soft hover:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
