/**
 * OGP画像（SNSでリンクが貼られたときに出るカード）を生成する。
 *
 *   npm run og
 *
 * ビルドには組み込んでいない。フォントをネットから取るため、
 * これをビルドに入れるとデプロイが外部の可用性に依存してしまう。
 * 出力した JPEG をコミットして、静的ファイルとして配信する。
 *
 * 作り直すのは次のときだけ:
 *   - 掲載モデル数が変わったとき（画像に焼き込まれているため）
 *   - サイト名・キャッチコピー・配色を変えたとき
 *   - 背景の写真 assets/hero-source.png（ホームのヒーローと同じ）を差し替えたとき
 *
 * 2026-09-30 の暗いデザインへの作り直しで、背景をホームのヒーローの写真にし、配色と
 * ロゴの書体（Exo 2・A だけ青）をサイトにそろえた。文言と数字は以前の画像と同じ。
 * 以前の背景 assets/og-source.jpg（線画の錨）は使っていない。
 *
 * 文字は画像生成AIに描かせていない。日本語は確実に崩れるため、
 * 背景だけ生成させ、サイトと同じフォントでここから重ねている。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from 'next/og.js';
import React from 'react';
import sharp from 'sharp';
import { lookedHero } from './hero-look.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/hero-source.png');
const OUT = join(ROOT, 'src/app/opengraph-image.jpg');
const FONT_CACHE = join(ROOT, 'node_modules/.cache/og-fonts');

/** OGPの規格 */
const OUT_W = 1200;
const OUT_H = 630;

/** globals.css の色と同じ値（2026-09-27 の暗いデザイン） */
const PAPER = '#070d18';
const PANEL = '#0d1726';
const INK = '#e6edf6';
const DIM = '#9aa8bc';
const ACCENT = '#5cb8ff';
const FRAME = '#24426b';

/**
 * 背景の切り抜き。元の写真は 2170x725（約3:1）、OGP は 1.91:1 なので横を削る。
 * 主題（モニターの左端 x≒1130 〜 PC と ヘッドホン x≒1840）が、文字の乗る左半分に
 * かからないよう、左から 440px の位置から切り出す（主題は画像の右半分に入る）。
 */
const CROP = { left: 440, top: 0, height: 725 };

/**
 * フォント。Satori（画像にする部品）は WOFF2 を読めないので、TTF か WOFF を取る。
 * 日本語は Google Fonts の CSS API がサブセット（欧文のみ）を返すため、リポジトリから直接取る。
 */
const FONTS = [
  {
    // サイトのロゴと同じ書体・太さ（2026-09-30 に Rubik Distressed から替えた）
    file: 'exo2-latin-800.woff',
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/exo-2/files/exo-2-latin-800-normal.woff',
    name: 'Exo2',
    weight: 800,
  },
  {
    // サイトの見出しと同じ書体
    file: 'biz-udpgothic-bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bizudpgothic/BIZUDPGothic-Bold.ttf',
    name: 'BizUD',
    weight: 700,
  },
  {
    file: 'plex-mono-medium.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf',
    name: 'PlexMono',
    weight: 500,
  },
];

/** 先頭の4バイトで、フォントのファイルかを確かめる（エラーページの HTML を掴んでいないか） */
const FONT_MAGIC = [0x00010000, 0x774f4646 /* wOFF */];

async function loadFonts() {
  mkdirSync(FONT_CACHE, { recursive: true });
  return Promise.all(
    FONTS.map(async ({ file, url, name, weight }) => {
      const path = join(FONT_CACHE, file);
      if (!existsSync(path)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`フォントを取得できません: ${url} (${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (!FONT_MAGIC.includes(buf.readUInt32BE(0))) {
          throw new Error(`フォントではないものが返りました: ${url}`);
        }
        writeFileSync(path, buf);
        console.log(`  取得: ${file} (${(buf.length / 1024).toFixed(0)} KB)`);
      }
      return { name, data: readFileSync(path), weight, style: 'normal' };
    }),
  );
}

/** 画像に焼き込む件数は data/*.csv から数える（記憶や手打ちで書かない） */
function counts() {
  const rows = (f) =>
    readFileSync(join(ROOT, 'data', f), 'utf8').trim().split(/\r?\n/).length - 1;
  return { gpu: rows('gpu_index.csv'), cpu: rows('cpu_index.csv') };
}

/** 背景の写真を OGP の比率に切り抜いて縮める */
async function background() {
  const width = Math.round(CROP.height * (OUT_W / OUT_H));
  // ヒーローと同じ仕上げ（明るさ・彩度・光のにじみ）をかけてから縮める
  const looked = await lookedHero(SRC, { left: CROP.left, top: CROP.top, width, height: CROP.height });
  const buf = await sharp(looked)
    .resize(OUT_W, OUT_H)
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const h = React.createElement;

async function main() {
  const { gpu, cpu } = counts();
  const [fonts, bg] = await Promise.all([loadFonts(), background()]);

  const text = (key, style, children) => h('div', { key, style: { display: 'flex', ...style } }, children);

  const el = h(
    'div',
    {
      style: {
        display: 'flex',
        position: 'relative',
        width: OUT_W,
        height: OUT_H,
        backgroundColor: PAPER,
      },
    },
    [
      h('img', {
        key: 'bg',
        src: bg,
        width: OUT_W,
        height: OUT_H,
        style: { position: 'absolute', top: 0, left: 0 },
      }),
      // 文字の乗る左側だけを紺で暗くする（サイトのヒーローと同じ）
      h('div', {
        key: 'veil',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: OUT_W,
          height: OUT_H,
          backgroundImage: `linear-gradient(90deg, ${PAPER} 0%, rgba(7, 13, 24, 0.92) 48%, rgba(7, 13, 24, 0) 78%)`,
        },
      }),
      // 上端の帯。サイトのホームと同じもの。事実だけを並べる
      text(
        'band',
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: OUT_W,
          height: 46,
          alignItems: 'center',
          paddingLeft: 64,
          backgroundColor: 'rgba(13, 23, 38, 0.85)',
          borderBottom: `1px solid ${FRAME}`,
          color: DIM,
          fontFamily: 'PlexMono',
          fontSize: 15,
          letterSpacing: '0.12em',
        },
        [
          h('div', { key: 'mark', style: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT, marginRight: 22 } }),
          h('div', { key: 'a', style: { marginRight: 36 } }, 'PC ANCHOR'),
          h('div', { key: 'b', style: { marginRight: 36 } }, `GPU ${gpu} / CPU ${cpu}`),
          h('div', { key: 'c', style: { fontFamily: 'BizUD' } }, '推定・誤差 ±15〜20%'),
        ],
      ),
      text(
        'body',
        {
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          height: OUT_H,
          paddingTop: 46,
          paddingLeft: 64,
          paddingRight: 24,
        },
        [
          text(
            'kicker',
            { fontFamily: 'PlexMono', fontSize: 16, letterSpacing: '0.18em', color: ACCENT, marginBottom: 16 },
            'GAMING PC & GEAR DATA',
          ),
          // ロゴ。サイトと同じく ANCHOR の頭の A だけ青
          text('name', { fontFamily: 'Exo2', fontSize: 76, letterSpacing: '0.02em', color: INK, lineHeight: 1.05 }, [
            h('div', { key: 'pc', style: { marginRight: 22 } }, 'PC'),
            h('div', { key: 'a', style: { color: ACCENT } }, 'A'),
            h('div', { key: 'rest' }, 'NCHOR'),
          ]),
          text('ja', { alignItems: 'center', marginTop: 14, marginBottom: 30 }, [
            h('div', { key: 'rule', style: { width: 36, height: 3, backgroundColor: ACCENT, marginRight: 14 } }),
            h(
              'div',
              { key: 'label', style: { fontFamily: 'BizUD', fontSize: 20, letterSpacing: '0.2em', color: DIM } },
              'PCアンカー',
            ),
          ]),
          // 読点で2行に分ける（サイトと同じ扱い）。2行目はサイトと同じくアクセントの青
          text('tagline', { flexDirection: 'column', fontFamily: 'BizUD', fontSize: 38, color: INK, lineHeight: 1.3 }, [
            h('div', { key: 'l1' }, 'ゲーミングPCとデバイスを、'),
            h('div', { key: 'l2', style: { color: ACCENT } }, '数字で選ぶ。'),
          ]),
          text(
            'stats',
            { fontFamily: 'BizUD', fontSize: 17, color: DIM, marginTop: 24 },
            `GPU ${gpu}・CPU ${cpu}モデルのスペックと、fps予想などのツール`,
          ),
        ],
      ),
      // 枠の色の細い下線（サイトの区切り線と同じ色）
      h('div', {
        key: 'edge',
        style: { position: 'absolute', left: 0, bottom: 0, width: OUT_W, height: 4, backgroundColor: PANEL, borderTop: `1px solid ${FRAME}` },
      }),
    ],
  );

  const png = Buffer.from(
    await new ImageResponse(el, { width: OUT_W, height: OUT_H, fonts }).arrayBuffer(),
  );

  // 写真なので PNG だと重くなる。JPEG なら見た目そのままで数分の1。
  // 文字の輪郭が滲まないよう色間引きは無効にする。
  const jpg = await sharp(png)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toBuffer();
  writeFileSync(OUT, jpg);

  console.log(`OGP画像を生成: ${OUT}`);
  console.log(`  ${OUT_W}x${OUT_H} / ${(jpg.length / 1024).toFixed(0)} KB`);
  console.log(`  焼き込んだ件数: GPU ${gpu} / CPU ${cpu}`);
}

await main();
