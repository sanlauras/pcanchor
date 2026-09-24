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

/** globals.css のトークンと同じ値（2026-09-22 に明るい技術資料風へ作り直し） */
const PAPER = '#f2f3f0';
const INK = '#121416';
const DIM = '#555b63';
/** 文字に使う濃いオレンジ。紙の上で 5.38:1 */
const ACCENT = '#b3390a';
/** 帯・印の塗りだけに使う信号オレンジ。文字には使わない */
const VIVID = '#ff5a1f';
/** 背景画像の上下端の実測色。帯を足しても継ぎ目が出ない値（反転前の色） */
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
    // サイトの見出しと同じ書体（2026-09-22 に Zen Kaku Gothic New から替えた）
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

/**
 * 背景。元画像は暗い地に光る線の錨なので、明るさを反転して「紙に墨の線」の図面にする。
 *
 * 明るさ（0〜1）を、紙の色から墨の色への濃さに置き換える。
 * 暗い地（ほぼ0）は紙の色に、光る線（明るい）は墨の線になる。
 * LOW 未満は紙のまま（地のわずかなムラを消す）、HIGH 以上は墨で頭打ち。
 */
const LOW = 0.06;
const HIGH = 0.7;

function hex(c) {
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
}

async function background() {
  const width = 1584 - CROP_LEFT;
  const targetH = Math.round(width / (OUT_W / OUT_H));
  const pad = Math.max(0, Math.round((targetH - 672) / 2));

  let img = sharp(SRC).extract({ left: CROP_LEFT, top: 0, width, height: 672 });
  if (pad > 0) {
    img = img.extend({ top: pad, bottom: targetH - 672 - pad, background: EDGE });
  }
  const { data, info } = await img
    .resize(OUT_W, OUT_H, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const paper = hex(PAPER);
  const ink = hex(INK);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const t = Math.min(1, Math.max(0, (lum - LOW) / (HIGH - LOW)));
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(paper[c] + (ink[c] - paper[c]) * t);
  }
  const buf = await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
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
      // 文字の後ろだけ紙の色で覆い、錨の線と文字が重ならないようにする（右へ向かって透明に）
      h('div', {
        key: 'veil',
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: OUT_W,
          height: OUT_H,
          backgroundImage: `linear-gradient(90deg, ${PAPER} 0%, ${PAPER} 44%, rgba(242, 243, 240, 0) 64%)`,
        },
      }),
      // 技術資料の上端の帯。サイトのホームと同じもの。事実だけを並べる
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
          backgroundColor: INK,
          color: PAPER,
          fontFamily: 'PlexMono',
          fontSize: 15,
          letterSpacing: '0.12em',
        },
        [
          h('div', { key: 'mark', style: { width: 12, height: 12, backgroundColor: VIVID, marginRight: 22 } }),
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
          text(
            'name',
            { fontFamily: 'RubikDistressed', fontSize: 76, letterSpacing: '0.01em', color: INK, lineHeight: 1.05 },
            'PC ANCHOR',
          ),
          text('ja', { alignItems: 'center', marginTop: 14, marginBottom: 30 }, [
            h('div', { key: 'rule', style: { width: 36, height: 3, backgroundColor: VIVID, marginRight: 14 } }),
            h(
              'div',
              { key: 'label', style: { fontFamily: 'BizUD', fontSize: 20, letterSpacing: '0.2em', color: DIM } },
              'PCアンカー',
            ),
          ]),
          // 読点で2行に分ける（狭い幅で「デバ／イス」と途中で切れないように。サイトと同じ扱い）
          text('tagline', { flexDirection: 'column', fontFamily: 'BizUD', fontSize: 38, color: INK, lineHeight: 1.3 }, [
            h('div', { key: 'l1' }, 'ゲーミングPCとデバイスを、'),
            h('div', { key: 'l2' }, '数字で選ぶ。'),
          ]),
          text(
            'stats',
            { fontFamily: 'BizUD', fontSize: 17, color: DIM, marginTop: 24 },
            `GPU ${gpu}・CPU ${cpu}モデルのスペックと、fps予想などのツール`,
          ),
        ],
      ),
    ],
  );

  const png = Buffer.from(
    await new ImageResponse(el, { width: OUT_W, height: OUT_H, fonts }).arrayBuffer(),
  );

  // 線画のグラデーションが多くPNGだと重くなる。JPEGなら見た目そのままで数分の1。
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
