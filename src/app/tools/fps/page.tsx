import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FpsTool } from '@/components/fps/FpsTool';
import { supportedGameNames } from '@/lib/fps/games';
import { assertModelReproducesMeasurements } from '@/lib/fps/selftest';

// 計算式が実測4条件を再現するか、ビルド時に確認する。
// 係数をいじって実測とズレたらここでビルドが落ちる。
assertModelReproducesMeasurements();

export const metadata: Metadata = {
  title: 'ゲーム別fps予想とボトルネック診断｜GPUとCPUを選ぶだけ',
  description:
    `GPUとCPUを選ぶと、${supportedGameNames('・')} の推定fpsが出ます。GPU律速かCPU律速か、どこを変えればfpsが伸びるかまで診断。メーカー公式スペックと実測から計算した推定値です（誤差±15〜20%）。`,
  alternates: { canonical: '/tools/fps' },
};

export default function FpsToolPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'ツール' },
            { href: '/tools/fps', label: 'ゲーム別fps予想・ボトルネック診断' },
          ]}
        />
        <header className="border-b border-ink pt-12 pb-7">
          <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
            TOOL / FPS PREDICTOR
          </p>
          <h1 className="mb-4 font-cond text-[clamp(2rem,6vw,3.4rem)] leading-none font-bold tracking-tight">
            ゲーム別fps予想・ボトルネック診断
          </h1>
          <p className="max-w-[60ch] text-dim">
            GPUとCPUを選ぶと、推定fpsと
            <b className="font-semibold text-ink">どちらが足を引っ張っているか</b>
            が出ます。モデル別の性能はメーカー公式スペックから自前で計算し、
            ゲーム別の係数は自前の実測と、許諾を得た第三者の測定から算出しています。
            計算はすべてブラウザ内で完結します。
          </p>
        </header>

        <div className="py-6">
          <FpsTool />
        </div>

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
              大きく表示している予想fpsは、ゲーム側のfps上限を含めない理論値です（PCの性能を見るため）。
              Apex Legends のように上限があるゲームでは、上限を超える構成に「実際の画面では上限で止まる」旨を添えています。
            </p>
            <p>
              モデル別の性能（指数）はメーカー公式スペックから自前で計算しています。
              そこに「そのゲームがどれくらい重いか」「設定と解像度でどれくらい変わるか」を
              係数として掛けます。係数は割り算で出した比率だけを持っており、
              fps数値表は保存していません。
            </p>
            <p>
              <strong className="font-medium text-ink">VALORANT</strong> —
              RX 9070 XT + Ryzen 7 9800X3D での自前の実測4条件から導出。
              4K→1440p は ×1.87、全て高→全て低 は ×1.74 でどちらも実測値です。
              1080p だけは実測がなく（実測した1080pはCPU律速でGPU側の値が取れなかった）、
              実測の1.87と画素比から指数則で外挿しています。
            </p>
            <p>
              <strong className="font-medium text-ink">Fortnite</strong> —
              許諾を得たうえで、Boss Benchmarks さんの実測（Ryzen 7 9800X3D + RTX 5070 Ti）から算出。
              CPUが自前の実測機と同一のため、ゲーム間の重さを直接比較できています。
              解像度係数はプリセットごとに異なり（重い設定ほど画素数に比例して重くなる）、
              GPU使用率が97%以上でGPU律速と確認できた条件だけを使っています。
            </p>
            <p>
              <strong className="font-medium text-ink">Apex Legends</strong> —
              許諾を得たうえで、第三者の測定から算出。GPU側は Core i9 13900K で
              GPU 30枚を測った結果（射撃訓練場の重い場面）、CPU側は RTX 4090 で CPU 15個を
              測った結果（キングスキャニオン）を使っています。
              Apex では上位のGPUほどfpsの伸びが鈍り、性能指数が2倍になってもfpsは約1.6倍です。
              これを「GPU性能の効き方」として式に入れています（VALORANT と Fortnite は1で、指数に比例）。
              低・中の設定はフルHDの測定しかないため、WQHD / 4K は最高設定の解像度係数を流用した近似です。
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
