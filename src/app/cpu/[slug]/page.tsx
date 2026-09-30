import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { AffiliateLink } from '@/components/AffiliateLink';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FpsTables } from '@/components/model/FpsTables';
import { IndexStrip } from '@/components/model/IndexStrip';
import { SpecList } from '@/components/model/SpecList';
import { VerifiedTag } from '@/components/spec-table/VerifiedTag';
import { cpus, gpus } from '@/lib/data';
import { GAMES, supportedGameNames } from '@/lib/fps/games';
import { PAIRING_RESOLUTION, gpuForCpu } from '@/lib/fps/pairing';
import { buildFpsTables, nearbyByIndex } from '@/lib/fps/table';
import { cpuHeadline, describeRatio, generationNeighbors, rankByIndex } from '@/lib/model-summary';
import { pageMetadata } from '@/lib/seo';

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

  return pageMetadata({
    title: `${cpu.name}のゲーム性能｜fps上限と合うGPU`,
    description:
      `${cpu.name} が ${supportedGameNames('・')} で何fpsまで出せるかの推定値と、性能を出し切れるGPUの目安。` +
      `性能指数 ${cpu.perfIndex.toFixed(1)}、${cpu.cores}コア${cpu.threads}スレッド、L3キャッシュ ${cpu.l3CacheMb}MB。` +
      `メーカー公式スペックと自前の実測から計算しています（誤差±15〜20%）。`,
    path: `/cpu/${cpu.slug}`,
  });
}

export default async function CpuDetailPage({ params }: PageProps<'/cpu/[slug]'>) {
  const { slug } = await params;
  const cpu = find(slug);
  if (!cpu) notFound();

  const gpu = gpus.find((g) => g.name === REFERENCE_GPU_NAME) ?? gpus[0]!;
  const tables = buildFpsTables(gpu, cpu);
  const nearby = nearbyByIndex(cpus, cpu);
  const sameArch = cpus.filter((c) => c.arch === cpu.arch && c.name !== cpu.name);
  // このモデルだけの情報（2026-09-27 の SEO監査への対応。数字はすべて既存の計算から）
  const headline = cpuHeadline(cpu);
  const generation = generationNeighbors(cpus, cpu, 'cpu');
  // ゲームごとの「このCPUが足を引っ張らずに済む上限のGPU」。基準画質・1080p で見る
  const pairings = GAMES.filter((g) => g.supported).flatMap((game) => {
    const preset = game.presets.find((p) => p.id === game.featuredPresetId);
    if (!preset) return [];
    const pick = gpuForCpu(cpu, game, preset, gpus);
    return pick ? [{ game, preset, pick }] : [];
  });

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

        <header className="border-b border-frame pt-6 pb-7">
          <p className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
            {cpu.vendor} / {cpu.arch} / {cpu.releaseYear}
            <VerifiedTag verified={cpu.verified} />
          </p>
          <h1 className="mb-4 grid gap-2">
            <span className="font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
              {cpu.name}
            </span>
            <span className="font-cond text-base font-bold text-dim sm:text-lg">
              ゲーム別のfps上限と合うGPU
            </span>
          </h1>
          <p className="max-w-[62ch] text-dim">
            性能指数は{' '}
            <strong className="font-mono font-semibold text-ink">
              {cpu.perfIndex.toFixed(1)}
            </strong>
            （Ryzen 7 9800X3D = 100）で、掲載している CPU {cpus.length}モデル中{' '}
            <strong className="font-semibold text-ink">{rankByIndex(cpus, cpu)}位</strong>
            。{cpu.cores}コア{cpu.threads}スレッド、L3キャッシュ {cpu.l3CacheMb}MB
            {cpu.has3dVCache && '（3D V-Cache 搭載）'}、ソケット {cpu.socket}。
          </p>
          {/* このモデルのまとめ。CPU側の上限は解像度と画質によらない（下の表・ゲームページと同じ計算） */}
          <p className="mt-3 max-w-[62ch] text-dim">
            {'GPUが十分に速いとき、このCPUで出せるfpsの上限は、'}
            {headline.map((h, i) => (
              <span key={h.game.id}>
                {i > 0 && '、'}
                {`${h.game.name}で約 `}
                <strong className="font-mono font-semibold text-ink">{h.fps.toFixed(0)}</strong>
                {' fps'}
                {h.game.cap !== null && h.fps > h.game.cap && `（実際の画面は ${h.game.cap} fps で止まる）`}
              </span>
            ))}
            {' が目安です（推定・誤差 ±15〜20%）。以下の表は、GPUに '}
            {gpu.name}
            {' を組み合わせた場合の推定値です。'}
          </p>
        </header>

        {/* 販売ページへの導線。タグ未設定なら何も描画されない */}
        <div className="mt-6">
          {/*
            CPU には VRAM が無いので、GPU 向けの既定の注意書き（型番とVRAM容量）は使わない（2026-09-27 の SEO監査の指摘）。
            CPU で間違えやすいのは、手持ちのマザーボードと合わないソケットを買うこと。
          */}
          <AffiliateLink
            query={cpu.name}
            variant="block"
            model={cpu}
            advice={
              <>
                検索結果には別のモデルやアクセサリも表示されます。
                <strong className="font-medium text-ink">
                  型番と、ソケット（このCPUは {cpu.socket}）がマザーボードに合うか
                </strong>
                を確認してから購入してください。CPUクーラーが付属するかは販売ページで確認できます。
              </>
            }
          />
        </div>

        <FpsTables tables={tables} cpuName={cpu.name} />

        {/*
          組み合わせの目安。GPU の個別ページへつなぐ（2026-09-26 の SEO 改善）。
          数字は fps予想と同じ predict() から出している。
        */}
        {pairings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-1 font-cond text-xl font-bold">このCPUで性能を出し切れるGPUの目安</h2>
            <p className="mb-3 max-w-[70ch] text-xs text-dim">
              {PAIRING_RESOLUTION}・各ゲームの基準の画質で、このCPUが足を引っ張らずに済む（GPU側がCPU側の上限とほぼ同じか下回る）最も性能指数の高いGPUです。これより速いGPUにしても、fpsはCPUで頭打ちになります。新品で流通している可能性が高い世代から選んでいます。推定値・誤差 ±15〜20%。
            </p>
            <ul className="divide-y divide-rule-soft border-y border-rule">
              {pairings.map(({ game, preset, pick }) => (
                <li key={game.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1 py-2.5 text-sm">
                  <Link href={`/games/${game.id}`} className="min-w-[9rem] font-cond font-bold hover:text-accent">
                    {game.name}
                    <span className="ml-1 text-xs font-normal text-dim">（{preset.label}）</span>
                  </Link>
                  {pick.kind === 'ok' ? (
                    <span>
                      <Link href={`/gpu/${pick.gpu.slug}`} className="font-bold text-accent underline underline-offset-2">
                        {pick.gpu.name}
                      </Link>
                      {' まで'}
                    </span>
                  ) : (
                    <span>
                      {'現行のどのGPUでもCPU側が上限になります（最も遅い '}
                      <Link href={`/gpu/${pick.gpu.slug}`} className="font-bold text-accent underline underline-offset-2">
                        {pick.gpu.name}
                      </Link>
                      {' でも上回ります）'}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs tabular-nums text-dim">
                    CPU側 {pick.cpuFps.toFixed(0)} / GPU側 {pick.gpuFps.toFixed(0)} fps
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
              ゲームはL3キャッシュの容量に敏感で、容量が増えるとメモリ待ちが減ります。当サイトの性能指数もL3容量を対数で効かせており、このモデルの {cpu.l3CacheMb}MB という容量が指数を押し上げています。クロックが同世代の非X3Dより低くても、ゲームでは上回ることがあるのはこのためです。
            </p>
          </section>
        )}

        {isDualCcd && (
          <section className="mt-8 border-l-2 border-rule pl-4 text-sm text-dim">
            <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
              コアが2つのブロックに分かれている点について
            </h2>
            <p className="max-w-[70ch]">
              {cpu.cores}コアのRyzenは、コアが2つのブロック（CCD）に分かれています。ゲームは基本的に片方のブロックで動くため、L3キャッシュも実質的にその片方ぶんしか使えません。
              {cpu.has3dVCache
                ? 'キャッシュを積んでいる側のブロックで動く前提で指数を計算しており、そちらのクロックが低いぶんも補正しています。'
                : 'L3が分割されるぶんを差し引いて指数を計算しています。コア数が多いほどゲームが速くなるわけではありません。'}
            </p>
          </section>
        )}

        {/* 全モデルの中での位置と、前後の世代の同じクラスとの差。どちらも性能指数だけから出す */}
        <section className="mt-10">
          <h2 className="mb-1 font-cond text-xl font-bold">CPU {cpus.length}モデルの中での位置</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            横軸はゲーム向けの性能指数（推定・誤差 ±15〜20%）。細い線が掲載している各CPU、明るい青の太い線がこのCPUです。
          </p>
          <IndexStrip
            values={cpus.map((c) => c.perfIndex)}
            target={cpu.perfIndex}
            anchorValue={100}
            anchorLabel="9800X3D"
            caption={`${cpu.name} は CPU ${cpus.length}モデル中 ${rankByIndex(cpus, cpu)}位`}
          />
          {(generation.previous || generation.next) && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {generation.previous && (
                <li>
                  <span className="mr-2 font-mono text-[11px] text-dim">前の世代</span>
                  <Link href={`/cpu/${generation.previous.model.slug}`} className="font-bold text-accent underline underline-offset-2">
                    {generation.previous.model.name}
                  </Link>
                  {` より性能指数が${describeRatio(generation.previous.ratio)}`}
                  <span className="ml-1 font-mono text-xs text-dim">
                    （指数 {generation.previous.model.perfIndex.toFixed(1)}）
                  </span>
                </li>
              )}
              {generation.next && (
                <li>
                  <span className="mr-2 font-mono text-[11px] text-dim">次の世代</span>
                  <Link href={`/cpu/${generation.next.model.slug}`} className="font-bold text-accent underline underline-offset-2">
                    {generation.next.model.name}
                  </Link>
                  {` より性能指数が${describeRatio(generation.next.ratio)}`}
                  <span className="ml-1 font-mono text-xs text-dim">
                    （指数 {generation.next.model.perfIndex.toFixed(1)}）
                  </span>
                </li>
              )}
            </ul>
          )}
        </section>

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
                  className="rounded-lg flex items-baseline justify-between gap-3 border border-rule bg-panel px-3 py-2 text-sm hover:border-accent"
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
                    className="inline-block border border-rule px-2.5 py-1 text-xs text-dim hover:border-accent hover:text-ink"
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
            <Link href={`/tools/fps?cpu=${cpu.slug}`} className="text-accent underline">
              ゲーム別fps予想・ボトルネック診断
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
