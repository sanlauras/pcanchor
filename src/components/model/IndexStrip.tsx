/**
 * 全モデルの中での位置を示す横長の図（2026-09-27）。
 *
 * 性能指数の軸に全モデルを細い縦線で並べ、このモデルだけを太く強調する。
 * ビルド時に描く静的な SVG で、JavaScript は使わない。
 * 値は性能指数（推定・誤差±15〜20%）そのもので、新しい数字は作らない。
 */
export function IndexStrip({
  values,
  target,
  anchorValue,
  anchorLabel,
  caption,
}: {
  /** 全モデルの性能指数 */
  values: number[];
  target: number;
  /** 基準（= 100）の位置に目盛りを置く */
  anchorValue: number;
  anchorLabel: string;
  caption: string;
}) {
  const W = 600;
  const H = 58;
  const padX = 12;
  const max = Math.max(...values, anchorValue);
  // 軸は 0 から。最大値はきりのいい数に切り上げる
  const top = Math.ceil(max / 50) * 50;
  const x = (v: number) => padX + (v / top) * (W - padX * 2);
  const ticks = Array.from({ length: top / 50 + 1 }, (_, i) => i * 50);

  return (
    <figure className="max-w-[640px] border border-rule bg-panel p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={caption}
      >
        {/* 軸 */}
        <line x1={padX} x2={W - padX} y1={30} y2={30} stroke="var(--rule)" strokeWidth={1} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={30} y2={34} stroke="var(--dim)" strokeWidth={1} />
            <text x={x(t)} y={50} textAnchor="middle" fontSize={13} fill="var(--dim)" fontFamily="var(--font-plex-mono), monospace">
              {t}
            </text>
          </g>
        ))}
        {/* 全モデル */}
        {values.map((v, i) => (
          <line key={i} x1={x(v)} x2={x(v)} y1={18} y2={30} stroke="var(--dim)" strokeOpacity={0.45} strokeWidth={1.5} />
        ))}
        {/* 基準（= 100） */}
        <line x1={x(anchorValue)} x2={x(anchorValue)} y1={12} y2={30} stroke="var(--ink)" strokeDasharray="2 2" strokeWidth={1} />
        {/* このモデル */}
        <line x1={x(target)} x2={x(target)} y1={6} y2={30} stroke="var(--accent-vivid)" strokeWidth={4} />
      </svg>
      <figcaption className="mt-1 flex flex-wrap justify-between gap-x-4 font-mono text-[10px] text-dim">
        <span>
          <span aria-hidden className="mr-1 inline-block h-2.5 w-1 bg-accent-vivid align-middle" />
          このモデル {target.toFixed(1)}
        </span>
        <span>
          <span aria-hidden className="mr-1 inline-block h-2.5 w-px border-l border-dashed border-ink align-middle" />
          {anchorLabel} = {anchorValue}
        </span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
