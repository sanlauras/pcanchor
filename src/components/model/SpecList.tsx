/** モデルページのスペック表。ラベルと値の2列 */
export function SpecList({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-3 border-b border-rule-soft py-1.5"
        >
          <dt className="min-w-0 text-xs text-dim">{label}</dt>
          <dd className="shrink-0 font-mono text-xs tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
