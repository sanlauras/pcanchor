import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import { EstimateNote } from '@/components/EstimateNote';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Masthead } from '@/components/Masthead';
import { CpuTable } from '@/components/spec-table/CpuTable';
import { tally } from '@/lib/data/summary';

export const metadata: Metadata = {
  title: 'CPU性能比較 42モデル｜性能指数とfps上限',
  description:
    'Ryzen 5000〜9000シリーズ、Intel 第10〜14世代とCore Ultra 200Sまで、CPU 42モデルの検証済みスペックと性能指数（推定）。全件メーカー公式資料と照合しています。',
  alternates: { canonical: '/cpu' },
};

export default function CpuPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs trail={[{ href: '/cpu', label: 'CPU一覧' }]} />
        <Masthead
          eyebrow="CPU DATABASE"
          title="CPUスペック一覧"
          lead={
            <>
              Ryzen 5000〜9000シリーズ、Intel 第10〜14世代および Core Ultra 200S の{' '}
              <b className="font-semibold text-ink">{tally.cpuCount}モデル</b>。
              ゲーム性能に効くL3キャッシュと3D V-Cacheの有無まで確認済みです。
            </>
          }
        />

        <EstimateNote kind="cpu" />

        <CpuTable />

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}
