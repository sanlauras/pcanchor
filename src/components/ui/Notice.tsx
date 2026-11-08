/**
 * 補足・注意の枠（2026-11-09 の全面再設計で共通化。ブログの Note もこれを使う）。
 * tone は意味。色だけで伝えないよう、注意のときは見出しの頭に「注意：」を付ける。
 */
export function Notice({
  title,
  tone = 'info',
  className = '',
  children,
}: {
  title?: string;
  tone?: 'info' | 'caution';
  className?: string;
  children: React.ReactNode;
}) {
  const look = tone === 'caution' ? 'border-caution bg-caution-soft' : 'border-accent bg-accent-soft';
  return (
    <aside className={`rounded-r-lg border-l-4 px-4 py-3.5 ${look} ${className}`}>
      {title && (
        <p className={`mb-1 font-cond text-sm font-bold ${tone === 'caution' ? 'text-caution' : ''}`}>
          {tone === 'caution' ? `注意：${title}` : title}
        </p>
      )}
      <div className="text-[15px] leading-[1.85] [&>p]:my-1.5">{children}</div>
    </aside>
  );
}
