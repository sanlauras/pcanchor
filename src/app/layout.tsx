import type { Metadata, Viewport } from 'next';
import {
  BIZ_UDPGothic,
  Exo_2,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
} from 'next/font/google';
import Link from 'next/link';
import { Analytics } from '@/components/Analytics';
import { AnchorMark } from '@/components/AnchorMark';
import { MobileMenu } from '@/components/MobileMenu';
import { NavGroup } from '@/components/NavGroup';
import { NavLink } from '@/components/NavLink';
import { Wordmark } from '@/components/Wordmark';
import { AMAZON_DISCLOSURE, hasAmazonTag } from '@/lib/affiliate';
import { HOME_NAV, NAV_GROUPS, SITE_INFO_NAV } from '@/lib/nav';
import { OPERATOR, SITE } from '@/lib/site';
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
 *
 * preload はしない（2026-09-27）。見出しの欧文は先に並ぶ Plex で出るので、この書体の
 * latin ファイルはほぼ使われない。先読みさせると、表示に必要な CSS と回線を取り合うだけだった。
 */
const jpHeading = BIZ_UDPGothic({
  variable: '--font-jp',
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  preload: false,
});

/*
 * ロゴ（ヘッダー左上とトップのヒーロー）に使う欧文フォント。
 *
 * 2026-09-27 の暗いデザインへの作り直しで、ざらついた Rubik Distressed（欧文だけで約200KB）から、
 * イメージ画像のようなすっきりした太字の Exo 2 に替えた（ユーザーの判断）。
 * 使うのはロゴの太さ1つ・欧文だけなので軽い。ロゴは最初の画面に必ず出るので先読みする。
 */
const logoFont = Exo_2({
  variable: '--font-logo',
  subsets: ['latin'],
  weight: '800',
  display: 'swap',
});

const fontVars = [
  plexMono.variable,
  plexCond.variable,
  jpHeading.variable,
  logoFont.variable,
].join(' ');

/** ブラウザのアドレスバーなどの色。背景の紺に合わせる */
export const viewport: Viewport = {
  themeColor: '#070d18',
  colorScheme: 'dark',
};

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
  ...SITE_INFO_NAV,
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
        alternateName: SITE.nameEn,
        url: SITE.url,
        // 正方形の PNG（Google の要件。SVG は不可）。scripts/make-logo.mjs で icon.svg から作る
        logo: `${SITE.url}/logo.png`,
        founder: { '@id': `${SITE.url}/about#operator` },
      },
      {
        // 運営者。/about に表示している紹介と同じ内容だけを書く
        '@type': 'Person',
        '@id': `${SITE.url}/about#operator`,
        name: OPERATOR.name,
        url: `${SITE.url}/about`,
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
          紺の半透明の帯で、後ろをぼかす（イメージ画像のヘッダー）。
        */}
        <header className="sticky top-0 z-20 border-b border-frame bg-paper/80 backdrop-blur-md">
          <div className="mx-auto flex h-(--header-h) max-w-[1240px] items-center gap-x-6 px-5">
            {/* ロゴはヒーローと同じ書体・同じ英語表記で揃える。左の錨はファビコンと同じ形 */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 hover:opacity-85"
            >
              <AnchorMark gradient className="size-8 shrink-0" />
              <span className="flex flex-col">
                <span className="font-display text-xl leading-none font-extrabold tracking-[var(--display-tracking)] uppercase">
                  <Wordmark />
                </span>
                {/* ロゴの下の文言（2026-09-30 ユーザーの指定）。メニューを3つにまとめたので、どの幅でも並べて入る */}
                <span className="mt-1 font-cond text-[10px] leading-none font-bold tracking-[0.06em] whitespace-nowrap text-dim">
                  {SITE.logoTagline}
                </span>
              </span>
            </Link>
            {/*
              PC 幅は「ホーム」「ツール ∨」「データベース ∨」。まとめにカーソルを合わせると下に一覧が出る（2026-09-30）。
              スマホは MENU の中に同じまとめ方で縦に並べる（横スクロールで隠れないように）
            */}
            <nav className="hidden h-full min-w-0 flex-1 md:flex md:gap-x-1" aria-label="メイン">
              <NavLink href={HOME_NAV.href} label={HOME_NAV.label} />
              {NAV_GROUPS.map((group) => (
                <NavGroup key={group.label} group={group} />
              ))}
            </nav>
            <MobileMenu />
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-12 border-t border-frame bg-panel/60">
          <div className="mx-auto max-w-[1240px] px-5 py-8 text-xs text-dim">
            <div className="mb-5 flex items-center gap-2.5">
              <AnchorMark gradient className="size-7 shrink-0" />
              <p className="flex flex-col">
                <span className="font-display text-base leading-none font-extrabold tracking-[var(--display-tracking)] text-ink uppercase">
                  <Wordmark />
                </span>
                <span className="mt-1 font-cond text-[10px] leading-none font-bold tracking-[0.06em]">{SITE.logoTagline}</span>
              </p>
            </div>
            <nav className="mb-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="フッター">
              {footerNav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-accent">
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
