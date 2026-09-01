import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { tally } from '@/lib/data/summary';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'このサイトについて｜算出方法と実測環境',
  description:
    'PCアンカーの運営者情報、性能指数と推定fpsの算出方法、実測に使っている機材と測定手順、使わないと決めているデータの方針をまとめています。',
  alternates: { canonical: '/about' },
};

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
          {SITE.name}は、ゲーミングPCの性能を「推測ではなく計算と実測から」示すことを
          目的にした個人サイトです。
        </p>
      </header>

      <div className="space-y-10 py-8 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">サイトの目的</h2>
          <p className="text-dim">
            「このPCでこのゲームは何fps出るのか」「どこを変えれば伸びるのか」に、
            根拠のある形で答えることを目指しています。GPU {tally.gpuCount}モデル・
            CPU {tally.cpuCount}モデルのスペックを一次資料と照合したうえで、
            性能指数を自前で計算し、そこから各ゲームのfpsを推定しています。
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
                メーカー公式の公開スペック（コア数・クロック・バス幅・キャッシュ容量・TDPなど）、
                メーカー公表のIPC、自分で行った実測、許諾を得た第三者の測定から算出した係数。
              </dd>
            </div>
            <div className="border-l-2 border-rule pl-4">
              <dt className="font-medium text-ink">使っていないもの</dt>
              <dd className="mt-1 text-dim">
                レビューサイトやYouTubeが公開しているfps数値表の転載。
                個々の数値は事実でも、表やデータベース全体は著作物として保護されますし、
                測定条件が違うデータを混ぜると精度がむしろ落ちます。
                第三者の測定を参照する場合も、取るのは「4K→1440pで何倍になるか」といった
                <strong className="font-medium text-ink">割り算の結果だけ</strong>で、
                fps数値そのものは保存していません。
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-xl font-bold">実測環境</h2>
          <p className="mb-3 text-dim">
            すべての推定の基準になっている実測は、次の1台で行っています。
            この1台を「アンカー（基準点）」として、他のモデルを公開スペックから推定しています。
            サイト名の由来でもあります。
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
            です。実測は1構成だけなので、他のモデルはそこからの外挿になります。
            とくに
            <strong className="font-medium text-ink">
              指数が数%しか違わないモデル同士の順位は信用できません
            </strong>
            。アーキテクチャごとに係数を1つしか持てないためで、実際には逆転しえます。
            世代をまたいだ大きな差は、それなりに信用できます。
          </p>
          <p className="mt-3 text-dim">
            根拠が足りない値は出さない方針です。1% Low（カクつき）と終盤の高負荷時のfpsは、
            現時点で十分なデータが無いため公開していません。
            算出方法は
            <Link href="/tools/fps" className="text-accent underline">
              fps予想ツール
            </Link>
            のページに掲載しています。
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
              <dt className="w-28 shrink-0 text-xs">運営</dt>
              <dd>個人運営</dd>
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
