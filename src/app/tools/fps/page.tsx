import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/nav';
import { FpsTool } from '@/components/fps/FpsTool';
import { GAMES, supportedGameNames } from '@/lib/fps/games';
import { assertModelReproducesMeasurements } from '@/lib/fps/selftest';
import { JsonLd, pageMetadata, webApplicationJsonLd } from '@/lib/seo';

// 計算式が実測4条件を再現するか、ビルド時に確認する。
// 係数をいじって実測とズレたらここでビルドが落ちる。
assertModelReproducesMeasurements();

export const metadata: Metadata = pageMetadata({
  // 「ボトルネックチェッカー」は同じ目的で使われる言い方（2026-09-27 の SEO監査の指摘で題名に入れた）
  title: 'ゲーム別fps予想・ボトルネックチェッカー｜GPUとCPUを選ぶだけ',
  description:
    `GPUとCPUを選ぶと、${supportedGameNames('・')} の推定fpsが出ます。GPU律速かCPU律速か（ボトルネック診断）、どこを変えればfpsが伸びるかまで分かります。メーカー公式スペックと実測から計算した推定値です（誤差±15〜20%）。`,
  path: '/tools/fps',
});

export default function FpsToolPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        {/* ツールであることを検索エンジンに伝える。中身はページに書いてある事実だけ */}
        <JsonLd
          data={webApplicationJsonLd({
            name: TOOLS.fps.long,
            description: TOOLS.fps.note,
            path: TOOLS.fps.href,
          })}
        />
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'ツール' },
            { href: '/tools/fps', label: 'ゲーム別fps予想・ボトルネック診断' },
          ]}
        />
        <PageHeader
          eyebrow={TOOLS.fps.eyebrow}
          title={TOOLS.fps.short}
          subtitle={TOOLS.fps.long}
          lead={
            <>
              GPUとCPUを選ぶと、推定fpsと
              <b className="font-semibold text-ink">どちらが足を引っ張っているか</b>
              が出ます。モデル別の性能はメーカー公式スペックから自前で計算し、ゲーム別の係数は自前の実測と、許諾を得た第三者の測定から算出しています。計算はすべてブラウザ内で完結します。
            </>
          }
        />

        <div className="py-6">
          <FpsTool />
        </div>

        {/*
          ゲームごとのページへの入口。ツールは操作して使うものなので、検索エンジンがたどれる
          普通のリンクをここに置く（2026-09-26 の SEO 改善）。
        */}
        <section className="border-t-2 border-ink pt-5">
          <h2 className="mb-1 font-cond text-lg font-bold">ゲーム別の推奨GPU</h2>
          <p className="mb-3 text-xs text-dim">
            ゲームごとに、GPU別の推定fpsと、解像度別に必要なGPU・CPU別の上限をまとめています。
          </p>
          <ul className="flex flex-wrap gap-2">
            {GAMES.filter((g) => g.supported).map((g) => (
              <li key={g.id}>
                <Link
                  href={`/games/${g.id}`}
                  className="inline-block border-2 border-ink bg-panel px-3 py-1.5 font-cond text-sm font-bold hover:bg-accent-soft hover:text-accent"
                >
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 border-t border-rule-soft pt-5 text-xs text-dim">
          <h2 className="mb-2 font-cond text-base font-bold text-ink">計算方法</h2>
          <pre className="mb-3 overflow-x-auto border border-rule bg-panel p-3 font-mono text-[11px]">
{`予想fps（理論値） = min(GPU由来fps, CPU由来fps)
実際の画面のfps   = min(予想fps, ゲーム固有の上限)

GPU由来fps = 基準GPU（RX 9070 XT）の「Valorant 4K全て高」fps
           × ゲームの重さ
           × (そのGPU ÷ 基準GPU)^GPU性能の効き方
           × 設定係数 × 解像度係数
CPU由来fps = そのCPUの「Valorant 天井」推定fps × ゲームの重さ`}
          </pre>
          <div className="max-w-[80ch] space-y-2">
            <p>
              大きく表示している予想fpsは、ゲーム側のfps上限を含めない理論値です（PCの性能を見るため）。Apex Legends のように上限があるゲームでは、上限を超える構成に「実際の画面では上限で止まる」旨を添えています。
            </p>
            <p>
              モデル別の性能（指数）はメーカー公式スペックから自前で計算し、ゲームごとの重さや設定・解像度の効き方を係数として掛けています。係数は割り算で出した比率だけを持っており、fps数値表は保存していません。指数の計算式と、ゲームごとの係数の出どころは
              <Link href="/methodology" className="text-accent underline">
                算出方法
              </Link>
              のページにまとめています。
            </p>
            <p>
              ゲームを移るときにマウス感度をそろえるなら
              <Link href="/tools/sensitivity" className="text-accent underline">
                FPS感度の換算・振り向き距離の計算
              </Link>
              が使えます。
            </p>
          </div>
        </section>

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}
