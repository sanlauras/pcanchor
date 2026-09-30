/**
 * ヒーローの写真の仕上げ（明るさ・彩度・光のにじみ）。make-hero.mjs と make-og.mjs の両方で使う。
 *
 * 2026-09-30 ユーザーの要望:「画質・彩度・明るさを上げて、光が本当に光って見えるくらいに」。
 * 元の写真は全体が暗く、ファンや画面の光も沈んでいたため、
 *   1. 明るさと彩度を上げる
 *   2. 明るい部分だけを取り出してぼかし、スクリーン合成で重ねる（ブルーム。光のまわりがにじんで発光して見える）
 * の2段で仕上げる。値を変えたら npm run hero と npm run og を実行し直すこと。
 *
 * 最初は明るさ 1.35・彩度 1.45・にじみ { a: 2.4, b: -260, blur: 22 } にしたが、「少し光りすぎ」との指摘で
 * 元の写真との中間くらいまで下げた（2026-09-30）。
 */
import sharp from 'sharp';

/** 全体の明るさと彩度（1 = 元のまま） */
export const LOOK = {
  brightness: 1.2,
  saturation: 1.3,
  /** コントラストを少し上げて、暗部が灰色に浮かないようにする（y = a*x + b） */
  contrast: { a: 1.08, b: -6 },
  /** 光のにじみ。明るい部分だけを残す強さ（大きいほど強い光だけが残る）と、ぼかしの半径（元画像のピクセル） */
  bloom: { a: 1.8, b: -250, blur: 18 },
};

/**
 * 仕上げた写真を PNG のバッファで返す。
 * extract を渡すと、仕上げの前にその範囲を切り抜く（切り抜きの後で光をにじませると、端が不自然にならない）。
 */
export async function lookedHero(src, extract) {
  const base = () => (extract ? sharp(src).extract(extract) : sharp(src));
  const toned = await base()
    .modulate({ brightness: LOOK.brightness, saturation: LOOK.saturation })
    .linear(LOOK.contrast.a, LOOK.contrast.b)
    .png()
    .toBuffer();
  const bloom = await sharp(toned)
    .linear(LOOK.bloom.a, LOOK.bloom.b)
    .blur(LOOK.bloom.blur)
    .png()
    .toBuffer();
  return sharp(toned).composite([{ input: bloom, blend: 'screen' }]).png().toBuffer();
}
