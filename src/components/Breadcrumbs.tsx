import Link from 'next/link';
import { lastUpdated } from '@/lib/changelog';
import { SITE, absoluteUrl } from '@/lib/site';

export type Crumb = { href: string; label: string };

/**
 * パンくずリスト。表示と BreadcrumbList 構造化データの両方を出す。
 * 構造化データは実際の表示と一致していなければならないので、同じ配列から作る。
 *
 * 右端に、このページの最終更新日も出す（2026-09-27。SEO監査の指摘: 情報が新しいか分からない）。
 * 日付は更新履歴（src/lib/changelog.ts）から決め、同じ値を WebPage の dateModified に入れる。
 * ホーム以外の全ページがパンくずを持っているので、ここに置けば漏れがない。
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const items = [{ href: '/', label: 'ホーム' }, ...trail];
  const path = items[items.length - 1]!.href;
  const updated = lastUpdated(path);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.label,
          item: absoluteUrl(c.href),
        })),
      },
      {
        '@type': 'WebPage',
        '@id': absoluteUrl(path),
        url: absoluteUrl(path),
        name: items[items.length - 1]!.label,
        inLanguage: 'ja',
        dateModified: updated,
        isPartOf: { '@id': `${SITE.url}/#website` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-5">
        <nav aria-label="パンくず" className="text-[13px] text-dim">
          <ol className="flex flex-wrap items-center gap-1.5">
            {items.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {i === items.length - 1 ? (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="hover:text-accent hover:underline">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="font-mono text-[11px] text-dim">
          最終更新{' '}
          <Link href="/changelog" className="hover:text-accent hover:underline">
            <time dateTime={updated}>{updated}</time>
          </Link>
        </p>
      </div>
    </>
  );
}
