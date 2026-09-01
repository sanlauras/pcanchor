/**
 * data/*.csv を読み、検証して src/lib/data/generated/*.ts を生成する。
 *
 * このスクリプトはビルド前（prebuild / predev）にだけ動く。
 * アプリ側は生成物を import するだけで、実行時にCSVは読まない。
 *
 * 実行: npm run data:build
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Gpu,
  Cpu,
  GpuVendor,
  GpuArch,
  CpuVendor,
  CpuArch,
} from '../src/lib/data/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');
const OUT_DIR = join(ROOT, 'src', 'lib', 'data', 'generated');

/** CLAUDE.md / CONTEXT.md に記載されている件数。ズレたら警告する */
const DOCUMENTED_COUNTS = { gpu: 78, cpu: 42 };

const GPU_VENDORS: GpuVendor[] = ['NVIDIA', 'AMD'];
const GPU_ARCHES: GpuArch[] = [
  'Pascal', 'Turing', 'Ampere', 'Ada', 'Blackwell',
  'RDNA', 'RDNA2', 'RDNA3', 'RDNA4',
];
const CPU_VENDORS: CpuVendor[] = ['AMD', 'Intel'];
const CPU_ARCHES: CpuArch[] = [
  'Zen 3', 'Zen 4', 'Zen 5',
  'Comet Lake', 'Rocket Lake', 'Alder Lake',
  'Raptor Lake', 'Raptor Lake-R', 'Arrow Lake',
];

// ---------------------------------------------------------------- エラー収集

/** 見つかった問題を全部ためてから、まとめて報告する（1件目で止めない） */
const errors: string[] = [];
const warnings: string[] = [];

function fail(file: string, line: number | null, message: string): void {
  const where = line === null ? file : `${file}:${line}`;
  errors.push(`${where}  ${message}`);
}

// -------------------------------------------------------------------- CSV

type Row = {
  /** CSVの行番号（1始まり、ヘッダー行込み）。エラー表示に使う */
  lineNo: number;
  values: Record<string, string>;
};

/**
 * 最小限のCSV読み込み。
 * data/*.csv には引用符が1つも無く、カンマを含むフィールドも無いことを
 * 確認済みなので、単純なカンマ分割でよい。
 * その前提が崩れた場合（引用符の出現・列数のズレ）は必ずエラーで止める。
 */
function readCsv(fileName: string, expectedHeader: string[]): Row[] {
  const path = join(DATA_DIR, fileName);
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);

  const headerLine = lines[0] ?? '';
  const header = headerLine.split(',');

  if (header.length !== expectedHeader.length ||
      header.some((h, i) => h !== expectedHeader[i])) {
    fail(fileName, 1,
      `ヘッダーが期待と違う\n    期待: ${expectedHeader.join(',')}\n    実際: ${headerLine}`);
    return [];
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const lineNo = i + 1;
    if (raw === undefined || raw.trim() === '') continue;

    if (raw.includes('"')) {
      fail(fileName, lineNo,
        '引用符を含む行がある。カンマ入りのフィールドが追加された場合、' +
        'この簡易パーサーでは正しく読めない。パーサーを見直すこと');
      continue;
    }

    const values = raw.split(',');
    if (values.length !== header.length) {
      fail(fileName, lineNo,
        `列数が合わない（ヘッダー ${header.length} 列に対して ${values.length} 列）`);
      continue;
    }

    const record: Record<string, string> = {};
    header.forEach((key, idx) => { record[key] = (values[idx] ?? '').trim(); });
    rows.push({ lineNo, values: record });
  }

  if (rows.length === 0) fail(fileName, null, 'データ行が1件も無い');
  return rows;
}

// ------------------------------------------------------------------ 値の変換

function num(fileName: string, row: Row, key: string): number {
  const raw = row.values[key] ?? '';
  if (raw === '') {
    fail(fileName, row.lineNo, `${key} が空。数値が必要`);
    return Number.NaN;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    fail(fileName, row.lineNo, `${key} が数値として読めない: ${JSON.stringify(raw)}`);
    return Number.NaN;
  }
  return n;
}

function str(fileName: string, row: Row, key: string): string {
  const raw = row.values[key] ?? '';
  if (raw === '') fail(fileName, row.lineNo, `${key} が空`);
  return raw;
}

function oneOf<T extends string>(
  fileName: string, row: Row, key: string, allowed: readonly T[],
): T {
  const raw = row.values[key] ?? '';
  if (!(allowed as readonly string[]).includes(raw)) {
    fail(fileName, row.lineNo,
      `${key} が想定外の値: ${JSON.stringify(raw)}\n    ` +
      `許可: ${allowed.join(' / ')}\n    ` +
      `新しい値を足すなら src/lib/data/types.ts の型も更新すること`);
  }
  return raw as T;
}

function yesNo(fileName: string, row: Row, key: string): boolean {
  const raw = row.values[key] ?? '';
  if (raw !== 'Y' && raw !== 'N') {
    fail(fileName, row.lineNo, `${key} は Y か N のはずだが ${JSON.stringify(raw)}`);
  }
  return raw === 'Y';
}

// ---------------------------------------------------------------- slug

/**
 * モデル名から URL 用の識別子を作る。
 *   GeForce RTX 4060 Ti 16GB  ->  geforce-rtx-4060-ti-16gb
 *   GeForce GTX 1650 (GDDR6)  ->  geforce-gtx-1650-gddr6
 * 英数字以外を区切りにして小文字化するだけ。規則を変えると既存URLが壊れる。
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** slug が重複するとページが上書きされてしまうので、必ず落とす */
function checkSlugCollisions(fileName: string, names: string[]): void {
  const bySlug = new Map<string, string[]>();
  for (const name of names) {
    const slug = toSlug(name);
    if (slug === '') {
      fail(fileName, null, `slug が空になるモデル名: ${JSON.stringify(name)}`);
      continue;
    }
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), name]);
  }
  for (const [slug, owners] of bySlug) {
    if (owners.length > 1) {
      fail(fileName, null,
        `slug が重複: ${slug}
    該当: ${owners.join(' / ')}
    ` +
        `URLが衝突してページが上書きされる。モデル名を見直すこと`);
    }
  }
}

// ------------------------------------------------------------------ 結合と検証

function checkNoDuplicates(fileName: string, rows: Row[], key: string): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const name = row.values[key] ?? '';
    const first = seen.get(name);
    if (first !== undefined) {
      fail(fileName, row.lineNo, `モデル名が重複: ${name}（${first} 行目にも同じ名前がある）`);
    } else {
      seen.set(name, row.lineNo);
    }
  }
}

/**
 * spec と index をモデル名で突き合わせる。
 * どちらか片方にしか無い行があれば、名前を挙げてエラーにする（黙って捨てない）。
 */
function joinByName(
  specFile: string, specRows: Row[],
  indexFile: string, indexRows: Row[],
  key: string,
): Map<string, { spec: Row; index: Row }> {
  const indexByName = new Map(indexRows.map((r) => [r.values[key] ?? '', r]));
  const joined = new Map<string, { spec: Row; index: Row }>();

  for (const spec of specRows) {
    const name = spec.values[key] ?? '';
    const index = indexByName.get(name);
    if (index === undefined) {
      fail(specFile, spec.lineNo, `${indexFile} に対応する行が無い: ${name}`);
      continue;
    }
    joined.set(name, { spec, index });
    indexByName.delete(name);
  }

  for (const [name, row] of indexByName) {
    fail(indexFile, row.lineNo, `${specFile} に対応する行が無い: ${name}`);
  }

  return joined;
}

/**
 * spec と index の両方に載っている列の値が一致しているか確認する。
 * index CSV は spec CSV から生成されたものなので本来は必ず一致する。
 * 片方だけを手で編集した場合に、ここで気づける。
 */
function checkSharedColumns(
  specFile: string, indexFile: string,
  joined: Map<string, { spec: Row; index: Row }>,
  columns: string[],
): void {
  for (const [name, { spec, index }] of joined) {
    for (const col of columns) {
      const a = spec.values[col] ?? '';
      const b = index.values[col] ?? '';
      // 数値列は 16 と 16.0 のような表記違いを同一とみなす
      const bothNumeric = a !== '' && b !== '' &&
        Number.isFinite(Number(a)) && Number.isFinite(Number(b));
      const same = bothNumeric ? Number(a) === Number(b) : a === b;
      if (!same) {
        fail(specFile, spec.lineNo,
          `${name} の ${col} が ${indexFile}:${index.lineNo} と食い違う: ` +
          `${JSON.stringify(a)} / ${JSON.stringify(b)}\n    ` +
          `どちらか片方だけを編集した可能性がある。` +
          `spec を直したなら data/make_index.py を再実行すること`);
      }
    }
  }
}

function checkRankSequence(indexFile: string, rows: Row[]): void {
  const ranks = rows.map((r) => Number(r.values['rank']));
  const sorted = [...ranks].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      fail(indexFile, null,
        `rank が 1..${sorted.length} の連番になっていない（${i + 1} が見つからない）`);
      return;
    }
  }
}

// ---------------------------------------------------------------- 生成物の出力

function emit(fileName: string, typeName: string, varName: string, items: unknown[]): void {
  const body = items.map((item) => '  ' + JSON.stringify(item)).join(',\n');

  const source = `// 自動生成。直接編集しないこと。
// data/*.csv を編集して \`npm run data:build\` を実行すると再生成される。
// 生成元: scripts/build-data.mts

import type { ${typeName} } from '../types';

export const ${varName}: readonly ${typeName}[] = [
${body},
];
`;
  writeFileSync(join(OUT_DIR, fileName), source, 'utf8');
}

// -------------------------------------------------------------------- GPU

const GPU_SPEC_HEADER = [
  'gpu_name', 'vendor', 'arch', 'release_year', 'shader_units', 'boost_clock_mhz',
  'vram_gb', 'mem_type', 'bus_width_bit', 'mem_speed_gbps', 'bandwidth_gbs',
  'tdp_w', 'infinity_cache_mb', 'confidence', 'verified',
  'measured_fps_val', 'measured_fps_fort', 'perf_index',
];
const GPU_INDEX_HEADER = [
  'rank', 'gpu_name', 'vendor', 'arch', 'index',
  'fps_valorant_4k_high', 'vram_gb', 'bandwidth_gbs', 'tdp_w',
];

function buildGpus(): Gpu[] {
  const specFile = 'gpu_specs_draft.csv';
  const indexFile = 'gpu_index.csv';
  const specRows = readCsv(specFile, GPU_SPEC_HEADER);
  const indexRows = readCsv(indexFile, GPU_INDEX_HEADER);

  checkNoDuplicates(specFile, specRows, 'gpu_name');
  checkSlugCollisions(specFile, specRows.map((r) => r.values['gpu_name'] ?? ''));
  checkNoDuplicates(indexFile, indexRows, 'gpu_name');
  checkRankSequence(indexFile, indexRows);

  const joined = joinByName(specFile, specRows, indexFile, indexRows, 'gpu_name');
  checkSharedColumns(specFile, indexFile, joined,
    ['vendor', 'arch', 'vram_gb', 'bandwidth_gbs', 'tdp_w']);

  const gpus: Gpu[] = [];
  for (const { spec, index } of joined.values()) {
    gpus.push({
      name: str(specFile, spec, 'gpu_name'),
      slug: toSlug(str(specFile, spec, 'gpu_name')),
      vendor: oneOf(specFile, spec, 'vendor', GPU_VENDORS),
      arch: oneOf(specFile, spec, 'arch', GPU_ARCHES),
      releaseYear: num(specFile, spec, 'release_year'),
      shaderUnits: num(specFile, spec, 'shader_units'),
      boostClockMhz: num(specFile, spec, 'boost_clock_mhz'),
      vramGb: num(specFile, spec, 'vram_gb'),
      memType: str(specFile, spec, 'mem_type'),
      busWidthBit: num(specFile, spec, 'bus_width_bit'),
      memSpeedGbps: num(specFile, spec, 'mem_speed_gbps'),
      bandwidthGbs: num(specFile, spec, 'bandwidth_gbs'),
      tdpW: num(specFile, spec, 'tdp_w'),
      infinityCacheMb: num(specFile, spec, 'infinity_cache_mb'),
      verified: str(specFile, spec, 'verified'),
      rank: num(indexFile, index, 'rank'),
      perfIndex: num(indexFile, index, 'index'),
      fpsValorant4kHigh: num(indexFile, index, 'fps_valorant_4k_high'),
    });
  }
  gpus.sort((a, b) => a.rank - b.rank);
  return gpus;
}

// -------------------------------------------------------------------- CPU

const CPU_SPEC_HEADER = [
  'cpu_name', 'vendor', 'arch', 'release_year', 'cores', 'threads',
  'base_clock_ghz', 'boost_clock_ghz', 'l3_cache_mb', 'l2_cache_mb', 'tdp_w',
  'socket', 'mem_support', 'has_3d_vcache', 'confidence', 'verified',
  'measured_fps_val', 'measured_fps_fort', 'perf_index',
];
const CPU_INDEX_HEADER = [
  'rank', 'cpu_name', 'vendor', 'arch', 'index',
  'fps_valorant_ceiling', 'cores', 'l3_cache_mb', 'has_3d_vcache',
];

function buildCpus(): Cpu[] {
  const specFile = 'cpu_specs_draft.csv';
  const indexFile = 'cpu_index.csv';
  const specRows = readCsv(specFile, CPU_SPEC_HEADER);
  const indexRows = readCsv(indexFile, CPU_INDEX_HEADER);

  checkNoDuplicates(specFile, specRows, 'cpu_name');
  checkSlugCollisions(specFile, specRows.map((r) => r.values['cpu_name'] ?? ''));
  checkNoDuplicates(indexFile, indexRows, 'cpu_name');
  checkRankSequence(indexFile, indexRows);

  const joined = joinByName(specFile, specRows, indexFile, indexRows, 'cpu_name');
  checkSharedColumns(specFile, indexFile, joined,
    ['vendor', 'arch', 'cores', 'l3_cache_mb', 'has_3d_vcache']);

  const cpus: Cpu[] = [];
  for (const { spec, index } of joined.values()) {
    cpus.push({
      name: str(specFile, spec, 'cpu_name'),
      slug: toSlug(str(specFile, spec, 'cpu_name')),
      vendor: oneOf(specFile, spec, 'vendor', CPU_VENDORS),
      arch: oneOf(specFile, spec, 'arch', CPU_ARCHES),
      releaseYear: num(specFile, spec, 'release_year'),
      cores: num(specFile, spec, 'cores'),
      threads: num(specFile, spec, 'threads'),
      baseClockGhz: num(specFile, spec, 'base_clock_ghz'),
      boostClockGhz: num(specFile, spec, 'boost_clock_ghz'),
      l3CacheMb: num(specFile, spec, 'l3_cache_mb'),
      l2CacheMb: num(specFile, spec, 'l2_cache_mb'),
      tdpW: num(specFile, spec, 'tdp_w'),
      socket: str(specFile, spec, 'socket'),
      memSupport: str(specFile, spec, 'mem_support'),
      has3dVCache: yesNo(specFile, spec, 'has_3d_vcache'),
      verified: str(specFile, spec, 'verified'),
      rank: num(indexFile, index, 'rank'),
      perfIndex: num(indexFile, index, 'index'),
      fpsValorantCeiling: num(indexFile, index, 'fps_valorant_ceiling'),
    });
  }
  cpus.sort((a, b) => a.rank - b.rank);
  return cpus;
}

// -------------------------------------------------------------------- 実行

const gpus = buildGpus();
const cpus = buildCpus();

if (errors.length > 0) {
  console.error(`\ndata/*.csv に ${errors.length} 件の問題があります:\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error('\n生成物は更新していません。上記を直してから再実行してください。\n');
  process.exit(1);
}

if (gpus.length !== DOCUMENTED_COUNTS.gpu) {
  warnings.push(
    `GPU が ${gpus.length} 件。CLAUDE.md / CONTEXT.md の記載は ${DOCUMENTED_COUNTS.gpu} 件`);
}
if (cpus.length !== DOCUMENTED_COUNTS.cpu) {
  warnings.push(
    `CPU が ${cpus.length} 件。CLAUDE.md / CONTEXT.md の記載は ${DOCUMENTED_COUNTS.cpu} 件`);
}

mkdirSync(OUT_DIR, { recursive: true });
emit('gpus.ts', 'Gpu', 'gpus', gpus);
emit('cpus.ts', 'Cpu', 'cpus', cpus);

console.log(
  `データ生成: GPU ${gpus.length} 件 / CPU ${cpus.length} 件 -> src/lib/data/generated/`);
for (const w of warnings) {
  console.warn(`  警告: ${w}（ドキュメント側の更新漏れかもしれません）`);
}
