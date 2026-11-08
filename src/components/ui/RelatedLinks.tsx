import Link from 'next/link';

export type RelatedLink = { href: string; label: string; sub?: string };

/**
 * 関連するページへのリンクの一覧（2026-11-09 の全面再設計で共通化）。
 * ゲーム・GPU・CPU・ツール・記事のつながりを、どのページでも同じ形で出す。行き先は実在するページだけ。
 */
export function RelatedLinks({ title, links, className = '' }: { title: string; links: RelatedLink[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <section className={className}>
      <h2 className="mb-3 font-cond text-lg font-bold">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex min-h-12 items-center gap-3 rounded-lg border border-frame bg-panel px-4 py-2.5 hover:border-accent hover:bg-raise"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-cond text-sm font-bold group-hover:text-accent">{l.label}</span>
                {l.sub && <span className="mt-0.5 block text-xs text-dim">{l.sub}</span>}
              </span>
              <span aria-hidden className="font-mono text-dim group-hover:text-accent">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
