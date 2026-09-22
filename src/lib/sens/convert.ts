/**
 * マウス感度の換算。
 *
 * どのゲームも「マウス1カウントあたり何度回るか（yaw定数）」が感度に比例する。
 * これが分かれば、あとは割り算だけで別ゲームの感度に直せる。
 *
 *   振り向き距離 cm/360 = 360 ÷ (yaw × 感度 × DPI) × 2.54
 *   別ゲームの感度       = 元の感度 × (元のyaw × 元のDPI) ÷ (先のyaw × 先のDPI)
 *   eDPI                 = DPI × 感度
 *
 * 係数の出どころは CONTEXT.md「感度換算の係数」。ここに新しい数値を足さないこと。
 * 係数を変えると selftest.ts が落ちる。
 *
 * 扱うのは腰だめ（Hipfire）の感度だけ。ADS・スコープ時の感度は
 * ゲームごとに別の倍率が掛かるため、このツールでは扱わない。
 */

/** 1インチ = 2.54cm。inch/360 と cm/360 の行き来に使う */
export const INCH_CM = 2.54;

export type SensInput = {
  /** そのゲームの yaw 定数 */
  yaw: number;
  /** ゲーム内の感度の数値（Fortnite は％の数値） */
  sens: number;
  /** マウスのDPI */
  dpi: number;
};

/** 360度振り向くのに必要なマウスの移動距離(cm) */
export function cm360(input: SensInput): number {
  return (360 / (input.yaw * input.sens * input.dpi)) * INCH_CM;
}

/** 振り向き距離(cm)から、そのゲーム・そのDPIでの感度を逆算する */
export function sensFromCm360(cm: number, yaw: number, dpi: number): number {
  return (360 * INCH_CM) / (yaw * cm * dpi);
}

/** 別のゲーム（別のDPIでもよい）で、同じ振り向き距離になる感度 */
export function convertSens(from: SensInput, to: { yaw: number; dpi: number }): number {
  return (from.sens * from.yaw * from.dpi) / (to.yaw * to.dpi);
}

/** eDPI。同じゲームの中で感度を比べるときの目安 */
export function edpi(sens: number, dpi: number): number {
  return sens * dpi;
}

/** 振り向き距離(cm)を inch/360 に直す */
export function toInch360(cm: number): number {
  return cm / INCH_CM;
}

/**
 * 覗き込み（スコープ・ADS）時の振り向き距離。
 *
 * 倍率がそのまま感度に掛かるゲームでは、感度が m 倍になるぶん距離は 1/m になる。
 * **これは同じゲームの中だけの話。** 覗くと視野も狭くなるため、
 * ゲームをまたいで「覗いたときの体感」をそろえるには別の考え方（モニター距離の一致）が要る。
 * 画面にもその旨を書くこと。
 */
export function scopedCm360(hipCm360: number, multiplier: number): number {
  return hipCm360 / multiplier;
}

/**
 * マウスパッドの幅で何度まで振り向けるか。
 *
 * 360度に cm/360 だけ要るので、幅 w cm では (w ÷ cm360) × 360 度。
 * 実際には端まで使い切れないので、画面では「目安」と書く。
 */
export function degreesInWidth(widthCm: number, cm360Value: number): number {
  return (widthCm / cm360Value) * 360;
}
