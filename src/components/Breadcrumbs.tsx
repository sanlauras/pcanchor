import Link from 'next/link';
import { absoluteUrl } from '@/lib/site';

export type Crumb = { href: string; label: string };

/**
 * パンくずリスト。表示と BreadcrumbList 構造化データの両方を出す。
 * 構造化データは実際の表示と一致していなければならないので、同じ配列から作る。
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const items = [{ href: '/', label: 'ホーム' }, ...trail];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="パンくず" className="pt-5 text-xs text-dim">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-ink">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
