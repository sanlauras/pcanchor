import { TOOLS } from '@/lib/nav';

/*
 * ツールの印（アイコン）。外部のアイコン集は入れず、線だけの SVG を直書きしている。
 * 今あるツール・ページにだけ対応させる（無い機能のアイコンは作らない）。
 * ホームのカードと、ヘッダーのドロップダウン・スマホのメニューで使い回す（2026-09-30 に page.tsx から移した）。
 */
export function ToolIcon({ href, className = '' }: { href: string; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  };
  switch (href) {
    case TOOLS.fps.href: // 速度計
      return (
        <svg {...common}>
          <path d="M4 16a8 8 0 1 1 16 0" />
          <path d="M12 16l4-5" />
          <path d="M6.5 16h1M16.5 16h1M12 8.5v1" />
        </svg>
      );
    case TOOLS.build.href: // 部品を組む
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      );
    case TOOLS.sensitivity.href: // 照準
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case TOOLS.games.href: // コントローラー
      return (
        <svg {...common}>
          <path d="M7 8h10a4 4 0 0 1 3.9 4.9l-.8 3.3a2.3 2.3 0 0 1-4 .9L14.5 15h-5l-1.6 2.1a2.3 2.3 0 0 1-4-.9l-.8-3.3A4 4 0 0 1 7 8z" />
          <path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01" />
        </svg>
      );
    default: // チップ（GPU・CPU のデータベース）
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
          <rect x="9.5" y="9.5" width="5" height="5" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
        </svg>
      );
  }
}
