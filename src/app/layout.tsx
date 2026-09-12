import type { Metadata } from 'next';
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Rubik_Distressed,
  Zen_Kaku_Gothic_New,
} from 'next/font/google';
import Link from 'next/link';
import { Analytics } from '@/components/Analytics';
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
// 数値と欧文の見出しはプロトタイプと同じ IBM Plex。
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

/*
 * 見出しの日本語フォント。
 *
 * IBM Plex Sans Condensed には日本語のグリフが1文字も無いため、
 * これが無いと日本語の見出しは端末の既定フォントで出てしまう。
 * サイト全体で71か所の見出しに効くので、読みやすさを優先して
 * 素直なゴシックを1書体だけ入れる（飾りはロゴの欧文書体だけで出す）。
 *
 * subsets は「preload するファイル」を選ぶ指定で、日本語のグリフ自体は
 * unicode-range 付きで全部入る。latin だけを preload させ、日本語は
 * 実際に使う文字のぶんだけ遅延取得させている（1チャンク約11KB）。
 * display:'swap' なのでフォント待ちで表示は止まらない。
 */
const jpHeading = Zen_Kaku_Gothic_New({
  variable: '--font-jp',
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
});

/*
 * ロゴ（ヘッダー左上とトップのヒーロー）に使う欧文ディスプレイフォント。
 *
 * 輪郭がざらついて欠ける書体。字の構造自体は壊れないので、
 * ロゴサイズ(20px)でも読める範囲に崩れが収まる。
 * 飾りはこのロゴだけに閉じ込め、読ませる文章には使わない。
 * 欧文のみ・1ファイルなので数十KB。
 */
const dispRubik = Rubik_Distressed({
  variable: '--font-rubik-dist',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const fontVars = [
  plexMono.variable,
  plexCond.variable,
  jpHeading.variable,
  dispRubik.variable,
].join(' ');

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}｜ゲーム別fps予想とゲーミングPCスペック比較`,
    template: `%s｜${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE.name,
    title: `${SITE.name}｜ゲーム別fps予想とゲーミングPCスペック比較`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Google Search Console の所有権確認。全ページの head に入る。
  // Cloudflare Pages は .html 拡張子を自動で落とすため、
  // ファイル方式ではなくメタタグ方式を使っている。
  verification: {
    google: 'N05x0Q_9dPRmn4rp6M4lhw9EX6ykCmzRdXGfgWgmbxs',
  },
};

// ロゴは崩れた書体で小さく出ているためリンクだと気づきにくい。
// 読めるラベルとして「ホーム」を先頭に置く。
const nav = [
  { href: '/', label: 'ホーム' },
  { href: '/tools/fps', label: 'ゲーム別fps予想' },
  { href: '/tools/build', label: '構成を選ぶ' },
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
      className={`${fontVars} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/*
          スクロールしても上に残す。一覧ページは行数が多く、下まで行くと
          ナビが画面外に出て戻る手段が無くなるため。
          背景を敷かないと下の内容が透ける。比較トレイと同じ手法。
          重なり順は 比較トレイ(z-10) < ヘッダー(z-20) < 比較モーダル(z-50)。
        */}
        <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-(--header-h) max-w-[1240px] items-center gap-x-4 px-5 sm:gap-x-6">
            {/* ロゴはヒーローと同じ書体・同じ英語表記で揃える */}
            <Link
              href="/"
              className="shrink-0 font-display text-2xl leading-none tracking-[var(--display-tracking)] uppercase hover:text-accent"
            >
              {SITE.nameEn}
            </Link>
            {/*
              狭い画面では折り返さず横スクロールさせる。
              折り返すとヘッダーが2〜3段になり、固定したときに画面を食いすぎるため。
            */}
            <nav
              className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 md:flex-wrap md:overflow-visible"
              aria-label="メイン"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 px-2.5 py-1.5 font-cond text-sm font-semibold whitespace-nowrap text-dim hover:text-ink sm:px-3"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="shrink-0">
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
