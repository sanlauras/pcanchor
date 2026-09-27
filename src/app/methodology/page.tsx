import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { tally } from '@/lib/data/summary';
import { GAMES } from '@/lib/fps/games';
import { ANCHOR, FPS_ERROR } from '@/lib/fps/model';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: '算出方法｜性能指数と推定fpsの計算式',
  description:
    'GPU・CPUの性能指数をメーカー公式スペックからどう計算しているか、推定fpsの式、ゲームごとの係数の出どころ、1% Low と誤差の扱い、感度換算の係数の確かめ方をまとめています。',
  path: '/methodology',
});

/*
 * 算出方法をまとめたページ（2026-09-27 追加。SEO監査の指摘: 説明が fps予想ツールと「このサイトについて」に散らばっていた）。
 *
 * 中身は、以前 /tools/fps の下部に書いていた説明と、data/make_index.py の考え方。
 * 係数の値そのものは data/make_index.py・src/lib/fps/games.ts が正で、ここはその説明。
 * 第三者の測定者の名前（Apex）は、ユーザーの判断で出さない（2026-09-17）。
 */

const H2 = 'mb-3 font-cond text-xl font-bold';
const PRE = 'overflow-x-auto border border-rule bg-panel p-4 font-mono text-[11px] text-dim';

export default function MethodologyPage() {
  const supported = GAMES.filter((g) => g.supported);
  const errPct = Math.round(FPS_ERROR * 100);

  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/methodology', label: '算出方法' }]} />

      <header className="border-b border-ink pt-8 pb-7">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          METHODOLOGY
        </p>
        <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          算出方法
        </h1>
        <p className="max-w-[60ch] text-dim">
          {`このサイトの数値は、すべて推定値です（誤差 ±15〜${errPct}%）。どう計算しているかを、ここにまとめて公開します。`}
        </p>
      </header>

      <div className="space-y-10 py-8 text-sm leading-relaxed">
        <section>
          <h2 className={H2}>全体の考え方</h2>
          <p className="text-dim">
            {`実測は1台（${ANCHOR.gpuName} + ${ANCHOR.cpuName}）だけです。この1台を「アンカー（基準点）」にして、ほかの GPU ${tally.gpuCount}モデル・CPU ${tally.cpuCount}モデルは、メーカー公式スペックから自前で計算した性能指数で推定します。`}
            {'ゲームごとの違いは「係数」（割り算で出した比率）として持っています。レビューサイトや動画の fps 数値表は転載も保存もしていません。'}
          </p>
          <pre className={`mt-3 ${PRE}`}>
{`実測（VALORANT・${ANCHOR.gpuName} + ${ANCHOR.cpuName}）
  4K 全て高      ${ANCHOR.gpuFps4kHigh} fps   … GPU の基準点（GPU指数 100）
  1080p 全て低   ${ANCHOR.cpuCeiling} fps   … CPU の基準点（CPU指数 100。CPU が上限を決めている条件）
  4K→1440p       ×1.87（画素数の比 2.25 より緩やか）
  全て高→全て低  ×1.74（4K）`}
          </pre>
          <p className="mt-3 text-dim">
            実測の機材と手順は
            <Link href="/about" className="text-accent underline">
              このサイトについて
            </Link>
            に載せています。
          </p>
        </section>

        <section>
          <h2 className={H2}>GPU の性能指数</h2>
          <p className="text-dim">
            メーカー公式のスペック（シェーダー数・ブーストクロック・メモリ帯域・キャッシュ容量）から計算します。基準は {ANCHOR.gpuName} = 100。
          </p>
          <pre className={`mt-3 ${PRE}`}>
{`演算 = シェーダー数 × アーキテクチャ係数 × ブーストクロック
帯域 = メモリ帯域 × (1 + キャッシュ容量の補正)
指数 ∝ 演算^0.78 × 帯域^0.22`}
          </pre>
          <ul className="mt-3 space-y-1.5 text-dim">
            <li>
              ・<strong className="font-medium text-ink">アーキテクチャ係数</strong>
              は、シェーダー数の表記の違いを揃えるためのものです。NVIDIA は Ampere 以降、CUDA コア数を FP32 換算で倍に数えて表記しています。AMD の RDNA は全世代「CU × 64」の一貫した表記です。ここを取り違えると順位が壊れるため、世代ごとに係数を1つ持っています。
            </li>
            <li>
              ・係数が世代ごとに1つしか無いので、
              <strong className="font-medium text-ink">指数が数%しか違わないモデル同士の順位は信用できません。</strong>
              世代をまたいだ大きな差は、それなりに信用できます。
            </li>
            <li>・クロックは全てリファレンス仕様値です。Founders Edition や工場 OC モデルの値は混ぜていません。</li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>CPU の性能指数</h2>
          <p className="text-dim">
            ゲームで効く要素に絞って計算します。基準は {ANCHOR.cpuName} = 100。
          </p>
          <pre className={`mt-3 ${PRE}`}>
{`単スレッド性能 = IPC（メーカー公表値） × ブーストクロック
指数 ∝ 単スレッド性能 × L3キャッシュの補正（容量の対数） × コア数の補正（8コアで頭打ち）`}
          </pre>
          <ul className="mt-3 space-y-1.5 text-dim">
            <li>・ゲームは L3 キャッシュの容量に敏感です。3D V-Cache 搭載モデルが強いのは、この補正で表しています。</li>
            <li>
              ・コアが2つのブロック（CCD）に分かれた Ryzen は、ゲームが片方のブロックで動くため、使える L3 を実質の値に直しています（3D V-Cache 搭載品は、キャッシュ側のブロックのクロックで計算）。
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>推定fps の式</h2>
          <pre className={PRE}>
{`予想fps（理論値） = min(GPU由来fps, CPU由来fps)
実際の画面のfps   = min(予想fps, ゲーム側の上限)

GPU由来fps = 基準GPUの「VALORANT 4K全て高」fps
           × ゲームの重さ
           × (そのGPU ÷ 基準GPU)^GPU性能の効き方
           × 設定係数 × 解像度係数
CPU由来fps = そのCPUの「VALORANT 天井」fps × ゲームの重さ`}
          </pre>
          <ul className="mt-3 space-y-1.5 text-dim">
            <li>
              ・大きく表示している予想fpsは、ゲーム側の fps 上限を含めない理論値です（PC の性能を見るため）。Apex Legends のように上限があるゲームでは、上限を超える構成に「実際の画面では上限で止まる」ことを添えています。
            </li>
            <li>
              ・GPU 由来と CPU 由来の差が5%以内なら「拮抗」、それ以外は低い方を「律速（上限を決めている側）」としています。
            </li>
            <li>
              ・解像度係数は画素数の比を指数で効かせています。1080p は実測が無い（実測した 1080p は CPU が上限を決めていて GPU 側の値が取れなかった）ため、実測の 4K→1440p から外挿しています。
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>ゲームごとの係数の出どころ</h2>
          <p className="mb-3 text-dim">
            係数は、同じ構成で条件だけを変えた測定の「割り算の結果」だけを使っています。第三者の測定は、許諾を得たものに限ります。
          </p>
          <dl className="space-y-4">
            <div className="border-l-2 border-accent pl-4">
              <dt className="font-cond text-base font-bold text-ink">VALORANT</dt>
              <dd className="mt-1 text-dim">
                自前の実測4条件から導出。4K→1440p は ×1.87、全て高→全て低は ×1.74 で、どちらも実測値です。
              </dd>
            </div>
            <div className="border-l-2 border-accent pl-4">
              <dt className="font-cond text-base font-bold text-ink">Fortnite</dt>
              <dd className="mt-1 text-dim">
                許諾を得たうえで、Boss Benchmarks さんの実測（Ryzen 7 9800X3D + RTX 5070 Ti）から算出。CPU が自前の実測機と同じため、ゲーム間の重さを直接比べられています。解像度係数はプリセットごとに違い（重い設定ほど画素数に比例して重くなる）、GPU 使用率が97%以上で GPU が上限を決めていると確認できた条件だけを使っています。
              </dd>
            </div>
            <div className="border-l-2 border-accent pl-4">
              <dt className="font-cond text-base font-bold text-ink">Apex Legends</dt>
              <dd className="mt-1 text-dim">
                許諾を得たうえで、第三者の測定から算出。GPU 側は Core i9 13900K で GPU 30枚を測った結果（射撃訓練場の重い場面）、CPU 側は RTX 4090 で CPU 15個を測った結果（キングスキャニオン）を使っています。Apex では上位の GPU ほど fps の伸びが鈍り、性能指数が2倍になっても fps は約1.6倍です。これを「GPU性能の効き方」として式に入れています（VALORANT と Fortnite は1で、指数に比例）。低・中の設定はフルHDの測定しかないため、WQHD / 4K は最高設定の解像度係数を流用した近似です。
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-dim">
            {`対応しているのは ${supported.map((g) => g.name).join('・')} です。係数が揃わないゲームは、数字を出していません。`}
          </p>
        </section>

        <section>
          <h2 className={H2}>1% Low（カクつき）と VRAM</h2>
          <ul className="space-y-1.5 text-dim">
            <li>
              ・1% Low は、予想fps（理論値）に「1% Low ÷ 平均fps」の比を掛けて出しています。比は設定ごとの測定から求め、ばらつきをそのまま幅（〇〜〇 fps）で表示しています。
            </li>
            <li>
              ・VRAM の見込みは、4K での測定値を基準に解像度で概算しています。自前の実測では、画質を下げても VRAM 使用量はほとんど減りませんでした。VRAM の不足は平均fpsより、カクつきに効きます。
            </li>
          </ul>
        </section>

        <section>
          <h2 className={H2}>誤差について</h2>
          <p className="text-dim">
            {`性能指数も推定fpsも、誤差 ±15〜${errPct}% の推定値として表示しています。実測は1構成だけで、ほかのモデルはそこからの外挿だからです。`}
            {'Apex Legends では、性能指数15未満の GPU で予想が実際より高めに出る傾向が測定との照合で分かっており、該当する値には印を付けています。'}
          </p>
        </section>

        <section>
          <h2 className={H2}>感度換算の係数</h2>
          <p className="text-dim">
            感度の換算に使う係数（マウス1カウントで何度回るか）は、fps の測定値ではなくゲーム側の仕様の定数です。許諾を得た第三者のサイトが公開している値を使い、
            <strong className="font-medium text-ink">複数のサイトで一致していること</strong>
            と、サイトが公開している換算の関係をビルド時の自己テストで再現できることを確かめています。根拠が取れないタイトルは載せていません。
          </p>
        </section>

        <section className="border-t border-rule-soft pt-5 text-dim">
          <p>
            計算式を実際に使うツールは
            <Link href="/tools/fps" className="text-accent underline">
              ゲーム別fps予想・ボトルネック診断
            </Link>
            です。サイトの変更は
            <Link href="/changelog" className="text-accent underline">
              更新履歴
            </Link>
            で公開しています。
          </p>
        </section>
      </div>
    </main>
  );
}
