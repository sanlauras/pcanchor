import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'お問い合わせ',
  description:
    'PCアンカーへのお問い合わせ。数値の誤りのご指摘、実測データのご提供、掲載についてのご連絡はこちらから。',
  alternates: { canonical: '/contact' },
};

const topics = [
  {
    title: '数値の誤りを見つけた',
    body: 'スペックの誤りや計算の不整合を見つけた場合は、モデル名と該当箇所をお知らせください。一次資料と照合して修正し、修正内容を記録します。',
  },
  {
    title: '実測データを提供したい',
    body: 'ご自身の環境で測定したfpsをご提供いただけると、推定の精度が上がります。CapFrameX などで Remove outliers を有効にした平均fpsと1% Low、構成、解像度、画質設定、ドライバ版を添えてください。投稿フォームは準備中です。',
  },
  {
    title: '測定データの掲載について',
    body: 'ベンチマークを公開されている方へ。当サイトは数値表の転載はせず、許諾を得たうえで係数（解像度や設定による倍率）のみを算出して使用しています。掲載の可否についてのご連絡もこちらへお願いします。',
  },
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/contact', label: 'お問い合わせ' }]} />
      <header className="border-b border-ink pt-8 pb-7">
        <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          お問い合わせ
        </h1>
        <p className="max-w-[60ch] text-dim">
          数値の誤りのご指摘は特に歓迎しています。訂正した内容は記録に残しています。
        </p>
      </header>

      <div className="space-y-8 py-8 text-sm leading-relaxed">
        <section className="border border-rule bg-panel p-5">
          <h2 className="mb-2 font-cond text-lg font-bold">連絡先</h2>
          <p className="text-dim">
            メールでご連絡ください。
            <br />
            <a
              href="mailto:sososi222777@gmail.com"
              className="mt-1 inline-block font-mono text-base text-accent underline"
            >
              sososi222777@gmail.com
            </a>
          </p>
          <p className="mt-3 text-xs text-dim">
            返信までお時間をいただくことがあります。
            数値の誤りのご指摘は、該当するモデル名とページのURLを添えていただけると助かります。
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-cond text-lg font-bold">ご連絡いただく内容の例</h2>
          <dl className="space-y-4">
            {topics.map((t) => (
              <div key={t.title} className="border-l-2 border-rule pl-4">
                <dt className="font-medium text-ink">{t.title}</dt>
                <dd className="mt-1 text-dim">{t.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-dim">
          データの扱いについては
          <Link href="/privacy" className="text-accent underline">プライバシーポリシー</Link>
          を、掲載内容の条件については
          <Link href="/terms" className="text-accent underline">利用規約</Link>
          をご確認ください。
        </p>
      </div>
    </main>
  );
}
