import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'ゲーミングPC向けツール一覧',
  description:
    'ゲーミングPC向けのツール。ゲーム別のfps予想とボトルネック診断、目標fpsからのPC構成、FPS感度の換算、GPU/CPUスペックデータベース。',
  alternates: { canonical: '/tools' },
};

// ツール名は src/lib/nav.ts にまとめてある（ヘッダー・ホームと表記を揃えるため）
const tools = [TOOLS.fps, TOOLS.build, TOOLS.sensitivity];

const planned = [
  '実測fpsの投稿と集計',
  '構成の消費電力・電源容量の目安',
  '対応ゲームの追加',
];

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-5">
      <Breadcrumbs trail={[{ href: '/tools', label: 'ツール' }]} />
      <PageHeader
        eyebrow="TOOLS"
        title="ツール一覧"
        subtitle="ゲーミングPC向けのツール"
        lead={
          <>
            モデル別の性能はメーカー公式スペックから自前で計算し、ゲーム別の係数は自前の実測と、許諾を得た第三者の測定から算出しています。計算はすべてブラウザ内で完結します。
          </>
        }
      />

      <div className="grid gap-3 py-8 sm:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group flex flex-col border-2 border-ink bg-panel p-5 hover:bg-accent-soft"
          >
            <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">公開中</p>
            <h2 className="mt-1 grid gap-0.5">
              <span className="font-cond text-2xl font-bold group-hover:text-accent">{t.short}</span>
              <span className="font-cond text-xs font-bold text-dim">{t.long}</span>
            </h2>
            <p className="mt-2 text-sm text-dim">{t.note}</p>
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
