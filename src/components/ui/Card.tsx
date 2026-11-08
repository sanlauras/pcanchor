import Link from 'next/link';

/**
 * カード（2026-11-09 の全面再設計で共通化）。角の丸み・枠・面の色をここで1つに決める。
 * ページごとに `rounded-xl border border-frame bg-panel …` を書き分けないこと。
 */
export function Card({
  as: Tag = 'div',
  className = '',
  children,
}: {
  as?: 'div' | 'section' | 'aside' | 'article' | 'li';
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={`rounded-xl border border-frame bg-panel p-5 ${className}`}>{children}</Tag>;
}

/**
 * 行き先のあるカード（ツール・ゲーム・データベースの入口）。カード全体が1つのリンク。
 * meta には事実だけを置く（モデル数・対応している画質など。飾りの数字を置かない）。
 */
export function ToolCard({
  href,
  eyebrow,
  title,
  description,
  icon,
  meta,
  className = '',
}: {
  href: string;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col rounded-xl border border-frame bg-panel p-5 hover:border-accent hover:bg-raise ${className}`}
    >
      <span className="flex items-start gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-frame bg-raise text-accent">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          {eyebrow && (
            <span className="mb-1 block font-mono text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">{eyebrow}</span>
          )}
          <span className="block font-cond text-lg leading-snug font-bold group-hover:text-accent">{title}</span>
        </span>
        <span aria-hidden className="font-mono text-dim group-hover:text-accent">
          →
        </span>
      </span>
      {description && <span className="mt-2 block text-sm leading-relaxed text-dim">{description}</span>}
      {meta && <span className="mt-auto block pt-3 text-xs text-dim">{meta}</span>}
    </Link>
  );
}
