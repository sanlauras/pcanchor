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
      <header className="border-b border-ink pt-14 pb-8">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          GAMING PC FPS PREDICTOR
        </p>
        <h1 className="mb-4 font-cond text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight">
          fps-predictor
        </h1>
        <p className="max-w-[60ch] text-dim">
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
          fps予想ツールは準備中です
        </h2>
        <p className="max-w-[60ch]">
          予想の精度は実測データの量で決まります。現在の実測は1構成のみのため、
          先にスペックデータベースを公開し、実測の投稿を集めてから予想ツールを仕上げます。
        </p>
      </section>
    </main>
  );
}
