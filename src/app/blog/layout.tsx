import type { Viewport } from 'next';

/**
 * ブログ（/blog 以下）の共通設定（2026-10-13）。
 * 明るい配色そのものは、ルートの layout の ThemeScope が URL を見て当てている。ここではブラウザのバーの色だけを明るくする。
 */
export const viewport: Viewport = {
  themeColor: '#f6f7f9',
  colorScheme: 'light',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
