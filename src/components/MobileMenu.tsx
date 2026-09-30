'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HOME_NAV, NAV_GROUPS, type NavLink, SITE_INFO_NAV, isCurrentSection } from '@/lib/nav';

/**
 * スマホ幅のメニュー。
 *
 * 以前はヘッダーのメニューを横スクロールさせていたが、画面外の項目（感度換算など）に
 * 気づけなかった。MENU を押すと全項目が目次（INDEX）として縦に並ぶ形にした。
 *
 * 開閉は <details> に任せる（JavaScript が無くても開く）。
 * ただしページ移動はヘッダーを作り直さないので、そのままだと開いたまま残る。
 * リンクを押したときだけ、ここで閉じる。
 *
 * 2026-09-30（ユーザーの要望「ほかの場所をタップしたら閉じてほしい」）:
 * - 開いている間だけ、メニューの後ろに画面を覆う幕を出し、そこをタップすると閉じる。Esc キーでも閉じる
 * - いま開いているページの項目を青くし、左に印を付ける（ヘッダーの下線と同じ判定）
 * - 幕と一覧は、ヘッダーの下端（top-full）から置いている。ヘッダーに背景のぼかし（backdrop-filter）が
 *   かかっているため、fixed で画面全体に広げようとしてもヘッダーの中に閉じ込められるので、
 *   ヘッダーを基準にした absolute で、高さだけ画面いっぱい（100dvh）にしている
 */
export function MobileMenu() {
  const pathname = usePathname();

  function closeFrom(el: Element) {
    el.closest('details')?.removeAttribute('open');
  }

  return (
    <details
      className="group ml-auto md:hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && e.currentTarget.open) {
          e.currentTarget.removeAttribute('open');
          e.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary
        className="cursor-pointer list-none rounded-md border border-frame px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.14em] select-none
                   group-open:border-accent-vivid group-open:bg-accent-vivid group-open:text-on-accent [&::-webkit-details-marker]:hidden"
      >
        <span className="group-open:hidden">MENU</span>
        <span className="hidden group-open:inline">CLOSE</span>
      </summary>

      {/* 後ろの幕。押すと閉じる（キーボードでは Esc で閉じられるので、幕自体はフォーカスさせない） */}
      <div
        aria-hidden
        onClick={(e) => closeFrom(e.currentTarget)}
        className="absolute inset-x-0 top-full h-dvh bg-paper/70 backdrop-blur-sm
                   motion-safe:transition-opacity motion-safe:duration-200 motion-safe:starting:opacity-0"
      />

      <nav
        aria-label="メイン"
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-b border-frame bg-panel shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]
                   motion-safe:transition motion-safe:duration-200 motion-safe:starting:-translate-y-2 motion-safe:starting:opacity-0"
      >
        {/* PC のヘッダーと同じまとめ方（ホーム・ツール・データベース）。中身と順番は nav.ts の NAV_GROUPS */}
        <ul className="px-3 pt-3">
          <MenuItem item={HOME_NAV} pathname={pathname} onNavigate={closeFrom} />
        </ul>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-5 pt-4 pb-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-accent">{group.label}</p>
            <ul className="px-3">
              {group.items.map((item) => (
                <MenuItem key={item.href} item={item} pathname={pathname} onNavigate={closeFrom} />
              ))}
            </ul>
          </div>
        ))}
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t border-rule-soft px-6 py-4 text-xs text-dim">
          {SITE_INFO_NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={(e) => closeFrom(e.currentTarget)} className="hover:text-accent">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}

/** メニューの1行。いま開いているページなら青くし、左に印を付ける */
function MenuItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavLink;
  pathname: string;
  onNavigate: (el: Element) => void;
}) {
  const active = isCurrentSection(pathname, item.href);
  return (
    <li>
      <Link
        href={item.href}
        onClick={(e) => onNavigate(e.currentTarget)}
        aria-current={active ? 'page' : undefined}
        className={`relative flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 active:bg-accent-soft
                    ${active ? 'bg-accent-soft text-accent' : 'hover:bg-accent-soft'}`}
      >
        {/* いま開いているページの印 */}
        <span
          aria-hidden
          className={`h-6 w-1 shrink-0 rounded-full ${active ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-rule'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block font-cond text-base leading-tight font-bold">{item.label}</span>
          {item.sub && <span className="mt-0.5 block text-[11px] leading-tight text-dim">{item.sub}</span>}
        </span>
        <span aria-hidden className={`font-mono text-base ${active ? 'text-accent' : 'text-dim'}`}>
          ›
        </span>
      </Link>
    </li>
  );
}
