import { tally } from '@/lib/data/summary';

type Props = {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
};

export function Masthead({ eyebrow, title, lead }: Props) {
  const stats = [
    { value: tally.gpuCount, label: 'GPUモデル' },
    { value: tally.cpuCount, label: 'CPUモデル' },
    { value: tally.verifiedCount, label: 'ソース確認済み' },
    { value: tally.correctionsFound, label: '誤りを発見・修正' },
  ];

  return (
    <header className="border-b border-ink pt-12 pb-7">
      <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
        {eyebrow}
      </p>
      <h1 className="mb-4 font-cond text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight">
        {title}
      </h1>
      <p className="max-w-[60ch] text-dim">{lead}</p>

      <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="font-mono text-2xl font-semibold tracking-tight text-ink">
              {s.value}
            </dd>
            <dt className="font-mono text-xs text-dim">{s.label}</dt>
          </div>
        ))}
      </dl>
    </header>
  );
}
