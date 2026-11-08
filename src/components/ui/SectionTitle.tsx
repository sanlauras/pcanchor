/**
 * 節の見出し（2026-11-09 の全面再設計で共通化）。
 * eyebrow は英字の小見出し（飾り。読み上げでは見出しの前に読まれるだけ）。見出しの本体は日本語で、検索にも使われる。
 */
export function SectionTitle({
  id,
  eyebrow,
  title,
  lead,
  as: Tag = 'h2',
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {eyebrow && <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-signal uppercase">{eyebrow}</p>}
      <Tag
        id={id}
        className={`scroll-mt-[calc(var(--header-h)+1.25rem)] font-cond leading-snug font-bold ${Tag === 'h2' ? 'text-2xl sm:text-[1.7rem]' : 'text-lg'}`}
      >
        {title}
      </Tag>
      {lead && <div className="mt-2 max-w-[70ch] text-sm leading-relaxed text-dim">{lead}</div>}
    </div>
  );
}
