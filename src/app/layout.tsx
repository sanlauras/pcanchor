import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from 'next/font/google';
import Link from 'next/link';
import { ThemePicker } from '@/components/ThemePicker';
import { SITE } from '@/lib/site';
import './globals.css';

// 描画前に data-theme を決めてちらつきを防ぐ。
// クエリ ?theme= → localStorage → 既定(cyan) の順。
const THEME_BOOTSTRAP = `(function(){try{
var q=new URLSearchParams(location.search).get('theme');
var v=q||localStorage.getItem('theme')||'cyan';
if(['cyan','amber','lime'].indexOf(v)<0)v='cyan';
document.documentElement.dataset.theme=v;
if(q)localStorage.setItem('theme',v);
}catch(e){document.documentElement.dataset.theme='cyan';}})();`;

// 日本語本文は端末のシステムフォントを使う（日本語ウェブフォントは重いため）。
// 数値と見出しだけ、プロトタイプと同じ IBM Plex を読み込む。
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const plexCond = IBM_Plex_Sans_Condensed({
  variable: '--font-plex-cond',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}｜ゲーミングPCのfps予想とスペック比較`,
    template: `%s｜${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE.name,
    title: `${SITE.name}｜ゲーミングPCのfps予想とスペック比較`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const nav = [
  { href: '/tools/fps', label: 'fps予想' },
  { href: '/gpu', label: 'GPU' },
  { href: '/cpu', label: 'CPU' },
  { href: '/games', label: 'ゲーム別' },
];

const footerNav = [
  { href: '/about', label: 'このサイトについて' },
  { href: '/privacy', label: 'プライバシーポリシー' },
  { href: '/terms', label: '利用規約' },
  { href: '/contact', label: 'お問い合わせ' },
];

export default function RootLayout({ children }: LayoutProps<'/'>) {
  // 構造化データ。実在する情報だけを書く（存在しない情報は載せない）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'ja',
      },
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
      },
    ],
  };

  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${plexMono.variable} ${plexCond.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
            <Link href="/" className="font-cond text-lg font-bold tracking-tight">
              {SITE.name}
            </Link>
            <nav className="flex flex-wrap gap-1" aria-label="メイン">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 font-cond text-sm font-semibold text-dim hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto">
              <ThemePicker />
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-12 border-t border-rule">
          <div className="mx-auto max-w-[1240px] px-5 py-8 text-xs text-dim">
            <nav className="mb-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="フッター">
              {footerNav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
            出典: NVIDIA / AMD / Intel 各社公式製品ページおよびアーキテクチャ資料。
            <br />
            クロックはリファレンス仕様値です。OCモデルは個体により異なります。
            <br />
            性能指数と推定fpsは推定値で、誤差は ±15〜20% です。
            モデル別の性能はメーカー公式スペックから自前で計算しています。
            ゲーム別の係数は、自前の実測と、許諾を得た第三者の測定から算出した値を
            使っています。他社のfps数値表の転載はしていません。
            <br />
            <span className="mt-2 inline-block">© {SITE.name}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
