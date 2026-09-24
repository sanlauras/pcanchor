/**
 * ページの見出し。ツールページと一覧ページで共通に使う。
 *
 * 「見出しが長くて見にくい」という指摘への対応（2026-09-22 のデザインの作り直し）:
 * 大きく出すのは短い名前（FPS予想 など）にし、正式名はその下に小さく添える。
 * 検索で拾われるよう、両方とも h1 の中に入れてある。
 *
 * facts を渡すと、右側（スマホでは下）に技術資料の表題欄のような表を出す。
 * 中身は事実だけにすること（収録数など）。飾りの数字を置かない。
 */

export type HeaderFact = { label: string; value: React.ReactNode };

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  lead: React.ReactNode;
  facts?: HeaderFact[];
};

export function PageHeader({ eyebrow, title, subtitle, lead, facts }: Props) {
  return (
    <header className="grid gap-6 border-b-2 border-ink pt-10 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-signal uppercase">
          {eyebrow}
        </p>
        <h1 className="grid gap-2">
          <span className="font-cond text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05] font-bold tracking-tight text-balance">
            {title}
          </span>
          {subtitle && (
            <span className="font-cond text-base font-bold text-dim sm:text-lg">{subtitle}</span>
          )}
        </h1>
        <div className="mt-4 max-w-[60ch] text-dim">{lead}</div>
      </div>

      {facts && facts.length > 0 && <FactTable facts={facts} />}
    </header>
  );
}

/** 技術資料の表題欄のような、ラベルと値の表。ホームのヒーローでも使う */
export function FactTable({ facts, className = '' }: { facts: HeaderFact[]; className?: string }) {
  return (
    <dl className={`border-2 border-ink bg-panel text-sm md:min-w-[18rem] ${className}`}>
      {facts.map((f) => (
        <div
          key={f.label}
          className="grid grid-cols-[8.5rem_minmax(0,1fr)] border-b border-ink last:border-b-0"
        >
          <dt className="border-r border-ink px-2.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-dim uppercase">
            {f.label}
          </dt>
          <dd className="px-3 py-1.5 font-cond font-bold tabular-nums">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
