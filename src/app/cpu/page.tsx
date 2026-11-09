import type { Metadata } from 'next';
import { EstimateNote } from '@/components/EstimateNote';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Masthead } from '@/components/Masthead';
import { CpuTable } from '@/components/spec-table/CpuTable';
import { cpus } from '@/lib/data';
import { tally } from '@/lib/data/summary';
import { cpuColumns } from '@/components/spec-table/columns';
import { lastUpdated } from '@/lib/changelog';
import { JsonLd, datasetJsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'CPU性能比較 42モデル｜性能指数とfps上限',
  description:
    'Ryzen 5000〜9000シリーズ、Intel 第10〜14世代とCore Ultra 200Sまで、CPU 42モデルの、メーカー公式スペックと照合したスペックと性能指数（推定）。発売年・メーカーで絞り込み、最大3モデルを比較できます。',
  path: '/cpu',
});

export default function CpuPage() {
  const semi = cpus.filter((c) => c.verified.startsWith('準')).length;
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs trail={[{ href: '/cpu', label: 'CPU一覧' }]} />
        {/* データセットの構造化データ（2026-09-27）。項目名は表の列と同じものを使う */}
        <JsonLd
          data={datasetJsonLd({
            name: `CPU ${tally.cpuCount}モデルのスペックと性能指数`,
            description: metadata.description as string,
            path: '/cpu',
            dateModified: lastUpdated('/cpu'),
            variables: cpuColumns.map((c) => c.label).filter((l) => l !== 'モデル'),
          })}
        />
        <Masthead
          eyebrow="CPU DATABASE"
          title="CPUスペック一覧"
          lead={
            <>
              Ryzen 5000〜9000シリーズ、Intel 第10〜14世代および Core Ultra 200S の{' '}
              <b className="font-semibold text-ink">{tally.cpuCount}モデル</b>。スペックはメーカー公式の資料と照合し、ゲーム性能に効くL3キャッシュと3D V-Cacheの有無も載せています。
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
              {`CPU ${cpus.length}モデル中 ${cpus.length - semi}モデルはメーカー公式仕様と照合済み、${semi}モデルは一部準確認（公式資料ではなく、同世代のモデルとの整合で確かめた値を含む）です。表の「スペック確認」の列で見分けられます。`}
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">ゲーム性能（性能指数・推定fps）</p>
            <p className="text-xs text-dim">
              どのモデルも計算による推定です。自前の実測データは、基準機（Radeon RX 9070 XT＋Ryzen 7 9800X3D）で VALORANT を測ったものだけです。
            </p>
          </div>
        </section>

        <EstimateNote kind="cpu" />

        <h2 className="mt-6 mb-2 font-cond text-xl font-bold">
          CPU {tally.cpuCount}モデルの性能指数とスペック
        </h2>
        <CpuTable />
      </main>
    </div>
  );
}
