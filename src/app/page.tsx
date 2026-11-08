import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolIcon } from '@/components/ToolIcon';
import { Wordmark } from '@/components/Wordmark';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card, ToolCard } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { visiblePosts } from '@/content/blog';
import { findCategory } from '@/content/blog/categories';
import { CHANGELOG } from '@/lib/changelog';
import { cpus, gpus } from '@/lib/data';
import { tally } from '@/lib/data/summary';
import { TIERS, solveBuild } from '@/lib/fps/build';
import { GAMES, findGame, supportedGameNames } from '@/lib/fps/games';
import { RESOLUTIONS, predict } from '@/lib/fps/model';
import { OFFICIAL_REQUIREMENTS } from '@/lib/fps/official-requirements';
import { TOOLS } from '@/lib/nav';
import { SITE } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: `${SITE.name}｜ゲーム別fps予想とゲーミングPCスペック比較`,
  description:
    `GPUとCPUを選ぶと、${supportedGameNames('・')} で何fps出るかとボトルネックが分かります。GPU 78モデル・CPU 42モデルのスペックと性能指数も掲載。実測を基準にした推定値です。`,
  path: '/',
  absoluteTitle: true,
});

/*
 * ホーム（2026-11-09 の全面再設計 段階2。ユーザーの依頼の8つの節）。
 *   1. ヒーロー  2. ゲームから探す  3. FPS予想  4. 必要スペック診断  5. GPU・CPUデータベース
 *   6. PC選びのガイド  7. 算出方法とデータの信頼性  8. 更新情報
 *
 * **数字は直書きしない。** fps は predict()・solveBuild() で、件数は tally で、記事と更新情報はそれぞれのデータから出す
 * （係数やデータを直しても、ホームの値が古いまま残らないように）。fps には必ず「推定」の札を付ける。
 *
 * 実測と推定を混同させない（ユーザーの指示）: 自前の実測があるのは RX 9070 XT＋Ryzen 7 9800X3D の1台だけ。
 * ホームの計算例はその構成を使うが、表示する数字は計算式による推定で、実測値そのものではないと書く。
 *
 * 価格のデータは持っていないので、価格・コスパには触れない。ゲームのロゴや画像は利用条件を確かめていないので使わない。
 */

/** FPS予想の計算例に使う構成（当サイトが実測した唯一の構成） */
const SAMPLE_GPU = 'Radeon RX 9070 XT';
const SAMPLE_CPU = 'Ryzen 7 9800X3D';

/** 必要スペック診断の計算例。ブログの中心の例（フォートナイトを Performance モードで 240fps）と同じ条件 */
const BUILD_SAMPLE = { gameId: 'fortnite', presetId: 'performance', resolution: '1080p', targetFps: 240 } as const;

function findSample() {
  const gpu = gpus.find((g) => g.name === SAMPLE_GPU);
  const cpu = cpus.find((c) => c.name === SAMPLE_CPU);
  const valorant = GAMES.find((g) => g.id === 'valorant');
  const preset = valorant?.presets.find((p) => p.id === 'high');
  if (!gpu || !cpu || !valorant || !preset) {
    throw new Error('ホームの例に使うGPU・CPU・ゲームがデータに見つかりません（src/app/page.tsx）');
  }
  return { gpu, cpu, game: valorant, preset };
}

/** FPS予想の計算例（VALORANT 1440p 全て高）。ツールと同じ predict() で出す */
function fpsExample() {
  const { gpu, cpu, game, preset } = findSample();
  const p = predict({
    gpuFps4kHigh: gpu.fpsValorant4kHigh,
    cpuCeiling: cpu.fpsValorantCeiling,
    resolution: '1440p',
    game,
    preset,
  });
  return { gpu, cpu, game, preset, p };
}

/** 必要スペック診断の計算例。ツールと同じ solveBuild() で、新品で買える世代から選ぶ（ツールの既定と同じ） */
function buildExample() {
  const tiers = solveBuild({
    req: { ...BUILD_SAMPLE, gpuVendor: null, cpuVendor: null, currentGenOnly: true },
    gpus,
    cpus,
  });
  const first = tiers?.[0];
  if (!first || first.gpu.kind !== 'ok' || first.cpu.kind !== 'ok') {
    throw new Error('ホームの必要スペック診断の例が計算できません（src/app/page.tsx の BUILD_SAMPLE）');
  }
  const game = findGame(BUILD_SAMPLE.gameId);
  const preset = game.presets.find((p) => p.id === BUILD_SAMPLE.presetId)!;
  return {
    game,
    preset,
    resolution: RESOLUTIONS.find((r) => r.id === BUILD_SAMPLE.resolution)!,
    gpu: first.gpu.candidates[0],
    cpu: first.cpu.candidates[0],
    summary: TIERS[0].summary,
  };
}

const round = (n: number) => Math.round(n).toLocaleString('ja-JP');

/**
 * ヒーローの背景写真（2026-09-30。ユーザーが生成した画像。元は assets/hero-source.png）。
 *
 * 配信用の画像は scripts/make-hero.mjs（npm run hero）で作った WebP。
 * スマホは主題（モニターと PC）の周りを切り抜いた幅960、PC は幅1920を出し分ける。
 *
 * スマホでは写真を文字の後ろに敷かず、画面の上部に帯（高さ300px）として置き、下へ背景の紺に溶かす。
 * 文字はその下の、ほぼ無地の紺の上に来る。写真を文字の後ろ全面に敷いていたときは、
 * モニターの光が文字に重なって「透けすぎて見にくい」と指摘された（2026-09-30）。
 * PC は文字のある左側に紺のグラデーションを重ねて、読みやすさを保つ。
 * 飾りの画像なので alt は空にし、読み上げから外している。画像が読めなくても紺の地で成り立つ。
 *
 * PC 幅では、写真の高さをヒーローいっぱいにはせず「幅いっぱい・高さは最低でもヒーローの70%」にして、
 * 下へ向かって背景に溶かしている。高さいっぱいに広げると横が大きく切られ、写真の左端（観葉植物やソファ）が
 * 見えなくなっていたため（2026-09-30 ユーザーの指摘）。
 *
 * next/image ではなく <picture> を直接書いている。静的書き出しでは画像の自動変換が使えず、
 * 画面幅で別の切り抜きを出し分ける（アートディレクション）ためにも <picture> の方が素直なため。
 */
function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-paper">
      <picture>
        <source media="(max-width: 767px)" type="image/webp" srcSet="/hero/hero-960.webp" />
        <img
          src="/hero/hero-1920.webp"
          alt=""
          width={1920}
          height={641}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-x-0 top-0 h-[300px] w-full object-cover object-[55%_45%]
                     [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)]
                     md:h-auto md:min-h-[70%] md:object-right
                     md:[mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
        />
      </picture>
      {/*
        PC は文字のある左側だけを暗くする。左端は真っ黒にせず、写真（観葉植物やソファ）がうっすら残る濃さにしている
        （2026-09-30 ユーザーの要望）。スマホは写真を文字の後ろに置かない（上部の帯にして下へ溶かす）ので重ねない
      */}
      <div className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-paper/80 md:via-paper/60 md:via-40% md:to-transparent md:to-65%" />
      {/* 下端を背景の紺に溶かし、次の節との境目をなじませる */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-paper to-transparent" />
    </div>
  );
}

export default function Home() {
  const fx = fpsExample();
  const bx = buildExample();
  const supported = GAMES.filter((g) => g.supported);
  const posts = visiblePosts().slice(0, 6);
  const updates = CHANGELOG.slice(0, 3);

  return (
    <main className="pb-6">
      {/* 1. ヒーロー。写真は前のホームと同じもの（新しい画像は足さない） */}
      <section className="relative isolate border-b border-frame">
        <HeroBackdrop />
        {/* スマホは写真の帯（上300px）が見えるよう、文字を帯の溶けたあたりから始める */}
        <div className="mx-auto max-w-[1240px] px-5 pt-[210px] pb-12 md:pt-16 md:pb-20">
          <div className="max-w-[46rem] [text-shadow:0_2px_14px_rgba(7,13,24,0.9)]">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-lg leading-none font-extrabold tracking-[var(--display-tracking)] uppercase">
                <Wordmark />
              </span>
              <span className="font-cond text-xs font-bold tracking-[0.2em] text-dim">{SITE.name}</span>
            </p>
            {/*
              キャッチコピー（ユーザーの指定）。読点で必ず2行に分ける。幅に任せると、見出しの日本語フォントが
              読み込まれた時点で字幅が変わって折り返しがずれ、下の中身が押し下げられる（CLS。2026-09-27 の SEO監査）。
              2行目（11文字）がスマホ幅（本文の幅 約350px）でも1行に収まる大きさにしてある
            */}
            <h1 className="mt-5 font-cond text-[clamp(1.55rem,7.4vw,3.6rem)] leading-[1.25] font-bold whitespace-nowrap">
              <span className="block">あなたのゲームに、</span>
              <span className="block text-accent">本当に必要なPC性能を。</span>
            </h1>
            <p className="mt-5 max-w-[46ch] text-dim sm:text-lg">
              GPU・CPUの性能データとゲーム別のFPS予測から、最適なPC選びをサポートします。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={TOOLS.fps.href}>FPS予想を始める</ButtonLink>
              <ButtonLink href={TOOLS.build.href} variant="secondary">
                必要スペックを調べる
              </ButtonLink>
            </div>
            <p className="mt-5 text-xs text-dim">
              {`数値は当サイトの計算による推定です（誤差 ±15〜20%）。対応ゲーム: ${supportedGameNames('・')}`}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5">
        {/* 2. ゲームから探す。カードの中身は、ゲームのデータと公式の動作環境のデータから出す（ロゴ・画像は使わない） */}
        <section className="mt-14">
          <SectionTitle
            eyebrow="GAMES"
            title="ゲームから探す"
            lead="遊ぶゲームを選ぶと、目標fpsに必要なGPU・CPUと、GPU別・CPU別の推定fpsが分かります。"
          />
          <ul className="grid gap-3 md:grid-cols-3">
            {supported.map((g) => {
              const featured = g.presets.find((p) => p.id === g.featuredPresetId);
              const official = OFFICIAL_REQUIREMENTS[g.id];
              return (
                <li key={g.id}>
                  <ToolCard
                    href={`/games/${g.id}`}
                    eyebrow="GAME"
                    title={g.name}
                    description={`GPU ${tally.gpuCount}モデル・CPU ${tally.cpuCount}モデルの推定fpsと、目標fpsに届く最小のGPU`}
                    meta={
                      <dl className="grid gap-1.5">
                        <GameFact label="公式の動作環境">
                          {official ? (
                            <>
                              <Badge tone="official">公式</Badge> 必要・推奨を掲載
                            </>
                          ) : (
                            '確認中（未掲載）'
                          )}
                        </GameFact>
                        <GameFact label="fps上限">
                          {g.cap !== null ? `ゲーム側で ${g.cap} fps まで` : 'ゲーム側の上限なし'}
                        </GameFact>
                        {featured && <GameFact label="基準の画質">{featured.label}</GameFact>}
                      </dl>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* 3. FPS予想の紹介。計算例は当サイトが実測した構成だが、出す数字は推定（実測値そのものではない） */}
        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <SectionTitle
              eyebrow="FPS PREDICTOR"
              title="GPUとCPUを選ぶだけで、ゲームごとの推定fps"
              lead={
                <>
                  ゲーム・解像度・画質を選ぶと、平均fpsと1% Low（カクつきの目安）、どちらが性能の上限を決めているか（ボトルネック）が分かります。計算はすべてブラウザの中で行います。
                </>
              }
            />
            <ButtonLink href={TOOLS.fps.href}>FPS予想を始める</ButtonLink>
          </div>
          <Card className="md:p-6">
            <p className="flex flex-wrap items-center gap-2 text-xs text-dim">
              <Badge tone="estimate">推定</Badge>
              <span>計算例</span>
              <span className="font-mono">
                {fx.game.name} / 1440p / {fx.preset.label}
              </span>
            </p>
            <p className="mt-2 text-sm">
              {fx.gpu.name} ＋ {fx.cpu.name}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-y border-rule py-4">
              <div>
                <p className="text-xs text-dim">推定平均fps</p>
                <p className="mt-1 font-mono text-4xl font-semibold text-cyan tabular-nums">{round(fx.p.uncapped)}</p>
              </div>
              {fx.p.fps1Low && (
                <div>
                  <p className="text-xs text-dim">推定1% Low</p>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
                    {round(fx.p.fps1Low.min)}〜{round(fx.p.fps1Low.max)}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              {`この数字は計算式による推定で、誤差は ±15〜20% です。${fx.gpu.name} ＋ ${fx.cpu.name} は当サイトが自前で実測した唯一の構成で、計算式の基準になっています。ここに出している値は、その実測値そのものではありません。`}
            </p>
            <p className="mt-3 text-sm">
              <Link
                href={`${TOOLS.fps.href}?game=${fx.game.id}&gpu=${fx.gpu.slug}&cpu=${fx.cpu.slug}`}
                className="text-accent underline"
              >
                この構成で FPS予想を開く
              </Link>
            </p>
          </Card>
        </section>

        {/* 4. 必要スペック診断の紹介。solveBuild() の結果をそのまま出す（価格は扱わない） */}
        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <SectionTitle
              eyebrow="REQUIRED SPEC"
              title="目標fpsから、必要なGPUとCPUを逆算"
              lead="ゲーム・解像度・画質・出したいfpsを選ぶと、それを満たすGPUとCPUを、性能の低い順に候補として出します。価格は見ていません（価格のデータを持っていないため）。"
            />
            <ButtonLink href={TOOLS.build.href}>必要スペックを調べる</ButtonLink>
          </div>
          <Card className="md:p-6">
            <p className="flex flex-wrap items-center gap-2 text-xs text-dim">
              <Badge tone="estimate">推定</Badge>
              <span>計算例</span>
              <span className="font-mono">
                {bx.game.name} / {bx.resolution.label} / {bx.preset.label} / 目標 {BUILD_SAMPLE.targetFps} fps
              </span>
            </p>
            <dl className="mt-4 grid gap-3 border-y border-rule py-4">
              {[
                { side: 'GPU', name: bx.gpu.model.name, href: `/gpu/${bx.gpu.model.slug}`, fps: bx.gpu.fps },
                { side: 'CPU', name: bx.cpu.model.name, href: `/cpu/${bx.cpu.model.slug}`, fps: bx.cpu.fps },
              ].map((r) => (
                <div key={r.side} className="grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-x-3">
                  <dt className="font-mono text-xs font-semibold text-dim">{r.side}</dt>
                  <dd className="min-w-0">
                    <Link href={r.href} className="font-cond text-lg font-bold hover:text-accent">
                      {r.name}
                    </Link>
                    <span className="ml-2 text-xs text-dim">
                      {r.side}側の上限 <span className="font-mono text-cyan">{round(r.fps)}</span> fps（推定）
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              {`${bx.summary}の、それぞれ最も性能の低い候補です（新品で買える世代から。誤差 ±15〜20%）。ツールでは、2割の余裕を見た構成と、1% Low まで目標を保てる構成も出します。`}
            </p>
            <p className="mt-3 text-sm">
              <Link
                href={`${TOOLS.build.href}?game=${BUILD_SAMPLE.gameId}&res=${BUILD_SAMPLE.resolution}&preset=${BUILD_SAMPLE.presetId}&fps=${BUILD_SAMPLE.targetFps}`}
                className="text-accent underline"
              >
                この条件で必要スペックを調べる
              </Link>
            </p>
          </Card>
        </section>

        {/* 5. GPU・CPUデータベース。件数は登録データから数える */}
        <section className="mt-16">
          <SectionTitle
            eyebrow="DATABASE"
            title="GPU・CPUのスペックと性能指数"
            lead="モデル名で検索・メーカーで絞り込み・列で並べ替えができ、最大3モデルを比べられます。スペックはメーカー公式の資料と照合し、クロックはリファレンス仕様値に統一しています。"
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { href: '/gpu', title: 'GPUスペック一覧', count: tally.gpuCount, note: 'GeForce GTX 10〜RTX 50 / Radeon RX 5000〜RX 9000' },
              { href: '/cpu', title: 'CPUスペック一覧', count: tally.cpuCount, note: 'Ryzen 5000〜9000 / Intel 第10〜14世代・Core Ultra 200S' },
            ].map((d) => (
              <li key={d.href}>
                <ToolCard
                  href={d.href}
                  title={d.title}
                  icon={<ToolIcon href={d.href} className="size-5" />}
                  description={d.note}
                  meta={
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-semibold text-ink tabular-nums">{d.count}</span>
                      モデルを掲載
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        {/* 6. PC選びのガイド（ブログ）。公開済みの記事だけ（開発中は下書きも見える）。記事が無ければ節ごと出さない */}
        {posts.length > 0 && (
          <section className="mt-16">
            <SectionTitle
              eyebrow="GUIDE"
              title="PC選びのガイド"
              lead="ゲームと目標fpsからPCを選ぶための解説です。記事の中の fps も、ツールと同じ計算による推定です。"
            />
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(({ meta: m }) => (
                <li key={m.slug}>
                  <ToolCard
                    href={`/blog/${m.slug}`}
                    eyebrow={findCategory(m.category)?.label}
                    title={m.title}
                    meta={<time dateTime={m.updatedAt}>更新 {m.updatedAt}</time>}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              <Link href="/blog" className="text-accent underline">
                ガイドの記事をすべて見る
              </Link>
            </p>
          </section>
        )}

        {/* 7. 算出方法とデータの信頼性。実測（1構成だけ）と推定と公式情報を分けて書く */}
        <section className="mt-16">
          <SectionTitle
            eyebrow="METHOD"
            title="算出方法とデータの信頼性"
            lead="このサイトの数字は、出どころが3種類あります。どれなのかを、ページの中で札と文で分けて示しています。"
          />
          <ul className="grid gap-3 md:grid-cols-3">
            <li>
              <Card className="h-full">
                <Badge tone="measured">実測</Badge>
                <p className="mt-3 font-cond text-base font-bold">自前の実測は1構成だけ</p>
                <p className="mt-2 text-sm leading-relaxed text-dim">
                  {`${SAMPLE_GPU} ＋ ${SAMPLE_CPU} の1台を、VALORANT で実測しました。これが計算式の基準点です。ほかのGPU・CPUを実測したことはありません。`}
                </p>
              </Card>
            </li>
            <li>
              <Card className="h-full">
                <Badge tone="estimate">推定</Badge>
                <p className="mt-3 font-cond text-base font-bold">fpsと性能指数は計算による推定</p>
                <p className="mt-2 text-sm leading-relaxed text-dim">
                  モデルごとの性能はメーカー公式スペックから計算し、ゲームごとの係数は自前の実測と、許諾を得た第三者の測定から求めています。誤差は ±15〜20% です。他社のfps数値表は転載していません。
                </p>
              </Card>
            </li>
            <li>
              <Card className="h-full">
                <Badge tone="official">公式</Badge>
                <p className="mt-3 font-cond text-base font-bold">スペックと動作環境は公式の記載</p>
                <p className="mt-2 text-sm leading-relaxed text-dim">
                  GPU・CPUのスペックはメーカー公式の資料と照合した値です。ゲームの必要・推奨動作環境は、ゲーム会社の公式ページの記載をそのまま、確認日と出典を添えて載せています。
                </p>
              </Card>
            </li>
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/methodology" className="text-accent underline">
              算出方法を詳しく見る
            </Link>
            <Link href="/about" className="text-accent underline">
              運営者と実測環境
            </Link>
            <Link href="/contact" className="text-accent underline">
              実測データの提供・お問い合わせ
            </Link>
          </p>
        </section>

        {/* 8. 更新情報。更新履歴（changelog.ts）の新しい3件 */}
        <section className="mt-16">
          <SectionTitle eyebrow="UPDATES" title="更新情報" />
          <ol className="divide-y divide-rule border-y border-rule">
            {updates.map((u) => (
              <li key={`${u.date}-${u.title}`} className="grid gap-1 py-3.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
                <time dateTime={u.date} className="font-mono text-xs text-dim sm:pt-0.5">
                  {u.date}
                </time>
                <p className="font-cond text-base font-bold">{u.title}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/changelog" className="text-accent underline">
              更新履歴をすべて見る
            </Link>
            {/* 感度換算はメニューでは一段下げたが、ホームからもたどれるように残す */}
            <Link href={TOOLS.sensitivity.href} className="text-accent underline">
              {`その他のツール: ${TOOLS.sensitivity.short}（${TOOLS.sensitivity.long}）`}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

/** ゲームのカードの中の1行（項目名と値） */
function GameFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
      <dt className="text-dim">{label}</dt>
      <dd className="flex flex-wrap items-center gap-1.5 text-ink">{children}</dd>
    </div>
  );
}
