import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

export const alt = `${SITE.name}｜ゲーミングPCのfps予想とスペック比較`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** SNSでリンクを貼ったときのカード画像。サイトの配色に合わせている */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0b0e14',
          color: '#dbe2ec',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ color: '#22d3ee', fontSize: 30, letterSpacing: 6, marginBottom: 28 }}>
          {SITE.nameEn.toUpperCase()}
        </div>
        <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.1 }}>{SITE.name}</div>
        <div style={{ fontSize: 40, marginTop: 24, color: '#dbe2ec' }}>
          ゲーミングPCのfps予想とスペック比較
        </div>
        <div style={{ fontSize: 26, marginTop: 40, color: '#7f8b9c' }}>
          GPU 78モデル / CPU 42モデル ・ ボトルネック診断
        </div>
      </div>
    ),
    size,
  );
}
