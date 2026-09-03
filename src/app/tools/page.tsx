import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'ゲーミングPC向けツール一覧',
  description:
    'ゲーミングPC向けのツール。fps予想とボトルネック診断、GPU/CPUスペックデータベース。',
  alternates: { canonical: '/tools' },
};

const tools = [
  {
    href: '/tools/fps',
    label: 'fps予想・ボトルネック診断',
    note: 'GPUとCPUを選ぶと推定fpsと、どちらが足を引っ張っているかが出ます',
    status: '公開中',
  },
];

const planned = [
  '実測fpsの投稿と集計',
  '構成の消費電力・電源容量の目安',
  '対応ゲームの追加（Apex Legends ほか）',
];

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-5">
      <Breadcrumbs trail={[{ href: '/tools', label: 'ツール' }]} />
      <header className="border-b border-ink pt-12 pb-7">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          TOOLS
        </p>
        <h1 className="mb-4 font-cond text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight">
          ツール一覧
        </h1>
        <p className="max-w-[60ch] text-dim">
          数値はメーカー公式の公開スペックと自前の実測だけを使っています。
          計算はすべてブラウザ内で完結します。
        </p>
      </header>

      <div className="grid gap-3 py-8 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block border border-rule bg-panel p-5 hover:border-ink"
          >
            <p className="font-mono text-xs text-accent">{t.status}</p>
            <h2 className="mt-1 font-cond text-xl font-bold">{t.label}</h2>
            <p className="mt-1 text-sm text-dim">{t.note}</p>
          </Link>
        ))}
      </div>

      <section className="border-l-2 border-rule pb-10 pl-4 text-sm text-dim">
        <h2 className="mb-1.5 font-cond text-base font-bold text-ink">準備中</h2>
        <ul className="space-y-1">
          {planned.map((p) => (
            <li key={p}>・{p}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
