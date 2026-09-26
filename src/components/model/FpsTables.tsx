import Link from 'next/link';
import type { GameFpsTable } from '@/lib/fps/table';
import { RESOLUTIONS } from '@/lib/fps/model';

const BOTTLENECK_LABEL: Record<string, string> = {
  gpu: 'GPU律速',
  cpu: 'CPU律速',
  balanced: '拮抗',
};

/**
 * ゲーム別の推定fps表。個別モデルページの主役。
 * fpsツールと同じ predict() を通しているので、値はページ間で一致する。
 *
 * ゲーム名はそのゲームのページへのリンクにし、各表に #apex のような目印（id）を付けている。
 * GPU・CPU・ゲームのページを互いにつなぐため（2026-09-26 の SEO 改善）。
 * ゲームページからは /gpu/xxx#apex のように、該当の表へ直接飛べる。
 */
export function FpsTables({
  tables,
  cpuName,
}: {
  tables: GameFpsTable[];
  cpuName: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 font-cond text-xl font-bold">ゲーム別の推定fps</h2>
      <p className="mb-4 max-w-[70ch] text-xs text-dim">
        CPUに {cpuName} を組み合わせた場合の平均fpsです。推定値・誤差 ±15〜20%。括弧内は、そのときGPUとCPUのどちらが上限を決めているかを示します。
      </p>

      <div className="space-y-7">
        {tables.map((t) => (
          <div key={t.gameId} id={t.gameId} className="scroll-mt-[calc(var(--header-h)+1rem)]">
            <h3 className="mb-2 flex flex-wrap items-baseline gap-x-3 font-cond text-lg font-bold">
              <Link href={`/games/${t.gameId}`} className="underline decoration-rule underline-offset-4 hover:text-accent hover:decoration-accent">
                {t.gameName}
              </Link>
              <span className="font-mono text-[10px] font-normal text-dim">
                根拠: {t.confidenceLabel}
              </span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y border-ink">
                    <th className="px-2 py-2 text-left font-cond text-xs whitespace-nowrap">
                      画質
                    </th>
                    {RESOLUTIONS.map((r) => (
                      <th
                        key={r.id}
                        className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap"
                      >
                        {r.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((row) => (
                    <tr key={row.presetId} className="border-b border-rule-soft">
                      <th
                        scope="row"
                        className="px-2 py-2 text-left text-xs font-normal whitespace-nowrap"
                      >
                        {row.presetLabel}
                      </th>
                      {row.cells.map((c) => (
                        <td
                          key={c.resolution}
                          className="px-2 py-2 text-right whitespace-nowrap"
                        >
                          <span className="font-mono font-semibold tabular-nums">
                            {c.uncapped.toFixed(0)}
                          </span>
                          <span className="ml-1 font-mono text-[10px] text-dim">
                            ({BOTTLENECK_LABEL[c.bottleneck]}
                            {/* 数値は理論値。ゲーム側の上限で止まるときだけ上限を添える */}
                            {c.capped && t.cap !== null && `・上限${t.cap}`})
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-dim">
              {t.notes.map((n) => (
                <li key={n}>・{n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
