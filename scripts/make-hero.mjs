/**
 * ホームのヒーロー（いちばん上の大きな背景写真）の画像を作る。
 *
 *   npm run hero
 *
 * 元画像 assets/hero-source.png（ユーザーが生成した 2170x725。左が暗く、右に PC とモニター）から、
 * 配信用の軽い画像を作って public/hero/ に置く。出力はコミットし、ビルドには組み込まない
 * （make-og.mjs と同じ方針。ビルドのたびに画像を作り直す必要が無いため）。
 *
 *   PC 用     幅1920。全体をそのまま縮める
 *   スマホ用  幅960。主題（モニターと PC）がある右寄りを、縦長の画面に合う比率で切り抜く
 *
 * 形式は WebP だけ（ほぼ全部のブラウザで表示できる）。暗い写真では AVIF の方が大きくなったため使っていない
 * （2026-09-30 に比較: PC 用 AVIF 53KB / WebP 36KB）。<picture> で PC 用とスマホ用を出し分ける。
 * 表示速度のため、PC 用 150KB 以下・スマホ用 60KB 以下を目安にしている（超えたら品質を下げる）。
 * 元画像を差し替えたら、これを実行し直すこと。
 */
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { lookedHero } from './hero-look.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/hero-source.png');
const OUT_DIR = join(ROOT, 'public/hero');

/** 目安の上限（バイト） */
const BUDGET = { desktop: 150 * 1024, mobile: 60 * 1024 };

/**
 * スマホ用の切り抜き。元画像の左端からの割合で、主題（モニターの左端〜PC の右端）が入る範囲。
 * 縦は全部使う（725px）。幅はスマホのヒーローの縦横比（おおよそ 3:4〜1:1）に寄せる。
 */
const MOBILE_CROP = { leftRatio: 0.44, widthRatio: 0.44 };

mkdirSync(OUT_DIR, { recursive: true });
const meta = await sharp(SRC).metadata();

// 仕上げ（明るさ・彩度・光のにじみ）は hero-look.mjs。OGP 画像も同じ仕上げを使う
const desktop = await lookedHero(SRC);
const mobile = await lookedHero(SRC, {
  left: Math.round(meta.width * MOBILE_CROP.leftRatio),
  top: 0,
  width: Math.round(meta.width * MOBILE_CROP.widthRatio),
  height: meta.height,
});

const variants = [
  // 縮めたあとに軽く輪郭を立てて、細部（ファンの縁・キーボードの光）をくっきりさせる
  { name: 'hero-1920', kind: 'desktop', pipeline: () => sharp(desktop).resize({ width: 1920 }).sharpen({ sigma: 0.6 }) },
  { name: 'hero-960', kind: 'mobile', pipeline: () => sharp(mobile).resize({ width: 960 }).sharpen({ sigma: 0.6 }) },
];

for (const v of variants) {
  // 画質を優先して高い品質から試し、目安を超えたら下げて作り直す
  for (const quality of [90, 82, 75, 65]) {
    const out = join(OUT_DIR, `${v.name}.webp`);
    await v.pipeline().webp({ quality }).toFile(out);
    const size = statSync(out).size;
    if (size <= BUDGET[v.kind] || quality === 65) {
      const { width, height } = await sharp(out).metadata();
      console.log(`${v.name}.webp  ${width}x${height}  ${Math.round(size / 1024)}KB  (品質 ${quality})`);
      break;
    }
  }
}
