import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: '利用規約',
  description:
    'PCアンカーの利用条件と免責事項。掲載している性能指数と推定fpsは誤差±15〜20%の推定値であり、実環境での結果を保証するものではありません。',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/terms', label: '利用規約' }]} />
      <header className="border-b border-ink pt-8 pb-7">
        <h1 className="font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          利用規約
        </h1>
      </header>
      <div className="space-y-8 py-8 text-sm leading-relaxed text-dim">
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">掲載している数値について</h2>
          <p>
            当サイトの性能指数と推定fpsは、メーカー公式の公開スペックと、
            自前の実測および許諾を得た第三者の測定から算出した係数をもとに計算した
            <strong className="font-medium text-ink">推定値（誤差 ±15〜20%）</strong>です。
          </p>
          <p className="mt-2">
            実測は1構成のみで、他のモデルはそこからの外挿です。とくに
            指数が数%しか違わないモデル同士の順位は信用できません。
            実際の環境ではドライバ、設定、測定シーン、周辺パーツによって結果が変わります。
            購入や構成の判断は、他の情報源とあわせてご自身でご検討ください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">免責事項</h2>
          <p>
            当サイトの情報を利用したことによって生じた損害について、
            運営者は責任を負いかねます。
            掲載内容は予告なく変更または削除することがあります。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">著作権について</h2>
          <p>
            当サイトが掲載しているスペックデータは、各メーカーが公開している仕様を
            照合したうえで独自に整理したものです。性能指数と推定fpsは当サイトの計算によるものです。
          </p>
          <p className="mt-2">
            他サイトのベンチマーク数値表を転載することはしていません。
            第三者の測定を参照する場合も、許諾を得たうえで係数（割り算の結果）のみを使用しています。
          </p>
          <p className="mt-2">
            当サイトの内容を引用される場合は、出典として当サイトへのリンクを明記してください。
            数値の無断での大量転載はご遠慮ください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">リンクについて</h2>
          <p>当サイトへのリンクは自由です。事前のご連絡は不要です。</p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">お問い合わせ</h2>
          <p>
            本規約に関するお問い合わせは
            <Link href="/contact" className="text-accent underline">お問い合わせページ</Link>
            からお願いします。
          </p>
        </section>
        <p className="border-t border-rule-soft pt-4 text-xs">{SITE.name}</p>
      </div>
    </main>
  );
}
