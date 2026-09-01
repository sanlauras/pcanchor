import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FpsTables } from '@/components/model/FpsTables';
import { SpecList } from '@/components/model/SpecList';
import { VerifiedTag } from '@/components/spec-table/VerifiedTag';
import { gpus } from '@/lib/data';
import { buildFpsTables, nearbyByIndex, referenceCpu } from '@/lib/fps/table';

export function generateStaticParams() {
  return gpus.map((g) => ({ slug: g.slug }));
}

function find(slug: string) {
  return gpus.find((g) => g.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<'/gpu/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const gpu = find(slug);
  if (!gpu) return {};

  return {
    title: `${gpu.name} は何fps出る？スペックと性能指数`,
    description:
      `${gpu.name} が VALORANT・Fortnite で何fps出るかを解像度・画質別に掲載。` +
      `性能指数は ${gpu.perfIndex.toFixed(1)}、VRAM ${gpu.vramGb}GB。` +
      `メーカー公式スペックと自前の実測から計算した推定値です（誤差±15〜20%）。`,
    alternates: { canonical: `/gpu/${gpu.slug}` },
  };
}

export default async function GpuDetailPage({ params }: PageProps<'/gpu/[slug]'>) {
  const { slug } = await params;
  const gpu = find(slug);
  if (!gpu) notFound();

  const cpu = referenceCpu();
  const tables = buildFpsTables(gpu, cpu);
  const nearby = nearbyByIndex(gpus, gpu);
  const sameArch = gpus.filter((g) => g.arch === gpu.arch && g.name !== gpu.name);

  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs
          trail={[
            { href: '/gpu', label: 'GPU一覧' },
            { href: `/gpu/${gpu.slug}`, label: gpu.name },
          ]}
        />

        <header className="border-b border-ink pt-6 pb-7">
          <p className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
            {gpu.vendor} / {gpu.arch} / {gpu.releaseYear}
            <VerifiedTag verified={gpu.verified} />
          </p>
          <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
            {gpu.name}
          </h1>
          <p className="max-w-[62ch] text-dim">
            性能指数は{' '}
            <strong className="font-mono font-semibold text-ink">
              {gpu.perfIndex.toFixed(1)}
            </strong>
            （Radeon RX 9070 XT = 100）。VRAM {gpu.vramGb}GB {gpu.memType}、
            TDP {gpu.tdpW}W。以下のfpsは、CPUに {cpu.name} を組み合わせた場合の推定値です。
          </p>
        </header>

        <FpsTables tables={tables} cpuName={cpu.name} />

        <section className="mt-10">
          <h2 className="mb-3 font-cond text-xl font-bold">スペック</h2>
          <SpecList
            items={[
              ['アーキテクチャ', gpu.arch],
              ['発売年', String(gpu.releaseYear)],
              ['シェーダーユニット', gpu.shaderUnits.toLocaleString('ja-JP')],
              ['ブーストクロック', `${gpu.boostClockMhz.toLocaleString('ja-JP')} MHz`],
              ['VRAM', `${gpu.vramGb} GB ${gpu.memType}`],
              ['メモリバス', `${gpu.busWidthBit} bit`],
              ['メモリ速度', `${gpu.memSpeedGbps} Gbps`],
              ['メモリ帯域幅', `${gpu.bandwidthGbs.toLocaleString('ja-JP')} GB/s`],
              ['TDP', `${gpu.tdpW} W`],
              [
                'Infinity Cache / L2',
                gpu.infinityCacheMb ? `${gpu.infinityCacheMb} MB` : '—',
              ],
              ['性能指数（推定）', gpu.perfIndex.toFixed(1)],
              ['検証状態', gpu.verified],
            ]}
          />
          <p className="mt-3 text-xs text-dim">
            クロックはリファレンス仕様値です。Founders Edition や工場OCモデルは
            これより高い場合があります。
          </p>
        </section>

        {gpu.vendor === 'NVIDIA' &&
          ['Ampere', 'Ada', 'Blackwell'].includes(gpu.arch) && (
            <section className="mt-8 border-l-2 border-rule pl-4 text-sm text-dim">
              <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
                シェーダーユニット数の読み方
              </h2>
              <p className="max-w-[70ch]">
                NVIDIA は Ampere 以降、CUDAコア数を FP32 換算で倍にカウントして表記しています。
                AMD の RDNA は全世代で「CU × 64」の一貫した表記なので、
                この {gpu.shaderUnits.toLocaleString('ja-JP')} という数字を
                Radeon のシェーダー数とそのまま比べることはできません。
                当サイトの性能指数はアーキテクチャごとに係数を変えて、この差を補正しています。
              </p>
            </section>
          )}

        <section className="mt-10">
          <h2 className="mb-1 font-cond text-xl font-bold">性能が近いGPU</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            指数が近いモデルを並べています。
            <strong className="font-medium text-ink">
              数%の差は誤差に埋もれるため、この並び順は信用できません。
            </strong>
            実際には逆転しえます。
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {nearby.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/gpu/${g.slug}`}
                  className="flex items-baseline justify-between gap-3 border border-rule bg-panel px-3 py-2 text-sm hover:border-ink"
                >
                  <span>{g.name}</span>
                  <span className="font-mono text-xs tabular-nums text-dim">
                    {g.perfIndex.toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {sameArch.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-cond text-xl font-bold">同じ {gpu.arch} のGPU</h2>
            <ul className="flex flex-wrap gap-2">
              {sameArch.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/gpu/${g.slug}`}
                    className="inline-block border border-rule px-2.5 py-1 text-xs text-dim hover:border-ink hover:text-ink"
                  >
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-rule-soft pt-5">
          <p className="text-sm text-dim">
            他のCPUと組み合わせた場合や、ボトルネックがどちらにあるかは
            <Link href="/tools/fps" className="text-accent underline">
              fps予想・ボトルネック診断
            </Link>
            で確認できます。他のモデルとの比較は
            <Link href="/gpu" className="text-accent underline">
              GPU一覧
            </Link>
            から。
          </p>
        </section>

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}
