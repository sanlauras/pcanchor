import type { GameFpsTable } from '@/lib/fps/table';
import { RESOLUTIONS } from '@/lib/fps/model';

const BOTTLENECK_LABEL: Record<string, string> = {
  gpu: 'GPU律速',
  cpu: 'CPU律速',
  cap: 'ゲーム上限',
  balanced: '拮抗',
};

/**
 * ゲーム別の推定fps表。個別モデルページの主役。
 * fpsツールと同じ predict() を通しているので、値はページ間で一致する。
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
        CPUに {cpuName} を組み合わせた場合の平均fpsです。推定値・誤差 ±15〜20%。
        括弧内は、そのときGPUとCPUのどちらが上限を決めているかを示します。
      </p>

      <div className="space-y-7">
        {tables.map((t) => (
          <div key={t.gameId}>
            <h3 className="mb-2 flex flex-wrap items-baseline gap-x-3 font-cond text-lg font-bold">
              {t.gameName}
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
                            {c.fps.toFixed(0)}
                          </span>
                          <span className="ml-1 font-mono text-[10px] text-dim">
                            ({BOTTLENECK_LABEL[c.bottleneck]})
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
