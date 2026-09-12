import { type PartKind, amazonSearchUrl } from '@/lib/affiliate';

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
  /** 検索語に足すカテゴリ。関連度を上げるために必要 */
  kind: PartKind;
  /** 'block' = 大きめのボタン / 'inline' = 一覧の行に添える小さいリンク */
  variant?: 'block' | 'inline';
};

export function AffiliateLink({ query, kind, variant = 'inline' }: Props) {
  const href = amazonSearchUrl(query, kind);
  if (href === null) return null;

  if (variant === 'block') {
    return (
      <div>
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
      {/*
        検索結果の上位は別モデルとスポンサー広告に埋まることがある。
        実例として「RTX 3050 8GB」で 8GB版が1件も出ないケースを確認している。
        広告は消せないので、確認を促す。
      */}
      <p className="mt-1.5 text-xs text-dim">
        検索結果には別のモデルや広告も表示されます。
        <strong className="font-medium text-ink">型番とVRAM容量を確認</strong>
        してから購入してください。
      </p>
      </div>
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
