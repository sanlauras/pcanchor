/*
 * 表（2026-10-13 にブログ用に作り、2026-11-09 の全面再設計で共通の部品にした）。
 */

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
