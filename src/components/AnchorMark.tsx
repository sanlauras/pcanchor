/**
 * 錨（アンカー）のマーク。サイト名の由来で、ファビコン（src/app/icon.svg）と同じ形。
 * 色は文字の色（currentColor）に従うので、使う側で text-accent などを付ける。
 *
 * gradient を付けると、イメージ画像のロゴのように上から下へ明るい青→青のグラデーションで描く
 * （ヘッダーとフッターのロゴ。2026-09-30）。グラデーションの定義はどこで使っても同じなので、
 * 同じページに2つあっても id が重なって困ることはない。
 */
export function AnchorMark({ className = '', gradient = false }: { className?: string; gradient?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
      stroke={gradient ? 'url(#anchor-mark-gradient)' : 'currentColor'}
      strokeWidth={2.6}
      strokeLinecap="round"
    >
      {gradient && (
        <defs>
          {/*
            座標は図全体（userSpaceOnUse）で指定する。既定の「図形ごとの大きさ基準」だと、
            幅や高さが0の直線（縦棒・横棒）にグラデーションが塗られず、線が消えてしまう（実際に消えた）
          */}
          <linearGradient id="anchor-mark-gradient" gradientUnits="userSpaceOnUse" x1="16" y1="4" x2="16" y2="28">
            <stop offset="0" stopColor="#8fdcff" />
            <stop offset="1" stopColor="#1a7ff0" />
          </linearGradient>
        </defs>
      )}
      <path d="M16 9v15" />
      <path d="M10 14h12" />
      <path d="M8 19a8 8 0 0 0 16 0" />
      <circle cx="16" cy="7" r="2.6" />
    </svg>
  );
}
