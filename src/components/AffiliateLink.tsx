import { amazonSearchUrl } from '@/lib/affiliate';

/**
 * Amazonへのアフィリエイトリンク。
 *
 * rel="sponsored" はGoogleの要求（「外部リンクの修飾」）。
 * 付けないと有料リンクの未申告になる。
 * noreferrer は付けない（成果計測を妨げる可能性があるため）。
 *
 * アソシエイトタグが未設定のときは何も描画しない。
 */
type Props = {
  /** 検索に使うモデル名 */
  query: string;
  /** 'block' = 大きめのボタン / 'inline' = 一覧の行に添える小さいリンク */
  variant?: 'block' | 'inline';
};

export function AffiliateLink({ query, variant = 'inline' }: Props) {
  const href = amazonSearchUrl(query);
  if (href === null) return null;

  if (variant === 'block') {
    return (
      <a
        href={href}
        target="_blank"
        rel="sponsored noopener"
        className="flex items-center justify-between gap-3 border border-rule bg-panel px-4 py-3
                   text-sm hover:border-ink"
      >
        <span>
          Amazonで <span className="font-medium text-ink">{query}</span> を探す
        </span>
        <span className="shrink-0 border border-rule-soft px-1.5 py-px font-mono text-[10px] text-dim">
          広告
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      className="shrink-0 font-mono text-[10px] text-dim hover:text-accent"
    >
      Amazon
      <span className="ml-1 border border-rule-soft px-1 py-px text-[9px]">広告</span>
    </a>
  );
}
