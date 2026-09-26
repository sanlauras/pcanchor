import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import { EstimateNote } from '@/components/EstimateNote';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Masthead } from '@/components/Masthead';
import { GpuTable } from '@/components/spec-table/GpuTable';
import { tally } from '@/lib/data/summary';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'GPU性能比較 78モデル｜スペックと推定fps',
  description:
    'GeForce GTX 10シリーズからRTX 50シリーズ、Radeon RX 5000からRX 9000まで、GPU 78モデルの検証済みスペックと性能指数（推定）。全件メーカー公式資料と照合しています。',
  path: '/gpu',
});

export default function GpuPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs trail={[{ href: '/gpu', label: 'GPU一覧' }]} />
        <Masthead
          eyebrow="GPU DATABASE"
          title="GPUスペック一覧"
          lead={
            <>
              GeForce GTX 10シリーズ〜RTX 50シリーズ、Radeon RX 5000〜RX 9000 の{' '}
              <b className="font-semibold text-ink">{tally.gpuCount}モデル</b>。数値はすべてメーカー公式資料と照合済みで、クロックはリファレンス仕様値に統一しています。
            </>
          }
        />

        <EstimateNote kind="gpu" />

        <h2 className="mt-6 mb-2 font-cond text-xl font-bold">
          GPU {tally.gpuCount}モデルの性能指数とスペック
        </h2>
        <GpuTable />

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}
