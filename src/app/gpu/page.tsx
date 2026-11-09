import type { Metadata } from 'next';
import { EstimateNote } from '@/components/EstimateNote';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Masthead } from '@/components/Masthead';
import { GpuTable } from '@/components/spec-table/GpuTable';
import { gpus } from '@/lib/data';
import { tally } from '@/lib/data/summary';
import { gpuColumns } from '@/components/spec-table/columns';
import { lastUpdated } from '@/lib/changelog';
import { JsonLd, datasetJsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'GPU性能比較 78モデル｜スペックと推定fps',
  description:
    'GeForce GTX 10シリーズからRTX 50シリーズ、Radeon RX 5000からRX 9000まで、GPU 78モデルの、メーカー公式スペックと照合したスペックと性能指数（推定）。発売年・メーカーで絞り込み、最大3モデルを比較できます。',
  path: '/gpu',
});

export default function GpuPage() {
  const semi = gpus.filter((g) => g.verified.startsWith('準')).length;
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs trail={[{ href: '/gpu', label: 'GPU一覧' }]} />
        {/* データセットの構造化データ（2026-09-27）。項目名は表の列と同じものを使う */}
        <JsonLd
          data={datasetJsonLd({
            name: `GPU ${tally.gpuCount}モデルのスペックと性能指数`,
            description: metadata.description as string,
            path: '/gpu',
            dateModified: lastUpdated('/gpu'),
            variables: gpuColumns.map((c) => c.label).filter((l) => l !== 'モデル'),
          })}
        />
        <Masthead
          eyebrow="GPU DATABASE"
          title="GPUスペック一覧"
          lead={
            <>
              GeForce GTX 10シリーズ〜RTX 50シリーズ、Radeon RX 5000〜RX 9000 の{' '}
              <b className="font-semibold text-ink">{tally.gpuCount}モデル</b>。スペックはメーカー公式の資料と照合し、クロックはリファレンス仕様値に統一しています。
            </>
          }
        />


        {/*
          確認状態を、スペックとゲーム性能に分けて書く（2026-11-09 段階5）。件数はデータから数える。
          前は「全件メーカー公式資料と照合済み」と書いていたが、一部準確認のモデルがあるため改めた。
        */}
        <section className="mt-4 grid gap-3 rounded-lg border border-frame bg-panel p-4 text-sm sm:grid-cols-2" data-status>
          <div>
            <p className="mb-1 font-medium">スペック</p>
            <p className="text-xs text-dim">
              {`GPU ${gpus.length}モデル中 ${gpus.length - semi}モデルはメーカー公式仕様と照合済み、${semi}モデルは一部準確認（公式資料ではなく、兄弟モデルとの整合で確かめた値を含む）です。表の「スペック確認」の列で見分けられます。`}
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">ゲーム性能（性能指数・推定fps）</p>
            <p className="text-xs text-dim">
              どのモデルも計算による推定です。自前の実測データは、基準機（Radeon RX 9070 XT＋Ryzen 7 9800X3D）で VALORANT を測ったものだけです。
            </p>
          </div>
        </section>

        <EstimateNote kind="gpu" />

        <h2 className="mt-6 mb-2 font-cond text-xl font-bold">
          GPU {tally.gpuCount}モデルの性能指数とスペック
        </h2>
        <GpuTable />
      </main>
    </div>
  );
}
