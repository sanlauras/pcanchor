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
 *   - 背景画像 assets/og-source.jpg を差し替えたとき
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/og-source.jpg');
const OUT = join(ROOT, 'src/app/opengraph-image.jpg');
const FONT_CACHE = join(ROOT, 'node_modules/.cache/og-fonts');

/** OGPの規格 */
const OUT_W = 1200;
const OUT_H = 630;

/** globals.css のトークンと同じ値 */
const INK = '#dbe2ec';
const DIM = '#7f8b9c';
const ACCENT = '#22d3ee';
/** 背景画像の上下端の実測色。帯を足しても継ぎ目が出ない値 */
const EDGE = '#020a0c';

/**
 * 背景画像の切り取り量。
 *
 * 元画像は 1584x672 (2.36:1)、OGPは 1200x630 (1.91:1) なので縦が足りない。
 * 錨の発光が x=1580（右端から4px）まで届いているため右は削れず、
 * 左の余白だけを削り、残りは上下の帯で合わせている。
 */
const CROP_LEFT = 240;

/**
 * Google Fonts から TTF を取る。
 * Satori は WOFF2 を読めないので TTF が要る。日本語は Google Fonts の
 * CSS API がサブセット（欧文のみ）を返すため、リポジトリから直接取る。
 */
const FONTS = [
  {
    file: 'rubik-distressed.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubikdistressed/RubikDistressed-Regular.ttf',
    name: 'RubikDistressed',
    weight: 400,
  },
  {
    file: 'zen-kaku-black.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew/ZenKakuGothicNew-Black.ttf',
    name: 'ZenKaku',
    weight: 900,
  },
  {
    file: 'plex-mono-medium.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf',
    name: 'PlexMono',
    weight: 500,
  },
];

async function loadFonts() {
  mkdirSync(FONT_CACHE, { recursive: true });
  return Promise.all(
    FONTS.map(async ({ file, url, name, weight }) => {
      const path = join(FONT_CACHE, file);
      if (!existsSync(path)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`フォントを取得できません: ${url} (${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        // TTF は 0x00010000 で始まる。HTMLのエラーページを掴んでいないか確認する
        if (buf.readUInt32BE(0) !== 0x00010000) {
          throw new Error(`TTFではないものが返りました: ${url}`);
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

async function background() {
  const width = 1584 - CROP_LEFT;
  const targetH = Math.round(width / (OUT_W / OUT_H));
  const pad = Math.max(0, Math.round((targetH - 672) / 2));

  let img = sharp(SRC).extract({ left: CROP_LEFT, top: 0, width, height: 672 });
  if (pad > 0) {
    img = img.extend({ top: pad, bottom: targetH - 672 - pad, background: EDGE });
  }
  const buf = await img.resize(OUT_W, OUT_H, { fit: 'fill' }).png().toBuffer();
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const h = React.createElement;

async function main() {
  const { gpu, cpu } = counts();
  const [fonts, bg] = await Promise.all([loadFonts(), background()]);

  const el = h(
    'div',
    {
      style: {
        display: 'flex',
        position: 'relative',
        width: OUT_W,
        height: OUT_H,
        backgroundColor: EDGE,
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
      h(
        'div',
        {
          key: 'text',
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            height: OUT_H,
            paddingLeft: 64,
            paddingRight: 24,
          },
        },
        [
          h(
            'div',
            {
              key: 'kicker',
              style: {
                fontFamily: 'PlexMono',
                fontSize: 15,
                letterSpacing: '0.18em',
                color: ACCENT,
                marginBottom: 18,
              },
            },
            'GAMING PC FPS PREDICTOR',
          ),
          h(
            'div',
            {
              key: 'name',
              style: {
                fontFamily: 'RubikDistressed',
                fontSize: 64,
                letterSpacing: '0.01em',
                color: INK,
                lineHeight: 1.05,
              },
            },
            'PC ANCHOR',
          ),
          h(
            'div',
            {
              key: 'ja',
              style: {
                display: 'flex',
                alignItems: 'center',
                marginTop: 16,
                marginBottom: 22,
              },
            },
            [
              h('div', {
                key: 'rule',
                style: { width: 34, height: 2, backgroundColor: ACCENT, marginRight: 14 },
              }),
              h(
                'div',
                {
                  key: 'label',
                  style: {
                    fontFamily: 'ZenKaku',
                    fontSize: 20,
                    letterSpacing: '0.2em',
                    color: DIM,
                  },
                },
                'PCアンカー',
              ),
            ],
          ),
          h(
            'div',
            {
              key: 'tagline',
              style: { fontFamily: 'ZenKaku', fontSize: 22, color: INK, lineHeight: 1.35 },
            },
            'ゲーミングPCのfps予想とスペック比較',
          ),
          h(
            'div',
            {
              key: 'stats',
              style: { fontFamily: 'ZenKaku', fontSize: 16, color: DIM, marginTop: 24 },
            },
            `GPU ${gpu}モデル / CPU ${cpu}モデル`,
          ),
        ],
      ),
    ],
  );

  const png = Buffer.from(
    await new ImageResponse(el, { width: OUT_W, height: OUT_H, fonts }).arrayBuffer(),
  );

  // 写真的なグラデーションが多くPNGだと1MB近くなる。JPEGなら見た目そのままで1/7。
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
