/**
 * favicon.ico を src/app/icon.svg から作る。
 *
 *   npm run favicon
 *
 * なぜ必要か:
 * Google は検索結果のファビコンで **SVG をサポートしていない**
 * （対応は BMP / GIF / ICO / PNG / JPEG / PPM / TIFF）。
 * icon.svg だけだと、ブラウザのタブには出るのに Google からは
 * 「ファビコンが無いサイト」に見える。
 *
 * また Next.js の app/icon.svg は `/icon?<ハッシュ>` として配信され、
 * `/favicon.ico` は生成されない。多くのツールが `/favicon.ico` を
 * 直接見に行くので、その場所にも実体を置く。
 *
 * ICO は 16 / 32 / 48px を1ファイルに束ねる。Google は 48px 以上を
 * 推奨しており、小さい方はブラウザのタブ用。
 *
 * ロゴを変えたら icon.svg を直してこれを実行し直すこと。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src/app/icon.svg');
const OUT = join(ROOT, 'src/app/favicon.ico');

/** ICO に入れるサイズ。48 は Google の推奨下限 */
const SIZES = [16, 32, 48];

/**
 * PNG を並べて ICO のコンテナに詰める。
 * ICO は Vista 以降 PNG をそのまま埋め込めるので、変換は要らない。
 *
 * 構造: ヘッダ6バイト + エントリ16バイト×枚数 + PNG本体
 */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 予約領域。必ず0
  header.writeUInt16LE(1, 2); // 種別。1 = アイコン
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + pngs.length * 16;

  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    // 幅と高さは1バイト。256は0で表すが、ここでは最大48なのでそのまま入る
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt8(0, 2); // パレット数。PNGなので0
    e.writeUInt8(0, 3); // 予約領域
    e.writeUInt16LE(1, 4); // カラープレーン数
    e.writeUInt16LE(32, 6); // ビット深度
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const svg = readFileSync(SRC);

const pngs = await Promise.all(
  SIZES.map(async (size) => ({
    size,
    data: await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer(),
  })),
);

writeFileSync(OUT, buildIco(pngs));

// 確認用に一番大きいものを単体でも出す（目視チェック用。配信はしない）
const preview = join(ROOT, 'node_modules/.cache/favicon-preview.png');
await sharp(svg, { density: 384 }).resize(192, 192).png().toFile(preview);

console.log(`favicon.ico を生成: ${OUT}`);
console.log(`  ${SIZES.join(' / ')}px を1ファイルに収録`);
console.log(`  ${(buildIco(pngs).length / 1024).toFixed(1)} KB`);
console.log(`  目視確認用の拡大版: ${preview}`);
