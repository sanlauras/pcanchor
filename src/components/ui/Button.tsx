import Link from 'next/link';

/**
 * ボタンの形をしたリンク（2026-11-09 の全面再設計で共通化）。
 *
 * primary は塗りの青（--accent-vivid）に白い文字（--on-accent。4.90:1）。1つの画面で主な行き先にだけ使う。
 * secondary は枠だけ。主な行き先の横に並べる2つ目以降に使う。
 */
export function ButtonLink({
  href,
  variant = 'primary',
  arrow = true,
  className = '',
  children,
}: {
  href: string;
  variant?: 'primary' | 'secondary';
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const look =
    variant === 'primary'
      ? 'bg-accent-vivid text-on-accent hover:brightness-110'
      : 'border border-frame bg-panel text-ink hover:border-accent hover:text-accent';
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 font-cond text-sm font-bold ${look} ${className}`}
    >
      {children}
      {arrow && <span aria-hidden>→</span>}
    </Link>
  );
}
