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
import { VRAM_MB_PER_GB } from '@/lib/fps/diagnose';
import { GAMES, supportedGameNames } from '@/lib/fps/games';
import { PAIRING_RESOLUTION, cpuForGpu } from '@/lib/fps/pairing';
import { buildFpsTables, nearbyByIndex, referenceCpu } from '@/lib/fps/table';
import {
  describeRatio,
  generationNeighbors,
  gpuHeadline,
  rankByIndex,
  vramShortfalls,
} from '@/lib/model-summary';
import { pageMetadata } from '@/lib/seo';

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

  return pageMetadata({
    title: `${gpu.name}は何fps出る？ゲーム別の推定fpsとスペック`,
    description:
      `${gpu.name} が ${supportedGameNames('・')} で何fps出るかを、1080p・1440p・4Kと画質別に掲載。` +
      `組み合わせるCPUの目安、性能指数 ${gpu.perfIndex.toFixed(1)}、VRAM ${gpu.vramGb}GB などのスペックも。` +
      `メーカー公式スペックと自前の実測から計算した推定値です（誤差±15〜20%）。`,
    path: `/gpu/${gpu.slug}`,
  });
}

export default async function GpuDetailPage({ params }: PageProps<'/gpu/[slug]'>) {
  const { slug } = await params;
  const gpu = find(slug);
  if (!gpu) notFound();

  const cpu = referenceCpu();
  const tables = buildFpsTables(gpu, cpu);
  const nearby = nearbyByIndex(gpus, gpu);
  const sameArch = gpus.filter((g) => g.arch === gpu.arch && g.name !== gpu.name);
  // このモデルだけの情報（2026-09-27 の SEO監査への対応。数字はすべて既存の計算から）
  const headline = gpuHeadline(gpu, cpu);
  const generation = generationNeighbors(gpus, gpu, 'gpu');
  const shortfalls = vramShortfalls(gpu);
  const valorant = GAMES.find((g) => g.id === 'valorant');
  const vHigh = valorant?.presets.find((p) => p.id === 'high')?.vram4kMb;
  const vLow = valorant?.presets.find((p) => p.id === 'low')?.vram4kMb;
  const valorantVram = vHigh && vLow ? { high: vHigh, low: vLow } : null;
  // ゲームごとの「CPUが足を引っ張らない最小のCPU」。基準画質・1080p で見る
  const pairings = GAMES.filter((g) => g.supported).flatMap((game) => {
    const preset = game.presets.find((p) => p.id === game.featuredPresetId);
    if (!preset) return [];
    const pick = cpuForGpu(gpu, game, preset, cpus);
    return pick ? [{ game, preset, pick }] : [];
  });

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
          <h1 className="mb-4 grid gap-2">
            <span className="font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
              {gpu.name}
            </span>
            <span className="font-cond text-base font-bold text-dim sm:text-lg">
              ゲーム別の推定fpsとスペック
            </span>
          </h1>
          <p className="max-w-[62ch] text-dim">
            性能指数は{' '}
            <strong className="font-mono font-semibold text-ink">
              {gpu.perfIndex.toFixed(1)}
            </strong>
            （Radeon RX 9070 XT = 100）で、掲載している GPU {gpus.length}モデル中{' '}
            <strong className="font-semibold text-ink">{rankByIndex(gpus, gpu)}位</strong>
            。VRAM {gpu.vramGb}GB {gpu.memType}、TDP {gpu.tdpW}W。
          </p>
          {/* このモデルのまとめ。数字は下の表と同じ predict() の値（推定・理論値） */}
          <p className="mt-3 max-w-[62ch] text-dim">
            {`CPUに ${cpu.name} を組み合わせた 1080p では、`}
            {headline.map((h, i) => (
              <span key={h.game.id}>
                {i > 0 && '、'}
                {`${h.game.name}（${h.preset.label}）で約 `}
                <strong className="font-mono font-semibold text-ink">{h.uncapped.toFixed(0)}</strong>
                {' fps'}
                {h.overpredicts && '（高めに出る傾向）'}
                {h.capped && h.game.cap !== null && `（実際の画面は ${h.game.cap} fps で止まる）`}
              </span>
            ))}
            {' が目安です（推定・誤差 ±15〜20%）。'}
          </p>
        </header>

        {/* 販売ページへの導線。タグ未設定なら何も描画されない */}
        <div className="mt-6">
          <AffiliateLink query={gpu.name} variant="block" model={gpu} />
        </div>

        <FpsTables tables={tables} cpuName={cpu.name} />

        {/*
          VRAM が足りなくなる条件。fps予想ツールの VRAM の警告と同じ見込み（vramNeedMb）で出す。
          当てはまる条件が無いモデルでは、節ごと出さない。
        */}
        {shortfalls.length > 0 && (
          <section className="mt-10 border-2 border-ink bg-panel p-4">
            <h2 className="mb-1 font-cond text-xl font-bold">
              VRAM {gpu.vramGb}GB では足りなくなる見込みの条件
            </h2>
            <p className="mb-3 max-w-[70ch] text-xs text-dim">
              VRAM が足りないと、平均fpsにはあまり出ませんが、カクつき（1% Low）の主因になります。4Kでの測定値を基準に、解像度で概算した見込みです（推定）。
              {valorantVram &&
                `自前の実測では、VALORANT の 4K で全て高 ${(valorantVram.high / VRAM_MB_PER_GB).toFixed(2)}GB・全て低 ${(valorantVram.low / VRAM_MB_PER_GB).toFixed(2)}GB と、画質を下げても VRAM 使用量は減りませんでした。`}
            </p>
            <ul className="divide-y divide-rule-soft border-y border-rule text-sm">
              {shortfalls.map((s) => (
                <li
                  key={`${s.game.id}-${s.preset.id}-${s.resolution.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-1 py-2"
                >
                  <span>
                    <Link href={`/games/${s.game.id}`} className="font-cond font-bold hover:text-accent">
                      {s.game.name}
                    </Link>
                    <span className="ml-2 text-dim">
                      {s.preset.label}・{s.resolution.label}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-dim">
                    約 {(s.needMb / VRAM_MB_PER_GB).toFixed(1)}GB 使う見込み
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          組み合わせの目安。CPU の個別ページへつなぐ（2026-09-26 の SEO 改善）。
          数字は fps予想と同じ predict() から出している。
        */}
        {pairings.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-1 font-cond text-xl font-bold">このGPUと組み合わせるCPUの目安</h2>
            <p className="mb-3 max-w-[70ch] text-xs text-dim">
              {PAIRING_RESOLUTION}・各ゲームの基準の画質で、CPUが足を引っ張らない（CPU側の上限がGPU側とほぼ同じか上回る）最も性能指数の低いCPUです。新品で流通している可能性が高い世代から選んでいます。推定値・誤差 ±15〜20%。
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
                      <Link href={`/cpu/${pick.cpu.slug}`} className="font-bold text-accent underline underline-offset-2">
                        {pick.cpu.name}
                      </Link>
                      {' 以上'}
                    </span>
                  ) : (
                    <span>
                      {'現行のどのCPUでもCPU側が上限になります（最も速い '}
                      <Link href={`/cpu/${pick.cpu.slug}`} className="font-bold text-accent underline underline-offset-2">
                        {pick.cpu.name}
                      </Link>
                      {' でも届きません）'}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-xs tabular-nums text-dim">
                    GPU側 {pick.gpuFps.toFixed(0)} / CPU側 {pick.cpuFps.toFixed(0)} fps
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
            クロックはリファレンス仕様値です。Founders Edition や工場OCモデルはこれより高い場合があります。
          </p>
        </section>

        {gpu.vendor === 'NVIDIA' &&
          ['Ampere', 'Ada', 'Blackwell'].includes(gpu.arch) && (
            <section className="mt-8 border-l-2 border-rule pl-4 text-sm text-dim">
              <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
                シェーダーユニット数の読み方
              </h2>
              <p className="max-w-[70ch]">
                NVIDIA は Ampere 以降、CUDAコア数を FP32 換算で倍にカウントして表記しています。AMD の RDNA は全世代で「CU × 64」の一貫した表記なので、この {gpu.shaderUnits.toLocaleString('ja-JP')} という数字を
                Radeon のシェーダー数とそのまま比べることはできません。当サイトの性能指数はアーキテクチャごとに係数を変えて、この差を補正しています。
              </p>
            </section>
          )}

        {/* 全モデルの中での位置と、前後の世代の同じクラスとの差。どちらも性能指数だけから出す */}
        <section className="mt-10">
          <h2 className="mb-1 font-cond text-xl font-bold">GPU {gpus.length}モデルの中での位置</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            横軸は性能指数（推定・誤差 ±15〜20%）。細い線が掲載している各GPU、オレンジの太い線がこのGPUです。
          </p>
          <IndexStrip
            values={gpus.map((g) => g.perfIndex)}
            target={gpu.perfIndex}
            anchorValue={100}
            anchorLabel="RX 9070 XT"
            caption={`${gpu.name} は GPU ${gpus.length}モデル中 ${rankByIndex(gpus, gpu)}位`}
          />
          {(generation.previous || generation.next) && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {generation.previous && (
                <li>
                  <span className="mr-2 font-mono text-[11px] text-dim">前の世代</span>
                  <Link href={`/gpu/${generation.previous.model.slug}`} className="font-bold text-accent underline underline-offset-2">
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
                  <Link href={`/gpu/${generation.next.model.slug}`} className="font-bold text-accent underline underline-offset-2">
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
            <Link href={`/tools/fps?gpu=${gpu.slug}`} className="text-accent underline">
              ゲーム別fps予想・ボトルネック診断
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
