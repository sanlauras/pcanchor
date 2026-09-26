import type { Metadata } from 'next';
import { SITE, absoluteUrl } from './site';

/**
 * ページごとの検索・SNS向けメタデータを1か所で組み立てる。
 *
 * 以前はページで title と description だけを書いていたため、SNS 用の
 * og:title / og:description / X（Twitter）の文言がレイアウトの既定値のまま、
 * **全ページがホームと同じ**になっていた（og:url も無かった）。2026-09-26 に修正。
 *
 * title・description・canonical・OGP・X の値を同じ引数から出すので、食い違わない。
 *
 * **OGP 画像はここで明示する。** app/opengraph-image.jpg（ファイルでの指定）は、ページ側で
 * openGraph を書くと引き継がれなくなる（Next.js の仕様。一度全ページで画像が消えたのを確認した）。
 */
const OG_IMAGE = {
  url: '/opengraph-image.jpg',
  width: 1200,
  height: 630,
  alt: `${SITE.name}（PC ANCHOR）— ゲーミングPCとデバイスを、数字で選ぶ。`,
};

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  /** 検索結果に出る題名。absoluteTitle でなければ末尾に「｜PCアンカー」が付く */
  title: string;
  description: string;
  /** このページの正規のパス（例: /gpu/geforce-rtx-5070）。canonical と og:url に使う */
  path: string;
  /** サイト名を付け足さない（ホームのように、題名にサイト名が既に入っているページ用） */
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title}｜${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'ja_JP',
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * ツールページの構造化データ（WebApplication）。
 *
 * 事実だけを書く: ブラウザで動く・無料・登録不要。評価（星）などは持っていないので書かない
 * （Google のガイドラインで、ページに無い情報を構造化データだけに書くのは禁止）。
 */
export function webApplicationJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    inLanguage: 'ja',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}

/** 構造化データを <script> で埋め込む。中身はページに表示している内容と一致させること */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
