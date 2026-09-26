import type { Metadata } from 'next';
import Link from 'next/link';
import { FactTable } from '@/components/PageHeader';
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
 * ホーム（2026-09-22 に作り直し。部品メーカーの技術資料がモチーフ）。
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
 * 「押すと飛べる」ことを示す札。技術資料の型番の札のような角ばった形で、墨の地に紙色の文字。
 *
 * 親（行やカード）に group/go を付けておくと、マウスを乗せたとき・押しているときに
 * 信号オレンジに変わり、矢印が右へ少し動く。動きを減らす設定の人には動かさない。
 * label を省くと矢印だけの四角になる（スマホのカードや、小さなカード用）。
 */
function GoMark({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap bg-ink font-mono text-xs font-semibold tracking-[0.12em] text-paper
                  group-hover/go:bg-accent-vivid group-hover/go:text-ink group-active/go:bg-accent-vivid group-active/go:text-ink
                  ${label ? 'px-3 py-1.5' : 'size-8'} ${className}`}
    >
      {label && <span>{label}</span>}
      <span className="transition-transform group-hover/go:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/go:translate-x-0">
        →
      </span>
    </span>
  );
}

/** セクションの見出し。英字の札と日本語の見出しを並べ、右に件数などの事実を置く */
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
    <section className="pt-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-[3px] border-ink pt-2.5">
        <div className="flex items-baseline gap-3">
          <span className="bg-accent-vivid px-1.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-ink">
            {label}
          </span>
          <h2 className="font-cond text-xl font-bold">{title}</h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.12em] text-dim">{meta}</p>
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const examples = toolExamples();
  const supported = GAMES.filter((g) => g.supported);

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-6">
      {/* 技術資料の上端の帯。飾りの数字は置かず、事実だけを並べる */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 bg-ink px-4 py-2 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-paper">
        <span aria-hidden className="size-2.5 bg-accent-vivid" />
        <span>PC ANCHOR</span>
        <span>GPU {tally.gpuCount} / CPU {tally.cpuCount}</span>
        <span>{supported.length} TITLES</span>
        <span>推定・誤差 ±15〜20%</span>
      </div>

      {/*
        和文と欧文を1行に混ぜると字幅も太さも揃わないため、欧文の社名を主役にして
        日本語名を下に添える構成にしている。飾りのある書体はこのロゴだけに使い、
        読ませる文章には使わない。
        h1 には英語名と日本語名の両方を入れてある（どちらで検索されても拾えるようにし、
        読み上げも「PC ANCHOR / PCアンカー」と自然につながる）。
      */}
      <header className="grid gap-8 pt-10 pb-4 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
        <div className="min-w-0">
          <p className="mb-5 font-mono text-[11px] font-semibold tracking-[0.18em] text-signal">
            GAMING PC &amp; GEAR DATA
          </p>
          <h1>
            <span className="block overflow-hidden font-display text-[clamp(2.6rem,11vw,7rem)] leading-[1.05] tracking-[var(--display-tracking)] uppercase">
              {SITE.nameEn}
            </span>
            <span className="mt-4 flex items-center gap-3">
              <span aria-hidden className="h-0.5 w-9 shrink-0 bg-accent-vivid" />
              <span className="font-cond text-base font-bold tracking-[0.2em] text-dim sm:text-lg">
                {SITE.name}
              </span>
            </span>
          </h1>
          <p className="mt-7 font-cond text-[clamp(1.5rem,3.6vw,2.25rem)] leading-snug font-bold text-balance">
            {/* 狭い画面でも「デバ／イス」のように単語の途中で切れないよう、読点で区切って折り返す */}
            <span className="inline-block">ゲーミングPCとデバイスを、</span>
            <span className="inline-block">数字で選ぶ。</span>
          </p>
          {/* 日本語の文を JSX で改行すると継ぎ目に空白が入るので、1文ずつ1行に書く */}
          <p className="mt-4 max-w-[58ch] text-dim">
            {'fps予想などのツールと、GPU・CPUのスペックデータベースを置いています。'}
            {'モデル別の性能はメーカー公式スペックから自前で計算し、ゲーム別の係数は自前の実測と、許諾を得た第三者の測定から算出しています。'}
            {'他社のfps数値表の転載はしていません。'}
          </p>
        </div>

        <FactTable
          facts={[
            { label: '収録', value: `GPU ${tally.gpuCount}・CPU ${tally.cpuCount}` },
            { label: '対応ゲーム', value: supportedGameNames(' / ') },
            { label: '確認', value: `ソース確認済み ${tally.verifiedCount}` },
            { label: '誤差', value: '推定 ±15〜20%' },
          ]}
        />
      </header>

      <Section label="TOOLS" title="ツール" meta={`${TOOL_ORDER.length} ITEMS`}>
        {/*
          PC幅は技術資料の表。スマホは同じ中身を縦のカードに組み替える。
          表は「読むもの」に見えて押せる感が無かったため（ユーザーの指摘）、
          行のどこを押しても飛べるようにし、右端に「開く →」の札を置いている。
          行全体を押せるのは、ツール名のリンクの ::after を行いっぱいに広げているから。
          キーボードではツール名のリンクにフォーカスが当たり、行全体に枠が出る。
        */}
        <table className="hidden w-full border-collapse border-2 border-ink bg-panel md:table">
          <thead>
            <tr className="border-b-2 border-ink bg-rule-soft text-left">
              {['ツール', '入力', '出力', '例'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-dim"
                >
                  {h}
                </th>
              ))}
              <th scope="col" className="w-px px-4 py-2">
                <span className="sr-only">開く</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {TOOL_ORDER.map((t) => (
              <tr
                key={t.href}
                className="group/go relative cursor-pointer border-b border-rule last:border-b-0 hover:bg-accent-soft
                           has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-accent"
              >
                <th scope="row" className="px-4 py-3.5 text-left align-top">
                  <Link
                    href={t.href}
                    className="block outline-none after:absolute after:inset-0 after:content-['']"
                  >
                    <span className="block font-cond text-2xl font-bold decoration-2 underline-offset-4 group-hover/go:text-accent group-hover/go:underline">
                      {t.short}
                    </span>
                    <span className="block font-cond text-xs font-bold text-dim">{t.long}</span>
                  </Link>
                </th>
                <td className="px-4 py-3.5 align-top text-sm">{t.input}</td>
                <td className="px-4 py-3.5 align-top text-sm">{t.output}</td>
                <td className="px-4 py-3.5 align-top">
                  <span className="block font-mono text-sm font-semibold whitespace-nowrap text-accent">
                    {examples[t.href]?.value}
                  </span>
                  <span className="block text-[11px] text-dim">{examples[t.href]?.cond}</span>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <GoMark label="開く" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="grid gap-2 md:hidden">
          {TOOL_ORDER.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="group/go flex items-center gap-3 border-2 border-ink bg-panel py-3 pr-3 pl-4 active:bg-accent-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-cond text-xl font-bold">{t.short}</span>
                  <span className="block text-xs text-dim">{t.note}</span>
                  <span className="mt-1 block font-mono text-xs font-semibold text-accent">
                    {examples[t.href]?.value}
                  </span>
                </span>
                <GoMark />
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
              className="group/go relative flex items-end justify-between gap-4 border-2 border-ink bg-panel p-5 pt-6 hover:bg-accent-soft active:bg-accent-soft"
            >
              <GoMark className="absolute top-0 right-0" />
              <span className="min-w-0">
                <span className="block font-cond text-xl font-bold decoration-2 underline-offset-4 group-hover/go:text-accent group-hover/go:underline">
                  {d.title}
                </span>
                <span className="mt-1 block text-sm text-dim">{d.note}</span>
              </span>
              <span className="shrink-0 font-mono text-4xl font-semibold tabular-nums">
                {d.count}
                <span className="ml-1 text-xs font-normal text-dim">モデル</span>
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
              className="group/go relative border-2 border-ink bg-panel p-5 pr-12 hover:bg-accent-soft active:bg-accent-soft"
            >
              <GoMark className="absolute top-0 right-0" />
              <span className="block font-cond text-xl font-bold decoration-2 underline-offset-4 group-hover/go:text-accent group-hover/go:underline">
                {g.name}
              </span>
              <span className="mt-1 block text-sm text-dim">
                GPU {tally.gpuCount}モデルそれぞれの推定fps
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* 記事・まとめができたら、ここに <Section label="ARTICLES" …> を足す */}

      <Section label="NOTE" title="数値の扱いについて" meta="推定値">
        <div className="max-w-[68ch] space-y-2 border-l-[3px] border-accent-vivid pl-4 text-sm text-dim">
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
    </main>
  );
}
