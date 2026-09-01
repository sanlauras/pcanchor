// スペックデータの入口。アプリからはこのファイル経由で読む。
//
// 中身は data/*.csv からビルド前に生成されている（scripts/build-data.mts）。
// 実行時にCSVは読まない。データを直したいときは data/*.csv を編集する。

export type {
  Gpu,
  GpuVendor,
  GpuArch,
  Cpu,
  CpuVendor,
  CpuArch,
} from './types';

export { gpus } from './generated/gpus';
export { cpus } from './generated/cpus';
