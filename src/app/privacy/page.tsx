import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description:
    'PCアンカーにおけるアクセス解析、Cookie、アフィリエイトプログラムの利用と、個人情報の取り扱いについて記載しています。',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/privacy', label: 'プライバシーポリシー' }]} />
      <header className="border-b border-ink pt-8 pb-7">
        <h1 className="font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          プライバシーポリシー
        </h1>
      </header>
      <div className="space-y-8 py-8 text-sm leading-relaxed text-dim">
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">アクセス解析について</h2>
          <p>
            当サイトでは、サイトの利用状況を把握するために Google Analytics を使用しています。
            Google Analytics はCookieを使用してデータを収集しますが、
            個人を特定する情報は含まれません。
            収集されるのは閲覧したページ、滞在時間、参照元、おおよその地域などの統計情報です。
          </p>
          <p className="mt-2">
            Cookieの使用はブラウザの設定で無効にできます。
            Google によるデータ収集の詳細と無効化の方法は、Google のポリシーページをご確認ください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">アフィリエイトプログラムについて</h2>
          <p>
            当サイトは、第三者が提供するアフィリエイトプログラムに参加することがあります。
            その場合、商品やサービスの紹介にあたって広告主から報酬を受け取ることがあります。
            広告の配信事業者がCookieを使用して閲覧情報を取得する場合があります。
          </p>
          <p className="mt-2">
            報酬の有無が、掲載している性能指数や推定fpsの数値に影響することはありません。
            数値はすべて公開スペックと実測から機械的に計算しています。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">個人情報の取り扱い</h2>
          <p>
            当サイトのツールは、入力された内容をすべてブラウザ内で処理しており、
            サーバーへ送信していません。会員登録の仕組みもありません。
          </p>
          <p className="mt-2">
            お問い合わせをいただいた場合、返信のために連絡先を使用します。
            それ以外の目的に使用したり、第三者に提供したりすることはありません。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">免責事項</h2>
          <p>
            当サイトが掲載している性能指数と推定fpsは、誤差 ±15〜20% の推定値です。
            実際の環境での結果を保証するものではありません。詳しくは
            <Link href="/terms" className="text-accent underline">利用規約</Link>
            をご確認ください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-cond text-lg font-bold text-ink">お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは
            <Link href="/contact" className="text-accent underline">お問い合わせページ</Link>
            からお願いします。
          </p>
        </section>
        <p className="border-t border-rule-soft pt-4 text-xs">{SITE.name}</p>
      </div>
    </main>
  );
}
