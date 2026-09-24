import type { Metadata } from 'next';
import {
  BIZ_UDPGothic,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Rubik_Distressed,
} from 'next/font/google';
import Link from 'next/link';
import { Analytics } from '@/components/Analytics';
import { MobileMenu } from '@/components/MobileMenu';
import { AMAZON_DISCLOSURE, hasAmazonTag } from '@/lib/affiliate';
import { HEADER_NAV } from '@/lib/nav';
import { SITE } from '@/lib/site';
import './globals.css';

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
 *
 * 2026-09-22 のデザインの作り直しで Zen Kaku Gothic New から BIZ UDPGothic に替えた。
 * 読みやすさを目的に作られた書体（ユニバーサルデザイン）で、技術資料風の見た目にも合う。
 * 「見出しが見にくい」という指摘が作り直しのきっかけだったため。
 *
 * subsets は「preload するファイル」を選ぶ指定で、日本語のグリフ自体は
 * unicode-range 付きで全部入る。latin だけを preload させ、日本語は
 * 実際に使う文字のぶんだけ遅延取得させている。
 * display:'swap' なのでフォント待ちで表示は止まらない。
 */
const jpHeading = BIZ_UDPGothic({
  variable: '--font-jp',
  subsets: ['latin'],
  weight: ['700'],
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
    <html lang="ja" className={`${fontVars} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/*
          スクロールしても上に残す。一覧ページは行数が多く、下まで行くと
          ナビが画面外に出て戻る手段が無くなるため。
          重なり順は 比較トレイ(z-10) < ヘッダー(z-20) < 比較モーダル(z-50)。
          技術資料の表題のように、下に墨色の太い罫線を引く。
        */}
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper">
          <div className="mx-auto flex h-(--header-h) max-w-[1240px] items-center gap-x-6 px-5">
            {/* ロゴはヒーローと同じ書体・同じ英語表記で揃える */}
            <Link
              href="/"
              className="shrink-0 font-display text-2xl leading-none tracking-[var(--display-tracking)] uppercase hover:text-accent"
            >
              {SITE.nameEn}
            </Link>
            {/* PC幅は横に並べる。スマホは MENU の中に縦に並べる（横スクロールで隠れないように） */}
            <nav className="hidden min-w-0 flex-1 md:flex md:flex-wrap md:gap-x-1" aria-label="メイン">
              {HEADER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 px-2.5 py-1.5 font-cond text-sm font-bold whitespace-nowrap text-dim hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <MobileMenu />
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-12 border-t-2 border-ink">
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
            性能指数と推定fpsは推定値で、誤差は ±15〜20% です。モデル別の性能はメーカー公式スペックから自前で計算しています。ゲーム別の係数は、自前の実測と、許諾を得た第三者の測定から算出した値を使っています。他社のfps数値表の転載はしていません。
            <br />
            {/*
              アソシエイト運営規約で表示が義務づけられている文言。
              文言を勝手に変えないこと。タグ未設定のときは出さない
              （リンクが無いのに「収入を得ています」と書くと事実に反するため）。
            */}
            {hasAmazonTag() && (
              <>
                <span className="mt-2 block text-ink">{AMAZON_DISCLOSURE}</span>
              </>
            )}
            <span className="mt-2 inline-block">© {SITE.name}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
