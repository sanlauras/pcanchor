import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { tally } from '@/lib/data/summary';
import { OPERATOR, SITE } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'このサイトについて｜運営者と実測環境',
  description:
    `PCアンカーの運営者（${OPERATOR.name}）の紹介、サイトの目的、使うデータと使わないデータの方針、実測に使っている機材と測定手順をまとめています。`,
  path: '/about',
});

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/about', label: 'このサイトについて' }]} />

      <header className="border-b border-ink pt-8 pb-7">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          ABOUT
        </p>
        <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          このサイトについて
        </h1>
        <p className="max-w-[60ch] text-dim">
          {SITE.name}は、ゲーミングPCの性能を「推測ではなく計算と実測から」示すことを目的にした、{OPERATOR.name}の個人サイトです。
        </p>
      </header>

      <div className="space-y-10 py-8 text-sm leading-relaxed">
        {/*
          運営者の紹介（2026-09-27 追加）。書いてよいのはユーザー本人から聞いた事実だけ。
          機材の写真・実測の生データ・社名の似た会社との関係の一言は、ユーザーの判断で載せない。
        */}
        <section id="operator" className="scroll-mt-[calc(var(--header-h)+1rem)]">
          <h2 className="mb-3 font-cond text-xl font-bold">運営者</h2>
          <div className="border-2 border-ink bg-panel p-5">
            <p className="font-cond text-lg font-bold text-ink">{OPERATOR.name}</p>
            <p className="mt-2 text-dim">
              {'小学生のころから FPS を遊んでいて、もう10年以上になります。好きな FPS / TPS は Fortnite と VALORANT。'}
              {'ほかにもマインクラフトや Apex Legends など、いろいろなゲームを遊んでいます。'}
            </p>
            <p className="mt-2 text-dim">
              {'このサイトの実測は、運営者自身のPC（下の「実測環境」）で行っています。'}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">サイトの目的</h2>
          <p className="text-dim">
            「このPCでこのゲームは何fps出るのか」「どこを変えれば伸びるのか」に、根拠のある形で答えることを目指しています。GPU {tally.gpuCount}モデル・CPU {tally.cpuCount}モデルのスペックを一次資料と照合したうえで、性能指数を自前で計算し、そこから各ゲームのfpsを推定しています。
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">使うデータと、使わないデータ</h2>
          <p className="mb-3 text-dim">
            数値の出所をはっきりさせることを、このサイトの前提にしています。
          </p>
          <dl className="space-y-3">
            <div className="border-l-2 border-accent pl-4">
              <dt className="font-medium text-ink">使っているもの</dt>
              <dd className="mt-1 text-dim">
                メーカー公式の公開スペック（コア数・クロック・バス幅・キャッシュ容量・TDPなど）、メーカー公表のIPC、自分で行った実測、許諾を得た第三者の測定から算出した係数。
              </dd>
            </div>
            <div className="border-l-2 border-rule pl-4">
              <dt className="font-medium text-ink">使っていないもの</dt>
              <dd className="mt-1 text-dim">
                レビューサイトやYouTubeが公開しているfps数値表の転載。個々の数値は事実でも、表やデータベース全体は著作物として保護されますし、測定条件が違うデータを混ぜると精度がむしろ落ちます。第三者の測定を参照する場合も、取るのは「4K→1440pで何倍になるか」といった
                <strong className="font-medium text-ink">割り算の結果だけ</strong>で、fps数値そのものは保存していません。
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">実測環境</h2>
          <p className="mb-3 text-dim">
            すべての推定の基準になっている実測は、次の1台で行っています。この1台を「アンカー（基準点）」として、他のモデルを公開スペックから推定しています。サイト名の由来でもあります。
          </p>
          <pre className="overflow-x-auto border border-rule bg-panel p-4 font-mono text-[11px] text-dim">
{`GPU      Radeon RX 9070 XT 16GB (ASUS)
CPU      Ryzen 7 9800X3D
RAM      32GB (16GB x2) DDR5
Board    MSI B650 GAMING PLUS WIFI
計測     CapFrameX 1.8.6 / 120秒キャプチャ / Remove outliers ON
環境     Resizable BAR: ON / HAGS: ON / Windows ゲームモード: ON
測定日   2026-08-29`}
          </pre>
          <h3 className="mt-5 mb-2 font-cond text-base font-bold">測定手順</h3>
          <ul className="space-y-1 text-dim">
            <li>・計測前に5分ほどプレイして温度とクロックを安定させる</li>
            <li>・起動直後はシェーダーのコンパイルで大きなスパイクが出るため使わない</li>
            <li>・フレームレート制限と垂直同期はオフ</li>
            <li>・GPU使用率ではなく GPU Limit Time で律速を判定する</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">推定値であることについて</h2>
          <p className="text-dim">
            性能指数も推定fpsも、
            <strong className="font-medium text-ink">誤差 ±15〜20% の推定値</strong>
            です。実測は1構成だけなので、他のモデルはそこからの外挿になります。とくに
            <strong className="font-medium text-ink">
              指数が数%しか違わないモデル同士の順位は信用できません
            </strong>
            。アーキテクチャごとに係数を1つしか持てないためで、実際には逆転しえます。世代をまたいだ大きな差は、それなりに信用できます。
          </p>
          <p className="mt-3 text-dim">
            根拠が足りない値は出さない方針です。終盤の高負荷時のfpsは、現時点で実測データが無いため公開していません。1% Low（カクつき）は実測から求めた比で出していますが、ばらつきをそのままレンジで表示しています。計算式と係数の出どころは
            <Link href="/methodology" className="text-accent underline">
              算出方法
            </Link>
            のページにまとめています。サイトの変更は
            <Link href="/changelog" className="text-accent underline">
              更新履歴
            </Link>
            で公開しています。
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">運営者情報</h2>
          <dl className="space-y-2 text-dim">
            <div className="flex gap-4 border-b border-rule-soft py-1.5">
              <dt className="w-28 shrink-0 text-xs">サイト名</dt>
              <dd>
                {SITE.name}（{SITE.nameEn}）
              </dd>
            </div>
            <div className="flex gap-4 border-b border-rule-soft py-1.5">
              <dt className="w-28 shrink-0 text-xs">運営者</dt>
              <dd>{OPERATOR.name}（個人運営）</dd>
            </div>
            <div className="flex gap-4 border-b border-rule-soft py-1.5">
              <dt className="w-28 shrink-0 text-xs">お問い合わせ</dt>
              <dd>
                <Link href="/contact" className="text-accent underline">
                  お問い合わせページ
                </Link>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
