'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ToolIcon } from '@/components/ToolIcon';
import { type NavGroup as NavGroupData, isCurrentSection } from '@/lib/nav';

/**
 * PC のヘッダーの「ツール ∨」「データベース ∨」（2026-09-30 ユーザーの要望。valorantnews.jp を参考にした形）。
 *
 * 開き方:
 * - マウス: カーソルを合わせると開き、外れると閉じる。名前と箱の間にすき間を作らない（箱の上の余白も当たり判定に含める）
 * - キーボード: 名前はボタン。Enter / スペースで開閉、Esc で閉じる、Tab で中のリンクへ進める。外へ Tab で抜けたら閉じる
 * - タップ（カーソルの無い端末）: 名前をタップで開閉、外をタップで閉じる
 *   （タップでもマウスの「合わせた」合図が先に来るので、pointerType がマウスのときだけ合わせて開くようにしている）
 *
 * **中のリンクは閉じている間も HTML に残す**（visibility で隠すだけ）。検索エンジンがたどれる内部リンクを減らさないため。
 */
export function NavGroup({ group }: { group: NavGroupData }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = group.items.some((item) => isCurrentSection(pathname, item.href));

  // 開いている間だけ、外のタップと Esc を見張る（閉じるのは合図が来たときだけ）
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      ref.current?.querySelector('button')?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative flex h-full"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          // マウスでは合わせた時点で開いているので、押しても閉じない。キーボードとタップは開閉を切り替える
          if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') setOpen(true);
          else setOpen((o) => !o);
        }}
        className={`relative flex shrink-0 cursor-pointer items-center gap-1 px-2.5 font-cond text-sm font-bold whitespace-nowrap hover:text-accent
                    after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:content-['']
                    ${active ? 'text-accent after:bg-accent after:shadow-[0_0_8px_var(--accent)]' : open ? 'text-ink' : 'text-dim'}`}
      >
        {group.label}
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`size-3 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>

      {/* 箱。上の余白（pt-2）も当たり判定なので、カーソルを名前から箱へ動かしても閉じない */}
      <div
        id={panelId}
        className={`absolute top-full left-0 z-30 pt-2 motion-safe:transition motion-safe:duration-150
                    ${open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}
      >
        <ul className="w-80 rounded-xl border border-frame bg-panel p-2 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]">
          {group.items.map((item) => {
            const current = isCurrentSection(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={current ? 'page' : undefined}
                  className={`group/item flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent-soft
                              ${current ? 'bg-accent-soft' : ''}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg border bg-raise
                                ${current ? 'border-accent text-accent' : 'border-frame text-accent'}`}
                  >
                    <ToolIcon href={item.href} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-cond text-sm leading-tight font-bold group-hover/item:text-accent ${current ? 'text-accent' : ''}`}>
                      {item.label}
                    </span>
                    {item.sub && <span className="mt-0.5 block text-[11px] leading-tight text-dim">{item.sub}</span>}
                  </span>
                  {current && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
