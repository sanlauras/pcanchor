import Link from 'next/link';

/**
 * 記事の中から、当サイトのツールへ誘う枠（2026-10-13）。
 * href は実在するページだけ（/tools/fps?game=… など、ツールが読める条件つきの URL を含む）。
 */
export function ToolCta({
  href,
  title,
  children,
  button,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
  button: string;
}) {
  return (
    <aside className="my-8 flex flex-col gap-4 rounded-xl border border-frame bg-panel p-5 shadow-glow sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent">PC ANCHOR TOOL</p>
        <p className="font-cond text-base font-bold">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-dim">{children}</p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-vivid px-4 py-2.5 font-cond text-sm font-bold text-on-accent hover:brightness-110"
      >
        {button}
        <span aria-hidden>→</span>
      </Link>
    </aside>
  );
}
