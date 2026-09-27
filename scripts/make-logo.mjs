/**
 * 構造化データ（Organization の logo）用の正方形 PNG を、ファビコンの SVG から作る。
 *
 *   node scripts/make-logo.mjs
 *
 * Google は Organization の logo に、112px 以上の正方形のラスター画像を求めている（SVG は不可）。
 * 図柄はファビコン（src/app/icon.svg）と同じ。icon.svg を変えたら作り直してコミットする。
 * ビルドには組み込んでいない（出力をコミットして静的ファイルとして配信する。make-og.mjs と同じ方針）。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src/app/icon.svg');
const OUT = join(ROOT, 'public/logo.png');
const SIZE = 512;

const svg = readFileSync(SRC);
await sharp(svg, { density: (72 * SIZE) / 32 })
  .resize(SIZE, SIZE)
  .png()
  .toFile(OUT);
console.log(`wrote ${OUT} (${SIZE}x${SIZE})`);
