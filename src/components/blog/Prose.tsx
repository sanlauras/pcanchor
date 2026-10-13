/**
 * ブログ記事の本文の部品（2026-10-13）。記事のファイルはこれを組み合わせて書く。
 *
 * 読みやすさの方針: 1行は長文向けに絞る（約40字）、行間を広め、段落は短く。見出しは目次から飛べるよう id を持つ。
 * 色は変数（globals.css の .theme-light）に従うので、明るい配色で出る。
 */

const SCROLL = 'scroll-mt-[calc(var(--header-h)+1.25rem)]';

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className={`${SCROLL} mt-14 mb-4 border-b-2 border-ink pb-2 font-cond text-[1.45rem] leading-snug font-bold sm:text-2xl`}>
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className={`${SCROLL} mt-9 mb-3 border-l-4 border-accent pl-3 font-cond text-lg leading-snug font-bold`}>
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="my-4 leading-[1.95]">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="my-4 list-disc space-y-1.5 pl-6 leading-[1.85] marker:text-accent">{children}</ul>;
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="my-4 list-decimal space-y-1.5 pl-6 leading-[1.85] marker:font-semibold marker:text-accent">{children}</ol>;
}

/** 強調（太字）。色だけで意味を伝えないよう、太さで示す */
export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold text-ink">{children}</strong>;
}

/** 用語の初出に添える短い説明（括弧書きより目立たせない） */
export function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <>
      <B>{word}</B>
      <span className="text-dim">（{children}）</span>
    </>
  );
}

/** 補足・注意の枠。tone は意味（色だけで伝えないよう、見出しの文字も付ける） */
export function Note({
  title,
  tone = 'info',
  children,
}: {
  title: string;
  tone?: 'info' | 'caution';
  children: React.ReactNode;
}) {
  const style =
    tone === 'caution'
      ? 'border-l-4 border-[#b45309] bg-[#fff7ed]'
      : 'border-l-4 border-accent bg-accent-soft';
  return (
    <aside className={`my-6 rounded-r-lg px-4 py-3.5 ${style}`}>
      <p className="mb-1 font-cond text-sm font-bold">{tone === 'caution' ? `注意：${title}` : title}</p>
      <div className="text-[15px] leading-[1.85] [&>p]:my-1.5">{children}</div>
    </aside>
  );
}

/**
 * 書きかけの印（開発中だけ出す）。確認待ちの情報がある場所に置く。公開のビルドでは何も出さない。
 * これが残っている記事は、status を published にしないこと
 */
export function DevTodo({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div className="my-6 rounded-lg border-2 border-dashed border-[#b45309] bg-[#fff7ed] p-4 text-sm">
      <p className="font-bold">【開発中だけの表示・確認待ち】</p>
      <div className="mt-1 text-dim">{children}</div>
    </div>
  );
}

/** 結論の枠。記事の結論を後ろに隠さず、最初の方で示す */
export function Conclusion({ title = '結論', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="my-8 rounded-xl border-2 border-accent bg-panel p-5 shadow-glow">
      <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent">CONCLUSION</p>
      <p className="mb-3 font-cond text-lg font-bold">{title}</p>
      <div className="leading-[1.85] [&>p]:my-2 [&>ul]:my-2">{children}</div>
    </section>
  );
}

/**
 * スマホでも崩れない表。PC 幅は普通の表、狭い画面では1行＝1枚のカード（各セルの前に列の名前）。
 * cells は文字か部品。数字を手で書かず、計算の部品を入れられる。
 */
export function DataTable({
  caption,
  head,
  rows,
  note,
}: {
  caption: string;
  head: string[];
  rows: React.ReactNode[][];
  note?: React.ReactNode;
}) {
  return (
    <figure className="my-6">
      <figcaption className="mb-2 font-cond text-sm font-bold">{caption}</figcaption>
      {/* PC 幅 */}
      <div className="hidden overflow-x-auto rounded-lg border border-frame bg-panel sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-frame bg-raise">
              {head.map((h) => (
                <th key={h} scope="col" className="px-3 py-2 text-left font-cond text-xs font-bold whitespace-nowrap text-dim">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-rule-soft last:border-b-0">
                {r.map((c, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-3 py-2.5 text-left font-medium whitespace-nowrap">
                      {c}
                    </th>
                  ) : (
                    <td key={j} className="px-3 py-2.5 align-top">
                      {c}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* スマホ幅: 1行＝1枚 */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((r, i) => (
          <li key={i} className="rounded-lg border border-frame bg-panel px-3.5 py-3 text-sm">
            <p className="mb-1.5 font-cond font-bold">{r[0]}</p>
            <dl className="space-y-1">
              {r.slice(1).map((c, j) => (
                <div key={j} className="grid grid-cols-[7.5rem_1fr] gap-2">
                  <dt className="text-xs text-dim">{head[j + 1]}</dt>
                  <dd>{c}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {note && <p className="mt-2 text-xs leading-relaxed text-dim">{note}</p>}
    </figure>
  );
}
