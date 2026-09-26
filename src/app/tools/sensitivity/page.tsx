import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PageHeader } from '@/components/PageHeader';
import { TOOLS } from '@/lib/nav';
import { SensTool } from '@/components/sens/SensTool';
import { SENS_GAMES } from '@/lib/sens/games';
import { assertSensConversionIsConsistent } from '@/lib/sens/selftest';
import { JsonLd, pageMetadata, webApplicationJsonLd } from '@/lib/seo';

// 係数が参考サイトの公開値とズレたら、ここでビルドが落ちる
assertSensConversionIsConsistent();

export const metadata: Metadata = pageMetadata({
  title: 'FPS感度の換算・振り向き距離(cm/360)の計算',
  description:
    `${SENS_GAMES.map((g) => g.name).join('・')} の感度を相互に換算します。ゲーム内感度・eDPI・振り向き距離(cm/360)のどれからでも計算でき、マウスパッドの幅が足りているかも確認できます。計算はブラウザ内で完結します。`,
  path: '/tools/sensitivity',
});

export default function SensitivityPage() {
  return (
    <div className="mx-auto flex max-w-[1240px] gap-8 px-5">
      <main className="min-w-0 flex-1">
        {/* ツールであることを検索エンジンに伝える。中身はページに書いてある事実だけ */}
        <JsonLd
          data={webApplicationJsonLd({
            name: TOOLS.sensitivity.long,
            description: TOOLS.sensitivity.note,
            path: TOOLS.sensitivity.href,
          })}
        />
        <Breadcrumbs
          trail={[
            { href: '/tools', label: 'ツール' },
            { href: '/tools/sensitivity', label: '感度換算' },
          ]}
        />
        <PageHeader
          eyebrow={TOOLS.sensitivity.eyebrow}
          title={TOOLS.sensitivity.short}
          subtitle={TOOLS.sensitivity.long}
          lead={
            <>
              ゲームを移っても<b className="font-semibold text-ink">同じ振り向き距離</b>でエイムできるように、感度を換算します。ゲーム内感度・eDPI・振り向き距離(cm/360)のどれからでも計算できます。計算はすべてブラウザ内で完結します。
            </>
          }
        />

        <div className="py-6">
          <SensTool />
        </div>

        <section className="mt-8 border-t border-rule-soft pt-5 text-xs text-dim">
          <h2 className="mb-2 font-cond text-base font-bold text-ink">計算方法</h2>
          <pre className="mb-3 overflow-x-auto border border-rule bg-panel p-3 font-mono text-[11px]">
{`振り向き距離 cm/360 = 360 ÷ (yaw × 感度 × DPI) × 2.54
別ゲームの感度      = 元の感度 × (元のyaw × 元のDPI) ÷ (先のyaw × 先のDPI)
eDPI                = DPI × 感度`}
          </pre>
          <div className="max-w-[80ch] space-y-2">
            <p>
              <strong className="font-medium text-ink">yaw（ヨー）</strong>は「マウスを1カウント動かすと何度回るか」を表すゲーム側の定数です。ほとんどのFPSでは、回る角度が感度とDPIにそのまま比例するため、この定数が分かれば割り算だけで別のゲームの感度に直せます。
            </p>
            <p>
              係数は、<strong className="font-medium text-ink">許諾を得た第三者のサイトが公開している値</strong>を使っています。複数のサイトで値が一致していること、そして各サイトが本文に書いている換算の関係（例: 「CS2の感度1.0はOverwatch 2で約3.33」）を当サイトの計算が再現することを、ビルドのたびに自動で確認しています。合わなくなったら公開されません。
            </p>
            <p>
              扱うのは腰だめ（覗いていないとき）の感度だけです。ADS・スコープ時の感度はゲームごとに別の倍率が掛かるため、ここでは換算していません。Rainbow Six Siege は感度のスケールが特殊で根拠のある係数を用意できないため、対応していません。
            </p>
            <p>
              自分の構成で何fps出るかを調べるなら
              <Link href="/tools/fps" className="text-accent underline">
                ゲーム別fps予想・ボトルネック診断
              </Link>
              が使えます。
            </p>
          </div>
        </section>

        <div className="mt-10">
          <AdSlot variant="inline" />
        </div>
      </main>

      <AdSlot variant="rail" />
    </div>
  );
}
