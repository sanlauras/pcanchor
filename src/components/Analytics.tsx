import Script from 'next/script';

/**
 * Google Analytics 4。
 *
 * afterInteractive で読み込むので、ページの表示をブロックしない。
 * 開発中は読み込まない（自分のアクセスで数字が汚れるのを防ぐため）。
 *
 * 利用している旨は /privacy に記載済み。
 */
const GA_ID = 'G-MED9YS4781';

export function Analytics() {
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
