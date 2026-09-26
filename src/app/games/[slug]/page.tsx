import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { cpus, gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';
import { RESOLUTIONS, type ResolutionId } from '@/lib/fps/model';
import { cpuSideFps } from '@/lib/fps/pairing';
import { rankGpusForGame, referenceCpu } from '@/lib/fps/table';
import { JsonLd, pageMetadata } from '@/lib/seo';

/** 一覧に出す基準の条件。最も一般的な組み合わせを既定にする */
const BASE_RESOLUTION: ResolutionId = '1080p';

export function generateStaticParams() {
  return GAMES.filter((g) => g.supported).map((g) => ({ slug: g.id }));
}

function find(slug: string) {
  return GAMES.find((g) => g.id === slug && g.supported);
}

export async function generateMetadata({
  params,
}: PageProps<'/games/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const game = find(slug);
  if (!game) return {};

  return pageMetadata({
    title: `${game.name}の推奨スペックと必要なGPU｜解像度別の推定fps`,
    description:
      `${game.name} を1080p・1440p・4Kで60・144・240fps出すのに必要なGPUと、` +
      `GPU ${gpus.length}モデル別の推定fps、CPU別のfps上限を掲載。` +
      `メーカー公式スペックと実測から計算した推定値です（誤差±15〜20%）。`,
    path: `/games/${game.id}`,
  });
}

export default async function GameDetailPage({ params }: PageProps<'/games/[slug]'>) {
  const { slug } = await params;
  const game = find(slug);
  if (!game) notFound();

  const cpu = referenceCpu();
  // 最も軽いプリセットと最も重いプリセットの2軸で見せる
  const lightest = game.presets.reduce((a, b) => (a.factor > b.factor ? a : b));
  const heaviest = game.presets.reduce((a, b) => (a.factor < b.factor ? a : b));

  // 主役はゲームごとに指定した基準プリセット（Fortnite なら Performance）。
  // 対になる列には、その反対側（軽い方が主役なら最も重い設定）を出す。
  const featured = game.presets.find((p) => p.id === game.featuredPresetId) ?? heaviest;
  const other = featured.id === heaviest.id ? lightest : heaviest;

  const ranked = rankGpusForGame({
    gpus,
    cpu,
    gameId: game.id,
    presetId: featured.id,
    resolution: BASE_RESOLUTION,
  });

  const rankedOther = rankGpusForGame({
    gpus,
    cpu,
    gameId: game.id,
    presetId: other.id,
    resolution: BASE_RESOLUTION,
  });
  const otherByName = new Map(rankedOther.map((r) => [r.gpu.name, r]));

  // 予想が高めに出ると分かっているGPUは、最小GPU欄の主役にしない。
  // 表の行には残し、印を付けるだけにする（持っているGPUの目安は知りたいため）
  const floor = game.overpredictsBelowIndex;
  const overpredicts = (perfIndex: number) => floor !== null && perfIndex < floor;

  // 60 / 144 / 240 fps に届く最小のGPUを、解像度ごとに探す（安い順ではなく指数の低い順）。
  // 以前は 1080p だけだったが、説明文の「解像度別」と食い違っていたので 1440p・4K も出す（2026-09-26）
  const thresholds = [60, 144, 240];
  const byResolution = RESOLUTIONS.map((res) => ({
    res,
    ranked:
      res.id === BASE_RESOLUTION
        ? ranked
        : rankGpusForGame({ gpus, cpu, gameId: game.id, presetId: featured.id, resolution: res.id }),
  }));
  const minimumGpu = (list: typeof ranked, target: number) => {
    const candidates = list.filter((r) => r.uncapped >= target && !overpredicts(r.gpu.perfIndex));
    return candidates.length > 0 ? candidates[candidates.length - 1]! : null;
  };

  // CPU別の上限。CPU側の値は解像度と画質によらないので、1つのゲームにつき1つ
  const cpuCaps = cpus
    .map((c) => ({ cpu: c, fps: cpuSideFps(c, game, featured) }))
    .sort((a, b) => b.fps - a.fps);

  // よくある質問。答えはすべてこのページに出している計算値から作る（画面と構造化データで同じ文）
  const faq = gameFaq({
    gameName: game.name,
    presetLabel: featured.label,
    cpuName: cpu.name,
    cap: game.cap,
    min1080: minimumGpu(byResolution[0]!.ranked, 144),
    min1440: minimumGpu(byResolution[1]!.ranked, 144),
    lowestCpu: cpuCaps[cpuCaps.length - 1]!,
    highestCpu: cpuCaps[0]!,
  });
  const diagnoseHref = `/tools/fps?game=${game.id}`;

  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        <Breadcrumbs
          trail={[
            { href: '/games', label: 'ゲーム別' },
            { href: `/games/${game.id}`, label: game.name },
          ]}
        />

        <header className="border-b border-ink pt-6 pb-7">
          <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
            GAME / {game.name}
          </p>
          <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
            {game.name} の推奨スペック
          </h1>
          <p className="max-w-[62ch] text-dim">
            GPU {gpus.length}モデルそれぞれで {game.name} が何fps出るかの推定値です。CPUは {cpu.name} を組み合わせた場合。推定値・誤差 ±15〜20%。
          </p>
          {/* 検索から来た人が、そのままこのゲームで診断に入れるように */}
          <Link
            href={diagnoseHref}
            className="group mt-5 inline-flex items-center gap-3 border-2 border-ink bg-ink px-4 py-2.5 font-cond text-base font-bold text-paper hover:bg-accent-vivid hover:text-ink"
          >
            {game.name}で自分の構成を診断する
            <span aria-hidden className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
              →
            </span>
          </Link>
        </header>

        {game.highlight && (
          <div className="mt-7 border border-accent bg-accent-soft p-4">
            <p className="font-cond text-base font-bold text-ink">
              {game.highlight.title}
            </p>
            <p className="mt-1 max-w-[70ch] text-xs text-dim">
              {game.highlight.body}
              {game.highlight.comparison?.appliesTo === 'all' ? (
                <>
                  このページの数値も「{game.highlight.comparison.measuredLabel}」の値なので、「{game.highlight.comparison.lighterLabel}」では約{' '}
                  {game.highlight.comparison.lighterMultiplier.toFixed(2)} 倍（+
                  {Math.round((game.highlight.comparison.lighterMultiplier - 1) * 100)}%）を目安にしてください。
                </>
              ) : game.highlight.comparison?.appliesTo === 'gpu' ? (
                // 倍率はGPU側だけに掛かる。CPU側と上限で止まる構成では伸びないことまで書く
                <>
                  このページの数値も「{game.highlight.comparison.measuredLabel}」の値です。「{game.highlight.comparison.lighterLabel}」では、GPUが上限を決めている構成で約{' '}
                  {game.highlight.comparison.lighterMultiplier.toFixed(2)} 倍（+
                  {Math.round((game.highlight.comparison.lighterMultiplier - 1) * 100)}%）が目安です（CPU側の上限{game.cap !== null && `と ${game.cap}fps の上限`}で頭打ちになります）。構成ごとの値は
                  <Link href={diagnoseHref} className="text-accent underline">
                    ゲーム別fps予想ツール
                  </Link>
                  で出せます。
                </>
              ) : (
                'このページの数値も同じ条件での値です。'
              )}
            </p>
            {game.highlight.comparison?.basis && (
              <p className="mt-2 max-w-[70ch] text-[11px] text-dim">
                根拠: {game.highlight.comparison.basis}
              </p>
            )}
          </div>
        )}

        <section className="py-7">
          <h2 className="mb-1 font-cond text-xl font-bold">
            解像度別：目標fpsに届く最小のGPU（{featured.label}）
          </h2>
          <p className="mb-4 max-w-[70ch] text-xs text-dim">
            各解像度で、それぞれのfpsに届く最も性能指数が低いGPUです。CPUは {cpu.name} の場合。近接モデルの順位は誤差に埋もれるため、目安として見てください。
            {floor !== null &&
              `性能指数${floor}未満のGPUは予想が高めに出るため、ここには出していません。`}
          </p>
          <div className="md:overflow-x-auto">
            <table className="spec-table w-full border-collapse border-2 border-ink bg-panel text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-rule-soft">
                  <th scope="col" className="px-3 py-2 text-left font-mono text-[10px] font-semibold tracking-[0.12em] text-dim">
                    目標
                  </th>
                  {byResolution.map(({ res }) => (
                    <th
                      key={res.id}
                      scope="col"
                      className="px-3 py-2 text-left font-mono text-[10px] font-semibold tracking-[0.12em] text-dim"
                    >
                      {res.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t) => (
                  <tr key={t} className="spec-row border-b border-rule last:border-b-0">
                    <th scope="row" className="px-3 py-3 text-left font-mono text-sm font-semibold whitespace-nowrap">
                      {t} fps 以上
                    </th>
                    {byResolution.map(({ res, ranked: list }) => {
                      const entry = minimumGpu(list, t);
                      return (
                        <td key={res.id} data-label={res.short} className="px-3 py-3 align-top">
                          {entry ? (
                            <>
                              <Link
                                href={`/gpu/${entry.gpu.slug}#${game.id}`}
                                className="font-cond font-bold text-accent underline underline-offset-2"
                              >
                                {entry.gpu.name}
                              </Link>
                              <span className="ml-2 font-mono text-xs tabular-nums text-dim">
                                {entry.uncapped.toFixed(0)} fps
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-dim">掲載しているGPUでは届きません</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-4">
          <h2 className="mb-1 font-cond text-xl font-bold">GPU別の推定fps</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            {BASE_RESOLUTION} / {featured.label}を基準にした推定値です。他の解像度や画質、CPUを変えた場合は
            <Link href="/tools/fps" className="text-accent underline">
              ゲーム別fps予想ツール
            </Link>
            で確認できます。
          </p>
          {/*
            スマホでは globals.css の @media で1行=1カードに組み替わる。
            見出しが長い（「最高（Epic / Lumen Epic）」等）ため、
            そのままだと横スクロールになってしまう。
          */}
          <div className="md:overflow-x-auto">
            <table className="spec-table w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-ink">
                  <th className="px-2 py-2 text-left font-cond text-xs">GPU</th>
                  <th className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap">
                    {featured.label}
                  </th>
                  <th className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap">
                    {other.label}
                  </th>
                  <th className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap">
                    VRAM
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr key={r.gpu.slug} className="spec-row border-b border-rule-soft">
                    <th scope="row" className="px-2 py-2 text-left font-normal">
                      <Link href={`/gpu/${r.gpu.slug}#${game.id}`} className="hover:text-accent">
                        {r.gpu.name}
                      </Link>
                      {overpredicts(r.gpu.perfIndex) && (
                        <span className="ml-2 text-[11px] whitespace-nowrap text-dim">
                          ※高めに出る傾向
                        </span>
                      )}
                    </th>
                    <td
                      data-label={featured.label}
                      className="px-2 py-2 text-right font-mono tabular-nums whitespace-nowrap"
                    >
                      <FpsCell entry={r} cap={game.cap} />
                    </td>
                    <td
                      data-label={other.label}
                      className="px-2 py-2 text-right font-mono text-dim tabular-nums whitespace-nowrap"
                    >
                      <FpsCell
                        entry={otherByName.get(r.gpu.name) ?? { uncapped: 0, capped: false }}
                        cap={game.cap}
                      />
                    </td>
                    <td
                      data-label="VRAM"
                      className="px-2 py-2 text-right font-mono text-xs text-dim tabular-nums whitespace-nowrap"
                    >
                      {r.gpu.vramGb} GB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-1 font-cond text-xl font-bold">CPU別のfps上限</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            GPUが十分に速いときに、各CPUで {game.name} が出せるfpsの上限（CPU側の値）です。このサイトの計算では、CPU側の値は解像度と画質によらず一定で、GPU側のfpsがこれを超えるとCPUが上限を決めます。推定値・誤差 ±15〜20%。
          </p>
          <ol className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {cpuCaps.map(({ cpu: c, fps }) => (
              <li key={c.slug} className="flex items-baseline justify-between gap-3 border-b border-rule-soft py-1.5 text-sm">
                <Link href={`/cpu/${c.slug}#${game.id}`} className="hover:text-accent">
                  {c.name}
                </Link>
                <span className="shrink-0 font-mono text-xs tabular-nums">
                  {fps.toFixed(0)} fps
                  {game.cap !== null && fps > game.cap && (
                    <span className="ml-1.5 text-[10px] text-dim">上限{game.cap}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-cond text-xl font-bold">よくある質問</h2>
          <dl className="divide-y divide-rule border-y-2 border-ink">
            {faq.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-cond text-base font-bold">{f.q}</dt>
                <dd className="mt-1.5 max-w-[70ch] text-sm text-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
          {/* FAQPage の構造化データ。中身は上に表示している質問と答えと同じ */}
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }}
          />
        </section>

        <section className="mt-8 border-l-2 border-accent pl-4 text-sm text-dim">
          <h2 className="mb-1.5 font-cond text-base font-bold text-ink">
            この数値について
          </h2>
          <ul className="max-w-[70ch] space-y-1">
            {game.notes.map((n) => (
              <li key={n}>・{n}</li>
            ))}
            <li>・根拠: {game.confidenceLabel}</li>
            {game.cap !== null && (
              <li>
                ・表の数値は、ゲーム側のfps上限が無い場合の理論値です。「上限{game.cap}」と付いたものは、実際の画面では {game.cap} fps で止まります。上限を超える部分は確かめることができません。
              </li>
            )}
            {featured.note && <li>・{featured.label}: {featured.note}</li>}
            {featured.lowRatio && (
              <li>
                ・この表は平均fpsです。{featured.label}の 1% Low（カクつき）は平均の {Math.round(featured.lowRatio.min * 100)}〜
                {Math.round(featured.lowRatio.max * 100)}% でした。構成ごとの値は
                <Link href={diagnoseHref} className="text-accent underline">
                  ゲーム別fps予想ツール
                </Link>
                で出せます。
              </li>
            )}
            <li>
              ・解像度の下げ方や設定の効き方はゲームごとに違います。
              {game.name} では、画質を「{heaviest.label}」から「{lightest.label}」に下げると約 {(lightest.factor / heaviest.factor).toFixed(1)} 倍になります。
            </li>
          </ul>
        </section>

        {RESOLUTIONS.length > 0 && (
          <section className="mt-8 border-t border-rule-soft pt-5">
            <p className="text-sm text-dim">
              自分の構成で調べるなら
              <Link href={diagnoseHref} className="text-accent underline">
                ゲーム別fps予想・ボトルネック診断
              </Link>
              が便利です。GPUとCPUを選ぶだけで、どちらが足を引っ張っているかまで出ます。
            </p>
          </section>
        )}

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}

/**
 * 表の1セル分のfps。数値は理論値（ゲーム側の上限を除いた値）で、
 * 上限で止まるときだけ上限を小さく添える（性能の差を主役にし、上限は補足にするため）。
 */
function FpsCell({
  entry,
  cap,
}: {
  entry: { uncapped: number; capped: boolean };
  cap: number | null;
}) {
  return (
    <>
      {entry.uncapped.toFixed(0)}
      {entry.capped && cap !== null && (
        <span className="ml-1.5 text-[10px] text-dim">上限{cap}</span>
      )}
    </>
  );
}

type GpuEntry = { gpu: { name: string }; uncapped: number } | null;

/**
 * ゲームページの「よくある質問」。
 *
 * 答えはすべて、このページに表示している計算値から組み立てる（新しい数字は作らない）。
 * 画面の表示と FAQPage の構造化データの両方に同じ文を使う（Google のガイドラインで、
 * ページに無い内容を構造化データだけに書くのは禁止のため）。
 * 上限の質問は、ゲーム側の上限が分かっているゲームだけに出す（無いと言い切れる根拠が無いため）。
 */
function gameFaq(args: {
  gameName: string;
  presetLabel: string;
  cpuName: string;
  cap: number | null;
  min1080: GpuEntry;
  min1440: GpuEntry;
  lowestCpu: { cpu: { name: string }; fps: number };
  highestCpu: { cpu: { name: string }; fps: number };
}): { q: string; a: string }[] {
  const { gameName, presetLabel, cpuName, cap, min1080, min1440, lowestCpu, highestCpu } = args;
  const at = (label: string, e: GpuEntry) =>
    e ? `${label}なら${e.gpu.name}（推定${e.uncapped.toFixed(0)}fps）` : `${label}では掲載しているGPUでは届かず`;

  const items = [
    {
      q: `${gameName}で144fpsを出すには、どのGPUが必要ですか？`,
      a:
        `画質「${presetLabel}」の場合、${at('1080p', min1080)}、${at('1440p', min1440)}が、` +
        `144fpsに届く最も性能指数の低いGPUの目安です。CPUは${cpuName}の場合の推定値で、誤差は±15〜20%です。`,
    },
    {
      q: `${gameName}のfpsは、CPUによってどれくらい変わりますか？`,
      a:
        `GPUが十分に速い場合、CPU側の上限は${lowestCpu.cpu.name}で約${lowestCpu.fps.toFixed(0)}fps、` +
        `${highestCpu.cpu.name}で約${highestCpu.fps.toFixed(0)}fpsです（推定）。` +
        'GPU側のfpsは解像度を下げるほど伸びるため、1080pのように解像度が低いほどCPUの差が出やすくなります。',
    },
  ];
  if (cap !== null) {
    items.push({
      q: `${gameName}にfpsの上限はありますか？`,
      a:
        `ゲーム側の上限が${cap}fpsです。これを超える性能の構成でも、実際の画面では${cap}fpsで止まります。` +
        'このサイトの表の数値は、上限を除いた理論値です。',
    });
  }
  return items;
}
