import type { Metadata } from 'next';
import Link from 'next/link';
import { ToolIcon } from '@/components/ToolIcon';
import { Wordmark } from '@/components/Wordmark';
import { siteLastUpdated } from '@/lib/changelog';
import { cpus, gpus } from '@/lib/data';
import { tally } from '@/lib/data/summary';
import { GAMES, supportedGameNames } from '@/lib/fps/games';
import { predict } from '@/lib/fps/model';
import { TOOL_ORDER, TOOLS } from '@/lib/nav';
import { cm360 } from '@/lib/sens/convert';
import { findSensGame } from '@/lib/sens/games';
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
 * ホーム（2026-09-27 に暗いデザインへ作り直し。ユーザーが示したイメージ画像がもと。
 * 画像にある人気ゲーム欄・おすすめPC・コラムなど、まだ無い機能は作らない）。
 *
 * **「ベンチマークサイト」を押し出さない。** 将来、別の機能やプロゲーマーの使用デバイスの
 * 記事・まとめも載せるため（ユーザーの方針）。キャッチコピーも PC とデバイスの両方を指す言い方にしてある。
 *
 * セクションを縦に並べる作りにしてあり、記事ができたら <Section label="ARTICLES"> を1つ足せば済む。
 * **中身の無い「準備中」の欄は出さない**（ユーザーの方針）。
 */

const SAMPLE_GPU = 'Radeon RX 9070 XT';
const SAMPLE_CPU = 'Ryzen 7 9800X3D';

/**
 * ツールの表の「例」欄。数字は直書きせず、実際の計算で出す
 * （係数やデータを直しても、ホームの例が古い値のまま残らないように）。
 */
function toolExamples(): Record<string, { value: string; cond: string }> {
  const gpu = gpus.find((g) => g.name === SAMPLE_GPU);
  const cpu = cpus.find((c) => c.name === SAMPLE_CPU);
  const valorant = GAMES.find((g) => g.id === 'valorant');
  const preset = valorant?.presets.find((p) => p.id === 'high');
  if (!gpu || !cpu || !valorant || !preset) {
    throw new Error('ホームの例に使うGPU・CPU・ゲームがデータに見つかりません（src/app/page.tsx）');
  }
  const fps = predict({
    gpuFps4kHigh: gpu.fpsValorant4kHigh,
    cpuCeiling: cpu.fpsValorantCeiling,
    resolution: '1440p',
    game: valorant,
    preset,
  }).uncapped;

  const sensGame = findSensGame('valorant');
  const cm = cm360({ yaw: sensGame.yaw, sens: 0.4, dpi: 800 });

  return {
    [TOOLS.fps.href]: { value: `${Math.round(fps)} fps`, cond: `RX 9070 XT + 9800X3D / VALORANT 1440p・${preset.label}` },
    [TOOLS.build.href]: { value: '目標fps → GPU・CPU', cond: 'コスパ・余裕・安定の3段階' },
    [TOOLS.sensitivity.href]: { value: `${cm.toFixed(1)} cm/360`, cond: 'VALORANT 感度0.4 / 800 DPI' },
    [TOOLS.games.href]: {
      value: `${GAMES.filter((g) => g.supported).length} タイトル`,
      cond: supportedGameNames(' / '),
    },
  };
}

/**
 * 「押すと飛べる」ことを示す丸い札（イメージ画像のカード右端の「›」）。
 *
 * 親（行やカード）に group/go を付けておくと、マウスを乗せたとき・押しているときに
 * 青に塗られ、矢印が右へ少し動く。動きを減らす設定の人には動かさない。
 * label を渡すと「開く ›」のような横長の札になる。
 */
function GoMark({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-frame font-mono text-sm whitespace-nowrap text-accent
                  group-hover/go:border-accent-vivid group-hover/go:bg-accent-vivid group-hover/go:text-on-accent
                  group-active/go:border-accent-vivid group-active/go:bg-accent-vivid group-active/go:text-on-accent
                  ${label ? 'px-3 py-1 text-xs font-semibold' : 'size-8'} ${className}`}
    >
      {label && <span>{label}</span>}
      <span className="transition-transform group-hover/go:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/go:translate-x-0">
        ›
      </span>
    </span>
  );
}

/** 見出しと、右に件数などの事実を置く枠（イメージ画像の「全てのツール」の枠） */
function Section({
  label,
  title,
  meta,
  children,
}: {
  label: string;
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    // スマホは外枠（枠線と内側の余白）を外して上に線だけを引き、中のカードに画面幅を使わせる（2026-09-30）
    <section className="mt-12 border-t border-frame pt-5 md:mt-10 md:rounded-2xl md:border md:bg-panel/50 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent">{label}</span>
          <h2 className="font-cond text-xl font-bold">{title}</h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.12em] text-dim">{meta}</p>
      </div>
      {children}
    </section>
  );
}

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
  const examples = toolExamples();
  const supported = GAMES.filter((g) => g.supported);

  // ヒーローの下の入口（イメージ画像の4枚のカード）。今ある機能だけを並べる
  const entries = [
    { href: TOOLS.fps.href, title: TOOLS.fps.short, sub: TOOLS.fps.long },
    { href: TOOLS.build.href, title: TOOLS.build.short, sub: TOOLS.build.long },
    { href: TOOLS.sensitivity.href, title: TOOLS.sensitivity.short, sub: TOOLS.sensitivity.long },
    { href: '/gpu', title: 'GPU・CPU比較', sub: `GPU ${tally.gpuCount}・CPU ${tally.cpuCount}モデルのスペック` },
  ];

  const facts = [
    { label: '収録', value: `GPU ${tally.gpuCount}・CPU ${tally.cpuCount}` },
    { label: '対応ゲーム', value: supportedGameNames(' / ') },
    { label: '確認', value: `ソース確認済み ${tally.verifiedCount}` },
    { label: '誤差', value: '推定 ±15〜20%' },
  ];

  return (
    <main className="pb-6">
      {/*
        ヒーロー（2026-09-27 の暗いデザインへの作り直し）。横いっぱいの背景の上に、左寄せで文字を置く。
        h1 の中身は今まで通り英語名と日本語名の両方（どちらで検索されても拾えるように）。
        大きく見せるのはキャッチコピーの方で、h1 はロゴとして一段小さく出す（見た目だけの変更）。
      */}
      <section className="relative isolate border-b border-frame">
        <HeroBackdrop />
        {/* スマホは写真の帯（上300px）が見えるよう、文字を帯の溶けたあたりから始める */}
        <div className="mx-auto max-w-[1240px] px-5 pt-[210px] pb-10 md:pt-12 md:pb-14">
          {/* 上端の帯。飾りの数字は置かず、事実だけを並べる */}
          {/* スマホでは1行に収まる項目だけを見せる。隠す3つ（サイト名・タイトル数・誤差）は、すぐ下のロゴと収録数の帯に同じ事実がある */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-dim sm:gap-x-4">
            <span aria-hidden className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            <span className="max-sm:hidden">PC ANCHOR</span>
            <span>GPU {tally.gpuCount} / CPU {tally.cpuCount}</span>
            <span className="max-sm:hidden">{supported.length} TITLES</span>
            <span className="max-sm:hidden">推定・誤差 ±15〜20%</span>
            {/* 最終更新日。他のページはパンくずの横に出している（日付は更新履歴から） */}
            <Link href="/changelog" className="hover:text-accent">
              UPDATED <time dateTime={siteLastUpdated()}>{siteLastUpdated()}</time>
            </Link>
          </div>

          {/*
            写真を明るくした（2026-09-30）ぶん、文字の後ろにだけ紺の影を落として読みやすさを保つ。
            グラデーションの文字（text-gradient）は文字の中が透明なので、text-shadow だと影が透けて濁る。
            そちらは影の付け方を drop-shadow（形に沿った影）に替えている
          */}
          <div className="mt-8 max-w-[52rem] [text-shadow:0_2px_14px_rgba(7,13,24,0.9)] md:mt-14">
            <p className="mb-4 font-mono text-[12px] font-semibold tracking-[0.22em] text-signal">
              GAMING PC &amp; GEAR DATA
            </p>
            <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-display text-[clamp(1.6rem,4.5vw,2.4rem)] leading-none font-extrabold tracking-[var(--display-tracking)] uppercase">
                <Wordmark />
              </span>
              <span className="font-cond text-sm font-bold tracking-[0.2em] text-dim sm:text-base">{SITE.name}</span>
            </h1>
            {/* 1行目（14文字）がスマホ幅（本文の幅 約350px）でも1行に収まる大きさ。6.2vw ≒ 24px（390px幅） */}
            <p className="mt-5 font-cond text-[clamp(1.2rem,6.2vw,3.4rem)] leading-[1.2] font-bold whitespace-nowrap">
              {/*
                読点で必ず2行に分ける。以前は1行に収まるかを幅に任せていたが、見出しの日本語フォントが
                読み込まれると字幅が変わって「数字で選ぶ。」だけが2行目に落ち、下の中身が押し下げられていた
                （スマホで画面のズレ CLS 0.15。2026-09-27 の SEO監査）。
              */}
              <span className="block">ゲーミングPCとデバイスを、</span>
              <span className="text-gradient block drop-shadow-[0_2px_10px_rgba(7,13,24,0.95)] [text-shadow:none]">数字で選ぶ。</span>
            </p>
            {/* 日本語の文を JSX で改行すると継ぎ目に空白が入るので、1文ずつ1行に書く */}
            <p className="mt-5 max-w-[58ch] text-dim">
              {'fps予想などのツールと、GPU・CPUのスペックデータベースを置いています。'}
              {'モデル別の性能はメーカー公式スペックから自前で計算し、ゲーム別の係数は自前の実測と、許諾を得た第三者の測定から算出しています。'}
              {'他社のfps数値表の転載はしていません。'}
            </p>
          </div>

          {/* 入口のカード。スマホは2列の縦型（アイコンの下に名前。名前が折れないように）、PC は4列の横型 */}
          <ul className="mt-8 grid grid-cols-2 gap-3 md:mt-10 lg:grid-cols-4">
            {entries.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="group/go flex h-full flex-col items-start gap-3 rounded-xl border border-frame bg-panel/80 p-4 backdrop-blur-sm hover:border-accent hover:shadow-glow active:border-accent sm:flex-row sm:items-center"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-frame bg-raise text-accent sm:size-12">
                    <ToolIcon href={e.href} className="size-5 sm:size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-cond text-base font-bold whitespace-nowrap group-hover/go:text-accent sm:text-lg">{e.title}</span>
                    <span className="hidden text-xs text-dim sm:block">{e.sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5">
        {/* 収録数などの事実。以前はヒーローの右の表（FactTable）だったものを、横並びの帯にした */}
        <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-frame bg-panel md:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="border-frame px-4 py-3 not-last:border-b md:not-last:border-r md:not-last:border-b-0 max-md:odd:border-r">
              <dt className="font-mono text-[10px] font-semibold tracking-[0.1em] text-dim uppercase">{f.label}</dt>
              <dd className="mt-0.5 font-cond text-sm font-bold tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>

        <Section label="TOOLS" title="ツール" meta={`${TOOL_ORDER.length} ITEMS`}>
          {/*
            イメージ画像の「全てのツール」のように、アイコン付きのカードを2列に並べる。
            カードのどこを押しても飛べる（カード全体がリンク）。右端の丸い札で押せることを示す。
          */}
          <ul className="grid gap-3 md:grid-cols-2">
            {TOOL_ORDER.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="group/go relative flex h-full items-center gap-4 rounded-xl border border-frame bg-panel p-4 hover:border-accent hover:shadow-glow active:border-accent"
                >
                  {/* PC はアイコンを左に。スマホは名前の行の中に小さく置き、説明に画面幅を使わせる */}
                  <span className="hidden size-12 shrink-0 place-items-center rounded-full border border-frame bg-raise text-accent md:grid">
                    <ToolIcon href={t.href} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-3 pr-10 md:pr-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-frame bg-raise text-accent md:hidden">
                        <ToolIcon href={t.href} className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-cond text-xl font-bold group-hover/go:text-accent">{t.short}</span>
                        <span className="block font-cond text-xs font-bold text-dim">{t.long}</span>
                      </span>
                    </span>
                    <span className="mt-3 grid gap-x-4 gap-y-1 border-t border-rule-soft pt-3 text-xs text-dim sm:grid-cols-2 md:mt-2 md:border-t-0 md:pt-0">
                      <span>
                        <span className="mr-1.5 font-mono text-[10px] tracking-[0.1em]">入力</span>
                        {t.input}
                      </span>
                      <span>
                        <span className="mr-1.5 font-mono text-[10px] tracking-[0.1em]">出力</span>
                        {t.output}
                      </span>
                    </span>
                    <span className="mt-2 block">
                      <span className="font-mono text-sm font-semibold whitespace-nowrap text-accent">
                        {examples[t.href]?.value}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-dim sm:mt-0 sm:ml-2 sm:inline">{examples[t.href]?.cond}</span>
                    </span>
                  </span>
                  <GoMark className="absolute top-4 right-4 md:static" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section label="DATABASE" title="スペックデータベース" meta={`${tally.gpuCount + tally.cpuCount} MODELS`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: '/gpu',
                title: 'GPUスペック一覧',
                count: tally.gpuCount,
                note: 'GeForce GTX 10〜RTX 50 / Radeon RX 5000〜RX 9000',
              },
              {
                href: '/cpu',
                title: 'CPUスペック一覧',
                count: tally.cpuCount,
                note: 'Ryzen 5000〜9000 / Intel 第10〜14世代・Core Ultra 200S',
              },
            ].map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group/go relative flex flex-col items-start gap-3 rounded-xl border border-frame bg-panel p-5 hover:border-accent hover:shadow-glow active:border-accent sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                {/* スマホは件数を名前の下に置き、名前（GPUスペック一覧）が折れないようにする */}
                <span className="min-w-0 pr-10 sm:pr-0">
                  <span className="block font-cond text-xl font-bold group-hover/go:text-accent">{d.title}</span>
                  <span className="mt-1 block text-sm text-dim">{d.note}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-4xl font-semibold tabular-nums">
                    {d.count}
                    <span className="ml-1 text-xs font-normal text-dim">モデル</span>
                  </span>
                  <GoMark className="absolute top-5 right-5 sm:static" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section label="GAMES" title="ゲーム別の推奨GPU" meta={`${supported.length} TITLES`}>
          <div className="grid gap-3 sm:grid-cols-3">
            {supported.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="group/go flex items-center justify-between gap-3 rounded-xl border border-frame bg-panel p-5 hover:border-accent hover:shadow-glow"
              >
                <span className="min-w-0">
                  <span className="block font-cond text-xl font-bold group-hover/go:text-accent">{g.name}</span>
                  <span className="mt-1 block text-sm text-dim">GPU {tally.gpuCount}モデルそれぞれの推定fps</span>
                </span>
                <GoMark />
              </Link>
            ))}
          </div>
        </Section>

        {/* 記事・まとめができたら、ここに <Section label="ARTICLES" …> を足す */}

        <Section label="NOTE" title="数値の扱いについて" meta="推定値">
          <div className="max-w-[68ch] space-y-2 border-l-2 border-accent pl-4 text-sm text-dim">
            <p>
              {'掲載している性能指数と推定fpsは、誤差 ±15〜20% の推定値です。'}
              {'実測は1構成のみで、他のモデルはそこからの外挿になります。'}
              {'根拠が足りない値は出しません。終盤の高負荷時のfpsは、実測データが無いため公開していません。'}
              {'1% Low（カクつき）は実測から求めた比で出しています。'}
            </p>
            <p>
              {'精度は実測データの量で決まります。訪問者から実測を集める仕組みを準備中ですが、それまでは'}
              <Link href="/contact" className="text-accent underline">
                お問い合わせ
              </Link>
              {'から送っていただけます（必要な項目もそこに書いてあります）。'}
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}
