'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef, DetailRow } from './columns';
import { VerifiedTag } from './VerifiedTag';
import { CompareDialog } from './CompareDialog';

const MAX_COMPARE = 3;

type Props<T> = {
  rows: readonly T[];
  columns: ColumnDef<T>[];
  detail: (row: T) => DetailRow[];
  getName: (row: T) => string;
  getVendor: (row: T) => string;
  getArch: (row: T) => string;
  getVerified: (row: T) => string;
  /** 名前の横に出す小さな印（3D V-Cache など）。不要なら null を返す */
  badge?: (row: T) => string | null;
  /** 個別ページへのURL。あればモデル名をリンクにする */
  getHref?: (row: T) => string;
};

export function SpecTable<T>({
  rows,
  columns,
  detail,
  getName,
  getVendor,
  getArch,
  getVerified,
  badge,
  getHref,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState<string | null>(null);
  const [arch, setArch] = useState<string | null>(null);
  // 既定は指数の降順。開いた時点でバーが出て、操作と表示の連動が分かる
  const [sortId, setSortId] = useState('perfIndex');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [openName, setOpenName] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const vendors = useMemo(
    () => Array.from(new Set(rows.map(getVendor))),
    [rows, getVendor],
  );
  const arches = useMemo(
    () => Array.from(new Set(rows.map(getArch))),
    [rows, getArch],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (q && !getName(r).toLowerCase().includes(q)) return false;
      if (vendor && getVendor(r) !== vendor) return false;
      if (arch && getArch(r) !== arch) return false;
      return true;
    });

    const col = columns.find((c) => c.id === sortId);
    if (!col) return filtered;

    const sign = dir === 'asc' ? 1 : -1;
    const { numeric, sortText } = col;
    return [...filtered].sort((a, b) => {
      if (numeric) return (numeric(a) - numeric(b)) * sign;
      if (sortText) return sortText(a).localeCompare(sortText(b), 'ja') * sign;
      return 0;
    });
  }, [rows, query, vendor, arch, sortId, dir, columns, getName, getVendor, getArch]);

  // 設計意図: ソート中の列が数値なら、その値を行の背景バーとして可視化する
  const sortCol = columns.find((c) => c.id === sortId);
  const barCol = sortCol?.bar && sortCol.numeric ? sortCol : null;
  const barMax =
    barCol && visible.length > 0
      ? Math.max(...visible.map((r) => barCol.numeric!(r)))
      : 0;

  const pickedRows = picked
    .map((name) => rows.find((r) => getName(r) === name))
    .filter((r): r is T => r !== undefined);

  function toggleSort(col: ColumnDef<T>) {
    if (col.id === sortId) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortId(col.id);
      setDir(col.numeric ? 'desc' : 'asc');
    }
  }

  function togglePick(name: string) {
    setPicked((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, name],
    );
  }

  return (
    <>
      {/* 検索と絞り込み */}
      <div className="flex flex-wrap items-center gap-3 py-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="モデル名で検索"
          aria-label="モデル名で検索"
          className="w-full max-w-xs border border-rule bg-panel px-3 py-2 text-sm
                     outline-none focus:border-accent sm:w-64"
        />
        <FilterChips label="メーカー" values={vendors} active={vendor} onChange={setVendor} />
        <FilterChips label="アーキ" values={arches} active={arch} onChange={setArch} />
        <p className="ml-auto font-mono text-xs text-dim">
          {visible.length} / {rows.length} 件
        </p>
      </div>

      <div className="md:overflow-x-auto">
        <table className="spec-table w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-ink">
              <th className="w-8" />
              {columns.map((c) => {
                const active = c.id === sortId;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={
                      active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                    className={`px-2 py-2 font-cond text-xs font-semibold whitespace-nowrap ${
                      c.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c)}
                      className={`cursor-pointer hover:text-ink ${
                        active ? 'text-accent' : 'text-dim'
                      }`}
                    >
                      {c.label}
                      <span aria-hidden className="ml-1 font-mono text-[10px]">
                        {active ? (dir === 'asc' ? '▲' : '▼') : '　'}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th
                scope="col"
                className="px-2 py-2 text-left font-cond text-xs font-semibold text-dim whitespace-nowrap"
              >
                検証
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map((r) => {
              const name = getName(r);
              const isOpen = openName === name;
              const isPicked = picked.includes(name);
              const barWidth =
                barCol && barMax > 0 ? (barCol.numeric!(r) / barMax) * 100 : 0;
              const mark = badge?.(r) ?? null;

              return (
                <FragmentRow key={name}>
                  <tr
                    className="spec-row border-b border-rule-soft hover:bg-accent-soft"
                    data-open={isOpen ? 1 : 0}
                    // 設計意図: ソート中の列の値を行の背景バーとして可視化する。
                    // 行の幅いっぱいを使うので、指数の低いモデルでも差が見て取れる。
                    style={
                      barCol
                        ? {
                            backgroundImage: `linear-gradient(to right, var(--accent-bar) ${barWidth}%, transparent ${barWidth}%)`,
                          }
                        : undefined
                    }
                  >
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="checkbox"
                        checked={isPicked}
                        onChange={() => togglePick(name)}
                        disabled={!isPicked && picked.length >= MAX_COMPARE}
                        aria-label={`${name} を比較に追加`}
                        className="cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-30"
                      />
                    </td>

                    {columns.map((c, ci) => {
                      if (ci === 0) {
                        return (
                          <td key={c.id} className="spec-name-cell px-2 py-2 text-left">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="border border-rule px-1 font-mono text-[10px] text-dim">
                                {getVendor(r)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setOpenName(isOpen ? null : name)}
                                aria-expanded={isOpen}
                                className="cursor-pointer text-left font-medium hover:text-accent"
                              >
                                {c.display(r)}
                              </button>
                              {getHref && (
                                <a
                                  href={getHref(r)}
                                  className="font-mono text-[10px] text-dim underline hover:text-accent"
                                >
                                  詳細
                                </a>
                              )}
                              {mark && (
                                <span className="border border-accent/40 px-1 font-mono text-[10px] text-accent">
                                  {mark}
                                </span>
                              )}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={c.id}
                          data-label={c.label}
                          className={`px-2 py-2 whitespace-nowrap ${
                            c.align === 'right'
                              ? 'text-right font-mono tabular-nums'
                              : 'text-left'
                          } ${c.id === 'perfIndex' ? 'font-semibold text-ink' : ''}`}
                        >
                          {c.display(r)}
                        </td>
                      );
                    })}

                    <td data-label="検証" className="px-2 py-2 text-left">
                      <VerifiedTag verified={getVerified(r)} />
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="spec-detail-row">
                      <td colSpan={columns.length + 2} className="bg-panel p-0">
                        {/*
                          表は横スクロールするため、詳細をそのまま置くと
                          画面外にはみ出して見切れる。左端に貼り付けたうえで
                          画面幅を超えないようにしている。
                        */}
                        <div className="sticky left-0 max-w-[calc(100vw-2.5rem)] px-4 py-4">
                          <dl className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                            {detail(r).map(([label, value]) => (
                              <div
                                key={label}
                                className="flex items-baseline justify-between gap-3 border-b border-rule-soft py-1"
                              >
                                <dt className="min-w-0 text-xs text-dim">{label}</dt>
                                <dd className="shrink-0 font-mono text-xs tabular-nums">
                                  {value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <p className="mt-3 max-w-[80ch] text-xs text-dim">
                            指数と推定fpsは実測1構成からの外挿による推定値です（誤差 ±15〜20%）。
                            近接したモデル同士の順位は信用できません。
                            検証状態: {getVerified(r)}／クロックはリファレンス仕様値です。
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <p className="border-b border-rule-soft py-10 text-center text-sm text-dim">
            条件に合うモデルがありません。
          </p>
        )}
      </div>

      {/* 比較トレイ */}
      {picked.length > 0 && (
        <div className="sticky bottom-0 z-10 mt-4 border-t border-ink bg-panel/95 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {picked.map((name) => (
              <span
                key={name}
                className="flex items-center gap-2 border border-rule px-2 py-1 text-xs"
              >
                {name}
                <button
                  type="button"
                  onClick={() => togglePick(name)}
                  aria-label={`${name} を比較から外す`}
                  className="cursor-pointer text-dim hover:text-ink"
                >
                  ×
                </button>
              </span>
            ))}
            <span className="font-mono text-xs text-dim">
              {picked.length} / {MAX_COMPARE}
            </span>
            <button
              type="button"
              onClick={() => setPicked([])}
              className="ml-auto cursor-pointer border border-rule px-3 py-1.5 text-xs hover:border-ink"
            >
              全て解除
            </button>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              disabled={picked.length < 2}
              className="cursor-pointer border border-accent bg-accent px-3 py-1.5 text-xs
                         font-medium text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              比較する
            </button>
          </div>
        </div>
      )}

      {compareOpen && (
        <CompareDialog
          rows={pickedRows}
          detail={detail}
          getName={getName}
          onClose={() => setCompareOpen(false)}
        />
      )}
    </>
  );
}

/** tbody の直下に2つの tr を並べるためだけのラッパー */
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function FilterChips({
  label,
  values,
  active,
  onChange,
}: {
  label: string;
  values: string[];
  active: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] tracking-wider text-dim uppercase">
        {label}
      </span>
      {values.map((v) => {
        const on = active === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : v)}
            className={`cursor-pointer border px-2 py-1 text-xs whitespace-nowrap ${
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule text-dim hover:border-ink hover:text-ink'
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
