'use client';

import { trackEvent } from '@/lib/analytics';

/**
 * 公式の情報（ゲーム会社の動作環境のページなど）への外部リンク（2026-11-09。GA4 の official_link_click 用）。
 *
 * 見た目と動き（新しいタブで開く・rel=noopener）は、置き換える前の <a> と同じ。
 * クリックで計測を送るだけで、移動は止めない（preventDefault しない）。新しいタブで開くので、
 * 今のページは残るが、念のため beacon で送る。
 */
export function OfficialLink({
  href,
  linkType,
  game,
  className,
  children,
}: {
  href: string;
  /** 例: official_requirements（公式の動作環境）・article_source（記事の出典） */
  linkType: string;
  game?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => trackEvent('official_link_click', { destination: href, link_type: linkType, game }, { beacon: true })}
    >
      {children}
    </a>
  );
}
