'use client';

import { useEffect } from 'react';
import type { DetailRow } from './columns';

type Props<T> = {
  rows: T[];
  detail: (row: T) => DetailRow[];
  getName: (row: T) => string;
  onClose: () => void;
};

export function CompareDialog<T>({ rows, detail, getName, onClose }: Props<T>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          指数と推定fpsは推定値です（誤差 ±15〜20%）。
          <strong className="font-semibold text-ink">
            指数が数%しか違わないモデル同士は、この表の順序が入れ替わる可能性があります。
          </strong>
        </p>
      </div>
    </div>
  );
}
