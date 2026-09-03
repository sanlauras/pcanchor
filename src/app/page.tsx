import type { Metadata } from 'next';
import Link from 'next/link';
import { tally } from '@/lib/data/summary';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: `${SITE.name}｜ゲーミングPCのfps予想とスペック比較`,
  description:
    'GPUとCPUを選ぶと、VALORANT・Fortnite で何fps出るかとボトルネックが分かります。GPU 78モデル・CPU 42モデルのスペックと性能指数も掲載。実測を基準にした推定値です。',
  alternates: { canonical: '/' },
};

const entries = [
  {
    href: '/tools/fps',
    label: 'fps予想・ボトルネック診断',
    count: 'ツール',
    note: 'GPUとCPUを選ぶだけ。どちらが足を引っ張っているかまで分かります',
  },
  {
    href: '/games',
    label: 'ゲーム別の推奨スペック',
    count: 'VALORANT / Fortnite',
    note: 'GPU別に何fps出るかを一覧で',
  },
  {
    href: '/gpu',
    label: 'GPUスペック一覧',
    count: `${tally.gpuCount}モデル`,
    note: 'GeForce GTX 10〜RTX 50 / Radeon RX 5000〜RX 9000',
  },
  {
    href: '/cpu',
    label: 'CPUスペック一覧',
    count: `${tally.cpuCount}モデル`,
    note: 'Ryzen 5000〜9000 / Intel 第10〜14世代・Core Ultra 200S',
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-[1240px] px-5">
      {/*
        和文と欧文を1行に混ぜると字幅も太さも揃わないため、欧文の社名を主役にして
        日本語名を下に添える構成にしている。飾りのある書体はこのロゴだけに使い、
        読ませる文章には使わない。
        h1 には英語名と日本語名の両方を入れてある（どちらで検索されても拾えるようにし、
        読み上げも「PC ANCHOR / PCアンカー」と自然につながる）。
      */}
      <header className="border-b border-ink pt-14 pb-9">
        <p className="mb-5 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          GAMING PC FPS PREDICTOR
        </p>
        <h1>
          <span className="block overflow-hidden font-display text-[clamp(2.4rem,11vw,7rem)] leading-[1.05] tracking-[var(--display-tracking)] uppercase">
            {SITE.nameEn}
          </span>
          <span className="mt-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-9 shrink-0 bg-accent" />
            <span className="font-cond text-base font-bold tracking-[0.2em] text-dim sm:text-lg">
              {SITE.name}
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-[60ch] text-dim">
          ゲーミングPCのfps予想ツールと、GPU/CPUスペックデータベース。
          モデル別の性能はメーカー公式スペックから自前で計算。ゲーム別の係数は
          自前の実測と、許諾を得た第三者の測定から算出しています（出典を明記）。
          他社のfps数値表の転載はしていません。
        </p>
      </header>

      <div className="grid gap-3 py-8 sm:grid-cols-2">
        {entries.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="block border border-rule bg-panel p-5 hover:border-ink"
          >
            <p className="font-mono text-xs text-dim">{e.count}</p>
            <h2 className="mt-1 font-cond text-xl font-bold">{e.label}</h2>
            <p className="mt-1 text-sm text-dim">{e.note}</p>
          </Link>
        ))}
      </div>

      <section className="border-l-2 border-rule pb-8 pl-4 text-sm text-dim">
        <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
          数値の扱いについて
        </h2>
        <p className="max-w-[60ch]">
          掲載している性能指数と推定fpsは、誤差 ±15〜20% の推定値です。
          実測は1構成のみで、他のモデルはそこからの外挿になります。
          根拠が足りない値は出しません。1% Low（カクつき）と終盤の高負荷時のfpsは、
          現時点で十分なデータが無いため公開していません。
        </p>
        <p className="mt-2 max-w-[60ch]">
          精度は実測データの量で決まります。訪問者から実測を集める仕組みを準備しています。
        </p>
      </section>
    </main>
  );
}
