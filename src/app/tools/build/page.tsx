import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/nav';
import { BuildTool } from '@/components/build/BuildTool';
import { cpus, gpus } from '@/lib/data';
import { assertBuildInverts } from '@/lib/fps/build';
import { JsonLd, pageMetadata, webApplicationJsonLd } from '@/lib/seo';

// 逆引きの結果を予想の式に入れ直して、本当に目標を満たすかビルド時に確認する。
// 逆引きと予想がずれたらここでビルドが落ちる。
assertBuildInverts(gpus, cpus);

export const metadata: Metadata = pageMetadata({
  title: '必要スペック診断｜目標fpsから必要なGPUとCPUが分かる',
  description:
    'プレイするゲーム・解像度・画質・出したいfpsを入れると、必要なGPUとCPUが分かります。必要十分・余裕を持たせた・高性能の3つの構成と、設定を下げた場合の代替案も表示。メーカー公式スペックと実測から計算した推定値です（誤差±15〜20%）。',
  path: '/tools/build',
});

export default function BuildToolPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        {/* ツールであることを検索エンジンに伝える。中身はページに書いてある事実だけ */}
        <JsonLd
          data={webApplicationJsonLd({
            name: TOOLS.build.long,
            description: TOOLS.build.note,
            path: TOOLS.build.href,
          })}
        />
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'ツール' },
            { href: '/tools/build', label: '必要スペック診断' },
          ]}
        />
        <PageHeader
          eyebrow={TOOLS.build.eyebrow}
          title={TOOLS.build.short}
          subtitle={TOOLS.build.long}
          lead={
            <>
              ゲーム・解像度・画質・出したいfpsを入れると、
              <b className="font-semibold text-ink">それを満たす最小のGPUとCPU</b>
              が出ます。FPS予想の逆向きです。必要十分な構成・余裕を持たせた構成・高性能構成の3つを見比べられます。価格は考慮していません。計算はすべてブラウザ内で完結します。
            </>
          }
        />

        <div className="py-6">
          <BuildTool />
        </div>
      </main>
    </div>
  );
}
