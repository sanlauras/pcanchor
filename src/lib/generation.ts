import type { Cpu, Gpu } from '@/lib/data';

/**
 * 「新品で流通している可能性が高い世代」の判定。
 *
 * 逆引きツールは「目標を満たす最小」を出すため、放っておくと必然的に
 * 古いカードを指す（性能指数が下位30件のうち28件が2022年以前）。
 * GTX 1070 を新品で買うことはできないので、買い物の助けとしては成立しない。
 *
 * **在庫の実態は当サイトでは確認できない。** メーカーの出荷状況も流通量も
 * 持っていないため、「買える」とは言い切らず「流通している可能性が高い」に留める。
 * 判定はアーキテクチャで行う。発売年で切ると RTX 4090（2022年）のような
 * 現役モデルが落ちるため。
 *
 * **世代が変わったらここを更新すること。** 更新しないと古い判定のまま残る。
 */

/** 現行世代と1つ前の世代のGPUアーキテクチャ */
const CURRENT_GPU_ARCHS = new Set<Gpu['arch']>(['Blackwell', 'RDNA4', 'Ada', 'RDNA3']);

/** 現行世代と1つ前の世代のCPUアーキテクチャ */
const CURRENT_CPU_ARCHS = new Set<Cpu['arch']>([
  'Zen 5',
  'Zen 4',
  'Arrow Lake',
  'Raptor Lake-R',
  'Raptor Lake',
]);

export function isCurrentGenGpu(gpu: Gpu): boolean {
  return CURRENT_GPU_ARCHS.has(gpu.arch);
}

export function isCurrentCpu(cpu: Cpu): boolean {
  return CURRENT_CPU_ARCHS.has(cpu.arch);
}

/**
 * 新品での入手が難しい可能性がある場合の注記。該当しなければ null。
 * 断定はしない（在庫を確認していないため）。
 */
export function stockNote(model: { arch: string; releaseYear: number }): string | null {
  const current =
    CURRENT_GPU_ARCHS.has(model.arch as Gpu['arch']) ||
    CURRENT_CPU_ARCHS.has(model.arch as Cpu['arch']);
  if (current) return null;
  return `${model.releaseYear}年の世代です。新品での入手は難しい可能性があります。`;
}
