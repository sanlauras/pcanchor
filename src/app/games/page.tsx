import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';

export const metadata: Metadata = {
  title: 'ゲーム別の推奨スペック一覧',
  description:
    'VALORANT・Fortnite の推奨スペックと、GPU別に何fps出るかの一覧。解像度・画質別の推定値をメーカー公式スペックと実測から計算しています。',
  alternates: { canonical: '/games' },
};

export default function GamesPage() {
  const supported = GAMES.filter((g) => g.supported);
  const unsupported = GAMES.filter((g) => !g.supported);

  return (
    <main className="mx-auto max-w-[1240px] px-5">
      <Breadcrumbs trail={[{ href: '/games', label: 'ゲーム別' }]} />

      <header className="border-b border-ink pt-6 pb-7">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          GAMES
        </p>
        <h1 className="mb-4 font-cond text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight">
          ゲーム別の推奨スペック
        </h1>
        <p className="max-w-[60ch] text-dim">
          GPU {gpus.length}モデルそれぞれで何fps出るかを、ゲームごとに一覧にしています。
          係数が実測で裏付けられているタイトルだけを掲載しています。
        </p>
      </header>

      <div className="grid gap-3 py-8 sm:grid-cols-2">
        {supported.map((g) => (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className="block border border-rule bg-panel p-5 hover:border-ink"
          >
            <p className="font-mono text-xs text-accent">{g.presets.length}段階の画質に対応</p>
            <h2 className="mt-1 font-cond text-xl font-bold">{g.name}</h2>
            <p className="mt-1 text-sm text-dim">根拠: {g.confidenceLabel}</p>
          </Link>
        ))}
      </div>

      {unsupported.length > 0 && (
        <section className="border-l-2 border-rule pb-10 pl-4 text-sm text-dim">
          <h2 className="mb-1.5 font-cond text-base font-bold text-ink">対応準備中</h2>
          <ul className="space-y-2">
            {unsupported.map((g) => (
              <li key={g.id}>
                <strong className="font-medium text-ink">{g.name}</strong> —{' '}
                {g.notes[0]}
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[70ch]">
            係数が取れていないタイトルは、根拠のない数値を出すよりページを作らない方針です。
          </p>
        </section>
      )}
    </main>
  );
}
