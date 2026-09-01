import type { ReactNode } from 'react';
import type { Cpu, Gpu } from '@/lib/data';

export type ColumnDef<T> = {
  id: string;
  label: string;
  align: 'left' | 'right';
  /** ソートと背景バーに使う数値。文字列で並べる列は sortText を使う */
  numeric?: (row: T) => number;
  sortText?: (row: T) => string;
  display: (row: T) => ReactNode;
  /** ソート中にこの列の値を行の背景バーとして描くか */
  bar?: boolean;
};

const int = new Intl.NumberFormat('ja-JP');

/** 指数は小数第1位まで。100.0 のように桁を揃える */
function indexLabel(v: number): string {
  return v.toFixed(1);
}

export const gpuColumns: ColumnDef<Gpu>[] = [
  {
    id: 'name',
    label: 'モデル',
    align: 'left',
    sortText: (r) => r.name,
    display: (r) => r.name,
  },
  {
    id: 'perfIndex',
    label: '指数（推定）',
    align: 'right',
    numeric: (r) => r.perfIndex,
    display: (r) => indexLabel(r.perfIndex),
    bar: true,
  },
  {
    id: 'arch',
    label: 'アーキ',
    align: 'left',
    sortText: (r) => r.arch,
    display: (r) => r.arch,
  },
  {
    id: 'releaseYear',
    label: '発売',
    align: 'right',
    numeric: (r) => r.releaseYear,
    display: (r) => String(r.releaseYear),
  },
  {
    id: 'shaderUnits',
    label: 'シェーダー',
    align: 'right',
    numeric: (r) => r.shaderUnits,
    display: (r) => int.format(r.shaderUnits),
    bar: true,
  },
  {
    id: 'boostClockMhz',
    label: 'ブースト',
    align: 'right',
    numeric: (r) => r.boostClockMhz,
    display: (r) => `${int.format(r.boostClockMhz)} MHz`,
    bar: true,
  },
  {
    id: 'vramGb',
    label: 'VRAM',
    align: 'right',
    numeric: (r) => r.vramGb,
    display: (r) => `${r.vramGb} GB`,
    bar: true,
  },
  {
    id: 'bandwidthGbs',
    label: '帯域幅',
    align: 'right',
    numeric: (r) => r.bandwidthGbs,
    display: (r) => `${int.format(r.bandwidthGbs)} GB/s`,
    bar: true,
  },
  {
    id: 'tdpW',
    label: 'TDP',
    align: 'right',
    numeric: (r) => r.tdpW,
    display: (r) => `${r.tdpW} W`,
    bar: true,
  },
];

export const cpuColumns: ColumnDef<Cpu>[] = [
  {
    id: 'name',
    label: 'モデル',
    align: 'left',
    sortText: (r) => r.name,
    display: (r) => r.name,
  },
  {
    id: 'perfIndex',
    label: '指数（推定）',
    align: 'right',
    numeric: (r) => r.perfIndex,
    display: (r) => indexLabel(r.perfIndex),
    bar: true,
  },
  {
    id: 'arch',
    label: 'アーキ',
    align: 'left',
    sortText: (r) => r.arch,
    display: (r) => r.arch,
  },
  {
    id: 'releaseYear',
    label: '発売',
    align: 'right',
    numeric: (r) => r.releaseYear,
    display: (r) => String(r.releaseYear),
  },
  {
    id: 'cores',
    label: 'コア',
    align: 'right',
    numeric: (r) => r.cores,
    display: (r) => String(r.cores),
    bar: true,
  },
  {
    id: 'threads',
    label: 'スレッド',
    align: 'right',
    numeric: (r) => r.threads,
    display: (r) => String(r.threads),
    bar: true,
  },
  {
    id: 'boostClockGhz',
    label: 'ブースト',
    align: 'right',
    numeric: (r) => r.boostClockGhz,
    display: (r) => `${r.boostClockGhz.toFixed(1)} GHz`,
    bar: true,
  },
  {
    id: 'l3CacheMb',
    label: 'L3',
    align: 'right',
    numeric: (r) => r.l3CacheMb,
    display: (r) => `${r.l3CacheMb} MB`,
    bar: true,
  },
  {
    id: 'tdpW',
    label: 'TDP',
    align: 'right',
    numeric: (r) => r.tdpW,
    display: (r) => `${r.tdpW} W`,
    bar: true,
  },
];

/** 行を展開したときに出る詳細。比較モーダルでも同じ並びを使う */
export type DetailRow = [label: string, value: string];

export function gpuDetail(r: Gpu): DetailRow[] {
  return [
    ['指数（推定）', indexLabel(r.perfIndex)],
    ['Valorant 4K全て高（推定fps）', `${r.fpsValorant4kHigh.toFixed(1)} fps`],
    ['アーキテクチャ', r.arch],
    ['発売年', String(r.releaseYear)],
    ['シェーダーユニット', int.format(r.shaderUnits)],
    ['ブーストクロック', `${int.format(r.boostClockMhz)} MHz`],
    ['VRAM', `${r.vramGb} GB ${r.memType}`],
    ['メモリバス', `${r.busWidthBit} bit`],
    ['メモリ速度', `${r.memSpeedGbps} Gbps`],
    ['メモリ帯域幅', `${int.format(r.bandwidthGbs)} GB/s`],
    ['TDP', `${r.tdpW} W`],
    ['Infinity Cache / L2', r.infinityCacheMb ? `${r.infinityCacheMb} MB` : '—'],
  ];
}

export function cpuDetail(r: Cpu): DetailRow[] {
  return [
    ['指数（推定）', indexLabel(r.perfIndex)],
    ['Valorant CPU天井（推定fps）', `${r.fpsValorantCeiling.toFixed(1)} fps`],
    ['アーキテクチャ', r.arch],
    ['発売年', String(r.releaseYear)],
    ['コア / スレッド', `${r.cores} / ${r.threads}`],
    ['ベースクロック', `${r.baseClockGhz.toFixed(1)} GHz`],
    ['ブーストクロック', `${r.boostClockGhz.toFixed(1)} GHz`],
    ['L3キャッシュ', `${r.l3CacheMb} MB`],
    ['L2キャッシュ', `${r.l2CacheMb} MB`],
    ['TDP', `${r.tdpW} W`],
    ['ソケット', r.socket],
    ['対応メモリ', r.memSupport],
    ['3D V-Cache', r.has3dVCache ? '搭載' : '—'],
  ];
}
