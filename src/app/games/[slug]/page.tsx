import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { gpus } from '@/lib/data';
import { GAMES } from '@/lib/fps/games';
import { RESOLUTIONS, type ResolutionId } from '@/lib/fps/model';
import { rankGpusForGame, referenceCpu } from '@/lib/fps/table';

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

  return {
    title: `${game.name} の推奨スペックとGPU別fps`,
    description:
      `${game.name} が各GPUで何fps出るかを一覧で掲載。フルHD・WQHD・4Kの解像度別、` +
      `画質プリセット別の推定値です。必要なVRAMやCPU側の上限も掲載。` +
      `メーカー公式スペックと実測から計算しています（誤差±15〜20%）。`,
    alternates: { canonical: `/games/${game.id}` },
  };
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

  // 60 / 144 / 240 fps に届く最小構成を探す（安い順ではなく指数の低い順）
  const thresholds = [60, 144, 240];
  const minimums = thresholds.map((t) => {
    const candidates = ranked.filter((r) => r.fps >= t && !overpredicts(r.gpu.perfIndex));
    const min = candidates.length > 0 ? candidates[candidates.length - 1]! : null;
    return { threshold: t, entry: min };
  });

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
            GPU {gpus.length}モデルそれぞれで {game.name} が何fps出るかの推定値です。
            CPUは {cpu.name} を組み合わせた場合。推定値・誤差 ±15〜20%。
          </p>
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
                  このページの数値も「{game.highlight.comparison.measuredLabel}」の値なので、
                  「{game.highlight.comparison.lighterLabel}」では約{' '}
                  {game.highlight.comparison.lighterMultiplier.toFixed(2)} 倍（+
                  {Math.round((game.highlight.comparison.lighterMultiplier - 1) * 100)}%）を目安にしてください。
                </>
              ) : game.highlight.comparison?.appliesTo === 'gpu' ? (
                // 倍率はGPU側だけに掛かる。CPU側と上限で止まる構成では伸びないことまで書く
                <>
                  このページの数値も「{game.highlight.comparison.measuredLabel}」の値です。
                  「{game.highlight.comparison.lighterLabel}」では、GPUが上限を決めている構成で約{' '}
                  {game.highlight.comparison.lighterMultiplier.toFixed(2)} 倍（+
                  {Math.round((game.highlight.comparison.lighterMultiplier - 1) * 100)}%）が目安です
                  （CPU側の上限{game.cap !== null && `と ${game.cap}fps の上限`}で頭打ちになります）。
                  構成ごとの値は
                  <Link href="/tools/fps" className="text-accent underline">
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
            目標fpsに届く最小のGPU（{BASE_RESOLUTION} / {featured.label}）
          </h2>
          <p className="mb-4 max-w-[70ch] text-xs text-dim">
            この条件で各fpsに届く、最も性能指数が低いGPUです。
            近接モデルの順位は誤差に埋もれるため、目安として見てください。
            {floor !== null &&
              `性能指数${floor}未満のGPUは予想が高めに出るため、ここには出していません。`}
          </p>
          <dl className="grid gap-3 sm:grid-cols-3">
            {minimums.map(({ threshold, entry }) => (
              <div key={threshold} className="border border-rule bg-panel p-4">
                <dt className="font-mono text-xs text-dim">{threshold} fps 以上</dt>
                <dd className="mt-1">
                  {entry ? (
                    <>
                      <Link
                        href={`/gpu/${entry.gpu.slug}`}
                        className="font-cond text-base font-bold text-accent underline"
                      >
                        {entry.gpu.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs tabular-nums text-dim">
                        {entry.fps.toFixed(0)} fps
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-dim">
                      掲載しているGPUでは届きません
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-4">
          <h2 className="mb-1 font-cond text-xl font-bold">GPU別の推定fps</h2>
          <p className="mb-3 max-w-[70ch] text-xs text-dim">
            {BASE_RESOLUTION} / {featured.label} を基準にした推定値です。
            他の解像度や画質、CPUを変えた場合は
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
                      <Link href={`/gpu/${r.gpu.slug}`} className="hover:text-accent">
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
                      <FpsWithTheory entry={r} />
                    </td>
                    <td
                      data-label={other.label}
                      className="px-2 py-2 text-right font-mono text-dim tabular-nums whitespace-nowrap"
                    >
                      <FpsWithTheory entry={otherByName.get(r.gpu.name) ?? { fps: 0, uncapped: 0 }} />
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
                ・表の「理論」は、ゲーム側のfps上限（{game.cap}fps）が無い場合の計算上の値です。
                実際の表示は {game.cap} で止まり、上限を超える部分は確かめることができません。
              </li>
            )}
            {featured.note && <li>・{featured.label}: {featured.note}</li>}
            {featured.lowRatio && (
              <li>
                ・この表は平均fpsです。{featured.label} の 1% Low（カクつき）は
                平均の {Math.round(featured.lowRatio.min * 100)}〜
                {Math.round(featured.lowRatio.max * 100)}% でした。
                構成ごとの値は
                <Link href="/tools/fps" className="text-accent underline">
                  ゲーム別fps予想ツール
                </Link>
                で出せます。
              </li>
            )}
            <li>
              ・解像度の下げ方や設定の効き方はゲームごとに違います。
              {game.name} では、画質を「{heaviest.label}」から「{lightest.label}」に
              下げると約 {(lightest.factor / heaviest.factor).toFixed(1)} 倍になります。
            </li>
          </ul>
        </section>

        {RESOLUTIONS.length > 0 && (
          <section className="mt-8 border-t border-rule-soft pt-5">
            <p className="text-sm text-dim">
              自分の構成で調べるなら
              <Link href="/tools/fps" className="text-accent underline">
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
 * 表の1セル分のfps。ゲーム側の上限で止まっているときだけ、
 * 上限が無い場合の計算上の値を小さく添える（どの構成も同じ数字に見えるのを避けるため）。
 */
function FpsWithTheory({ entry }: { entry: { fps: number; uncapped: number } }) {
  return (
    <>
      {entry.fps.toFixed(0)}
      {entry.fps < entry.uncapped && (
        <span className="ml-1.5 text-[10px] text-dim">理論 {entry.uncapped.toFixed(0)}</span>
      )}
    </>
  );
}
