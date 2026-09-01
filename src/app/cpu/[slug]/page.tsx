import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FpsTables } from '@/components/model/FpsTables';
import { SpecList } from '@/components/model/SpecList';
import { VerifiedTag } from '@/components/spec-table/VerifiedTag';
import { cpus, gpus } from '@/lib/data';
import { buildFpsTables, nearbyByIndex } from '@/lib/fps/table';

/** CPUページで組み合わせる基準GPU。実測アンカーのGPUを使う */
const REFERENCE_GPU_NAME = 'Radeon RX 9070 XT';

export function generateStaticParams() {
  return cpus.map((c) => ({ slug: c.slug }));
}

function find(slug: string) {
  return cpus.find((c) => c.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<'/cpu/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const cpu = find(slug);
  if (!cpu) return {};

  return {
    title: `${cpu.name} のゲーム性能とfps上限`,
    description:
      `${cpu.name} がゲームで何fpsまで対応できるかの推定値。性能指数は ` +
      `${cpu.perfIndex.toFixed(1)}、${cpu.cores}コア${cpu.threads}スレッド、` +
      `L3キャッシュ ${cpu.l3CacheMb}MB。メーカー公式スペックと自前の実測から計算しています（誤差±15〜20%）。`,
    alternates: { canonical: `/cpu/${cpu.slug}` },
  };
}

export default async function CpuDetailPage({ params }: PageProps<'/cpu/[slug]'>) {
  const { slug } = await params;
  const cpu = find(slug);
  if (!cpu) notFound();

  const gpu = gpus.find((g) => g.name === REFERENCE_GPU_NAME) ?? gpus[0]!;
  const tables = buildFpsTables(gpu, cpu);
  const nearby = nearbyByIndex(cpus, cpu);
  const sameArch = cpus.filter((c) => c.arch === cpu.arch && c.name !== cpu.name);

  const isDualCcd = cpu.vendor === 'AMD' && cpu.cores >= 9;

  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs
          trail={[
            { href: '/cpu', label: 'CPU一覧' },
            { href: `/cpu/${cpu.slug}`, label: cpu.name },
          ]}
        />

        <header className="border-b border-ink pt-6 pb-7">
          <p className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
            {cpu.vendor} / {cpu.arch} / {cpu.releaseYear}
            <VerifiedTag verified={cpu.verified} />
          </p>
          <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
            {cpu.name}
          </h1>
          <p className="max-w-[62ch] text-dim">
            性能指数は{' '}
            <strong className="font-mono font-semibold text-ink">
              {cpu.perfIndex.toFixed(1)}
            </strong>
            （Ryzen 7 9800X3D = 100）。{cpu.cores}コア{cpu.threads}スレッド、
            L3キャッシュ {cpu.l3CacheMb}MB
            {cpu.has3dVCache && '（3D V-Cache 搭載）'}。
            以下のfpsは、GPUに {gpu.name} を組み合わせた場合の推定値です。
          </p>
        </header>

        <FpsTables tables={tables} cpuName={cpu.name} />

        <section className="mt-10">
          <h2 className="mb-3 font-cond text-xl font-bold">スペック</h2>
          <SpecList
            items={[
              ['アーキテクチャ', cpu.arch],
              ['発売年', String(cpu.releaseYear)],
              ['コア / スレッド', `${cpu.cores} / ${cpu.threads}`],
              ['ベースクロック', `${cpu.baseClockGhz.toFixed(1)} GHz`],
              ['ブーストクロック', `${cpu.boostClockGhz.toFixed(1)} GHz`],
              ['L3キャッシュ', `${cpu.l3CacheMb} MB`],
              ['L2キャッシュ', `${cpu.l2CacheMb} MB`],
              ['TDP', `${cpu.tdpW} W`],
              ['ソケット', cpu.socket],
              ['対応メモリ', cpu.memSupport],
              ['3D V-Cache', cpu.has3dVCache ? '搭載' : '—'],
              ['性能指数（推定）', cpu.perfIndex.toFixed(1)],
              ['検証状態', cpu.verified],
            ]}
          />
        </section>

        {cpu.has3dVCache && (
          <section className="mt-8 border-l-2 border-accent pl-4 text-sm text-dim">
            <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
              3D V-Cache がゲームに効く理由
            </h2>
            <p className="max-w-[70ch]">
              ゲームはL3キャッシュの容量に敏感で、容量が増えるとメモリ待ちが減ります。
              当サイトの性能指数もL3容量を対数で効かせており、
              このモデルの {cpu.l3CacheMb}MB という容量が指数を押し上げています。
              クロックが同世代の非X3Dより低くても、ゲームでは上回ることがあるのはこのためです。
            </p>
          </section>
        )}

        {isDualCcd && (
          <section className="mt-8 border-l-2 border-rule pl-4 text-sm text-dim">
            <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
              コアが2つのブロックに分かれている点について
            </h2>
            <p className="max-w-[70ch]">
              {cpu.cores}コアのRyzenは、コアが2つのブロック（CCD）に分かれています。
              ゲームは基本的に片方のブロックで動くため、
              L3キャッシュも実質的にその片方ぶんしか使えません。
              {cpu.has3dVCache
                ? 'キャッシュを積んでいる側のブロックで動く前提で指数を計算しており、そちらのクロックが低いぶんも補正しています。'
                : 'L3が分割されるぶんを差し引いて指数を計算しています。コア数が多いほどゲームが速くなるわけではありません。'}
            </p>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-1 font-cond text-xl font-bold">性能が近いCPU</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            指数が近いモデルを並べています。
            <strong className="font-medium text-ink">
              数%の差は誤差に埋もれるため、この並び順は信用できません。
            </strong>
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {nearby.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/cpu/${c.slug}`}
                  className="flex items-baseline justify-between gap-3 border border-rule bg-panel px-3 py-2 text-sm hover:border-ink"
                >
                  <span>{c.name}</span>
                  <span className="font-mono text-xs tabular-nums text-dim">
                    {c.perfIndex.toFixed(1)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {sameArch.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-cond text-xl font-bold">同じ {cpu.arch} のCPU</h2>
            <ul className="flex flex-wrap gap-2">
              {sameArch.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/cpu/${c.slug}`}
                    className="inline-block border border-rule px-2.5 py-1 text-xs text-dim hover:border-ink hover:text-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-rule-soft pt-5">
          <p className="text-sm text-dim">
            他のGPUと組み合わせた場合や、ボトルネックがどちらにあるかは
            <Link href="/tools/fps" className="text-accent underline">
              fps予想・ボトルネック診断
            </Link>
            で確認できます。他のモデルとの比較は
            <Link href="/cpu" className="text-accent underline">
              CPU一覧
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
