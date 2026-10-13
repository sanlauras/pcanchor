import type { BlogTocItem } from '@/content/blog/types';

/** 目次。押すと見出しへ移動する（ページ内リンクなので JavaScript は使わない） */
export function Toc({ items }: { items: BlogTocItem[] }) {
  return (
    <nav aria-label="目次" className="my-8 rounded-xl border border-frame bg-panel p-5">
      <p className="mb-2 font-cond text-sm font-bold">目次</p>
      <ol className="list-decimal space-y-1.5 pl-5 text-[15px] marker:text-dim">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-accent underline-offset-2 hover:underline">
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
