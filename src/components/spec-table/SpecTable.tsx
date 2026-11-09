'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef, DetailRow } from './columns';
import { specStatus } from '@/components/model/DataStatus';
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
  /** 性能指数。比較モーダルで「何倍か」を出すのに使う */
  getIndex: (row: T) => number;
  /** 発売年。年での絞り込みに使う（データは年だけを持つ） */
  getYear: (row: T) => number;
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
  getIndex,
  getYear,
  badge,
  getHref,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState<string | null>(null);
  const [arch, setArch] = useState<string | null>(null);
  // 発売年の絞り込み（2026-11-09 段階5）。'' はすべて
  const [year, setYear] = useState('');
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
  const years = useMemo(
    () => Array.from(new Set(rows.map(getYear))).sort((a, b) => b - a),
    [rows, getYear],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (q && !getName(r).toLowerCase().includes(q)) return false;
      if (vendor && getVendor(r) !== vendor) return false;
      if (arch && getArch(r) !== arch) return false;
      if (year && getYear(r) !== Number(year)) return false;
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
  }, [rows, query, vendor, arch, year, sortId, dir, columns, getName, getVendor, getArch, getYear]);

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

  // 並べ替えの選択肢（2026-11-09 段階5）。列の見出しを押しても同じように並び替わる。
  // 「発売が新しい順」は列の見出しからもできたが、気づかれにくかったので選択肢として出す
  const SORTS: { key: string; label: string; id: string; dir: 'asc' | 'desc' }[] = [
    { key: 'perfIndex-desc', label: '性能指数が高い順', id: 'perfIndex', dir: 'desc' },
    { key: 'perfIndex-asc', label: '性能指数が低い順', id: 'perfIndex', dir: 'asc' },
    { key: 'releaseYear-desc', label: '発売が新しい順', id: 'releaseYear', dir: 'desc' },
    { key: 'releaseYear-asc', label: '発売が古い順', id: 'releaseYear', dir: 'asc' },
    { key: 'name-asc', label: 'モデル名順', id: 'name', dir: 'asc' },
  ];
  const sortKey = SORTS.find((x) => x.id === sortId && x.dir === dir)?.key ?? '';
  const filtered = query !== '' || vendor !== null || arch !== null || year !== '';

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
      {/* 検索・絞り込み・並べ替え */}
      <div className="space-y-3 rounded-lg border border-frame bg-panel p-3 sm:p-4" data-filters>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="モデル名で検索"
            aria-label="モデル名で検索"
            className="min-h-10 rounded-lg w-full border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <label className="flex items-center gap-2 text-xs text-dim">
            <span className="shrink-0">発売年</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              aria-label="発売年で絞り込む"
              className="min-h-10 w-full cursor-pointer rounded-lg border border-rule bg-paper px-2 py-2 text-sm text-ink outline-none focus:border-accent sm:w-auto"
            >
              <option value="">すべて</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-dim">
            <span className="shrink-0">並べ替え</span>
            <select
              value={sortKey}
              onChange={(e) => {
                const s = SORTS.find((x) => x.key === e.target.value);
                if (s) {
                  setSortId(s.id);
                  setDir(s.dir);
                }
              }}
              aria-label="並べ替え"
              className="min-h-10 w-full cursor-pointer rounded-lg border border-rule bg-paper px-2 py-2 text-sm text-ink outline-none focus:border-accent sm:w-auto"
            >
              {sortKey === '' && <option value="">表の見出しで並べ替え中</option>}
              {SORTS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterChips label="メーカー" values={vendors} active={vendor} onChange={setVendor} />
          <FilterChips label="アーキ" values={arches} active={arch} onChange={setArch} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-xs text-dim" aria-live="polite">
            {visible.length} / {rows.length} 件
          </p>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setVendor(null);
                setArch(null);
                setYear('');
              }}
              className="cursor-pointer rounded-md border border-rule px-2.5 py-1 text-xs text-dim hover:border-accent hover:text-ink"
            >
              絞り込みを解除
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 md:overflow-x-auto">
        <table className="spec-table w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-frame">
              <th
                scope="col"
                className="w-10 px-1 py-2 text-left font-cond text-[10px] font-semibold text-dim"
              >
                比較
              </th>
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
                スペック確認
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
                    // 設計意図: ソート中の列の値を、行の幅を目盛りにした棒で見せる。
                    // 行の幅いっぱいを使うので、指数の低いモデルでも差が見て取れる。
                    // 明るい地では背景全体を塗ると表が読みにくくなるため、
                    // 行の下端に細い棒として引く（2026-09-22 のデザインの作り直しで変更）。
                    style={
                      barCol
                        ? {
                            backgroundImage: `linear-gradient(to right, var(--accent-vivid) ${barWidth}%, transparent ${barWidth}%)`,
                            backgroundSize: '100% 3px',
                            backgroundPosition: 'left bottom',
                            backgroundRepeat: 'no-repeat',
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
                              {/*
                                主の動線はモデル名＝個別ページ。
                                その場でスペックを見たいときだけ隣の ▾ を使う。
                              */}
                              {getHref ? (
                                <Link
                                  href={getHref(r)}
                                  className="text-left font-medium hover:text-accent hover:underline"
                                >
                                  {c.display(r)}
                                </Link>
                              ) : (
                                <span className="font-medium">{c.display(r)}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setOpenName(isOpen ? null : name)}
                                aria-expanded={isOpen}
                                aria-label={`${name} のスペックをこの場で開く`}
                                className="cursor-pointer rounded-md border border-rule px-1.5 font-mono text-[10px] leading-tight text-dim hover:border-accent hover:text-ink"
                              >
                                {isOpen ? '▴' : '▾'}
                              </button>
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

                    <td data-label="スペック確認" className="px-2 py-2 text-left">
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
                            指数と推定fpsは、実測した基準機1台からの外挿による推定値です（誤差 ±15〜20%）。近接したモデル同士の順位は信用できません。スペックの確認: {specStatus(getVerified(r)).label}／クロックはリファレンス仕様値です。
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

      {/*
        比較トレイ。**0件のときも出す。**
        選ぶまで隠していると、機能があること自体に気づけないため。
      */}
      <div className="sticky bottom-0 z-10 mt-4 border-t border-frame bg-panel/95 py-3 backdrop-blur">
        {picked.length === 0 ? (
          <p className="text-xs text-dim">
            <span aria-hidden className="mr-1.5 text-accent">
              ☑
            </span>
            行の左にチェックを入れると、
            <strong className="font-medium text-ink">性能が何倍違うか</strong>
            を比べられます（最大 {MAX_COMPARE} 件）。
          </p>
        ) : (
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
              className="ml-auto cursor-pointer rounded-md border border-rule px-3 py-1.5 text-xs hover:border-accent"
            >
              全て解除
            </button>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              disabled={picked.length < 2}
              className="cursor-pointer rounded-md border border-accent-vivid bg-accent-vivid px-3 py-1.5 text-xs
                         font-medium text-on-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              比較する
            </button>
          </div>
        )}
      </div>

      {compareOpen && (
        <CompareDialog
          rows={pickedRows}
          detail={detail}
          getName={getName}
          getArch={getArch}
          getIndex={getIndex}
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
            className={`min-h-8 cursor-pointer rounded-md border px-2 py-1 text-xs whitespace-nowrap ${
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule text-dim hover:border-accent hover:text-ink'
            }`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}
