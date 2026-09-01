'use client';

import { useSyncExternalStore } from 'react';

/**
 * テーマ選択。訪問者向けの常設機能。
 *
 * テーマを増やすときは、この配列と globals.css の [data-theme] ブロックに
 * 同じ id を足す。追加前にコントラストを確認すること。
 */
export const THEMES = [
  { id: 'cyan', name: 'CYAN' },
  { id: 'amber', name: 'AMBER' },
  { id: 'lime', name: 'LIME' },
] as const;

export const DEFAULT_THEME = 'cyan';

// html の data-theme が唯一の状態。React は読むだけにして、
// 書き込みはコンポーネントの外で行う（描画中の副作用を避けるため）。
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.dataset.theme ?? DEFAULT_THEME;
}

function getServerSnapshot() {
  return DEFAULT_THEME;
}

function applyTheme(id: string) {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem('theme', id);
  } catch {
    // プライベートウィンドウ等では保存できない。切り替え自体は効くので無視する
  }
  const url = new URL(window.location.href);
  url.searchParams.set('theme', id);
  window.history.replaceState(null, '', url);
}

export function ThemePicker() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="テーマ">
      {THEMES.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTheme(t.id)}
            aria-pressed={on}
            title={`テーマ: ${t.name}`}
            className={`cursor-pointer border px-2 py-1 font-mono text-[10px] tracking-wider ${
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule text-dim hover:border-ink hover:text-ink'
            }`}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
