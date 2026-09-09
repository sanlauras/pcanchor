'use client';

import { useEffect } from 'react';
import { rankByIndex } from '@/lib/compare';
import type { DetailRow } from './columns';

type Props<T> = {
  rows: T[];
  detail: (row: T) => DetailRow[];
  getName: (row: T) => string;
  getArch: (row: T) => string;
  getIndex: (row: T) => number;
  onClose: () => void;
};

export function CompareDialog<T>({
  rows,
  detail,
  getName,
  getArch,
  getIndex,
  onClose,
}: Props<T>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 指数の低い順を基準(1.0)にして倍率を出す。判定は src/lib/compare.ts にある。
  // 差が誤差に埋もれる組み合わせでは、そもそも倍率が返ってこない。
  const ranked = rankByIndex(
    rows.map((r) => ({ name: getName(r), index: getIndex(r), arch: getArch(r) })),
  );
  const anySimilar = ranked.some((m) => m.vsBaseline?.kind === 'similar');
  const anyCrossArch = ranked.some((m) => m.vsBaseline?.sameArch === false);

  // 項目の並びは全モデルで共通なので、先頭のモデルからラベルを取る
  const labels = rows.length > 0 ? detail(rows[0]!).map(([label]) => label) : [];
  const byModel = rows.map((r) => new Map(detail(r)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="スペック比較"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto
                 bg-paper/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl border border-rule bg-panel p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-cond text-xl font-bold">スペック比較</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border border-rule px-3 py-1.5 text-xs hover:border-ink"
          >
            閉じる
          </button>
        </div>

        {/*
          「何倍か」を表の上に大きく出す。
          スペックの数字を1つずつ見比べなくても差が分かるようにするのが目的。
        */}
        <section className="mb-5 border border-accent bg-accent-soft p-4">
          <h3 className="font-mono text-[10px] tracking-wider text-dim uppercase">
            性能の差（指数の比）
          </h3>
          <dl className="mt-2.5 space-y-2">
            {ranked.map((m) => (
              <div
                key={m.name}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1
                           border-b border-accent/20 pb-2 last:border-0 last:pb-0"
              >
                <dt className="font-cond font-bold text-ink">{m.name}</dt>
                <dd className="font-mono tabular-nums">
                  {m.vsBaseline === null ? (
                    <span className="text-sm text-dim">基準</span>
                  ) : m.vsBaseline.kind === 'ratio' ? (
                    <span className="text-2xl font-semibold text-accent">
                      約 {m.vsBaseline.ratio.toFixed(1)} 倍
                    </span>
                  ) : (
                    <span className="text-lg font-semibold text-ink">
                      ほぼ同等
                      <span className="ml-2 text-xs font-normal text-dim">
                        差 {Math.abs(m.vsBaseline.diffPct).toFixed(1)}%
                      </span>
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 space-y-1 border-t border-accent/25 pt-3 text-xs text-dim">
            <p>指数どうしの比です。推定値・誤差 ±15〜20%。</p>
            {anySimilar && (
              <p>
                <strong className="font-medium text-ink">「ほぼ同等」</strong>
                は差が誤差に埋もれて、どちらが速いか言えない状態です。
                数字を出すと嘘になるので出していません。
              </p>
            )}
            {anyCrossArch && (
              <p>
                アーキテクチャが違う組み合わせが含まれます。
                指数はアーキごとに係数を1つしか持たないため、
                差が小さいと実際には順位が入れ替わることがあります。
              </p>
            )}
          </div>
        </section>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="px-2 py-2 text-left font-cond text-xs">
                  項目
                </th>
                {rows.map((r) => (
                  <th
                    key={getName(r)}
                    scope="col"
                    className="px-2 py-2 text-left font-cond text-xs whitespace-nowrap"
                  >
                    {getName(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr key={label} className="border-b border-rule-soft">
                  <th
                    scope="row"
                    className="px-2 py-1.5 text-left text-xs font-normal text-dim"
                  >
                    {label}
                  </th>
                  {byModel.map((map, i) => (
                    <td
                      key={i}
                      className="px-2 py-1.5 font-mono text-xs tabular-nums whitespace-nowrap"
                    >
                      {map.get(label) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-dim">
          スペックはメーカー公式値です。指数と推定fpsだけが自前の計算による推定値です。
        </p>
      </div>
    </div>
  );
}
