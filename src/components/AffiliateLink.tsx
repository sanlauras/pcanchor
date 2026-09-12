import { type PartKind, amazonSearchUrl } from '@/lib/affiliate';
import { stockNote } from '@/lib/generation';

/**
 * Amazonへのリンク。
 *
 * rel="sponsored" はGoogleの要求（「外部リンクの修飾」）。付けないと有料リンクの
 * 未申告になる。**見た目の「広告」バッジは出していない**が、
 * フッターの開示文（Amazon運営規約の義務）と rel="sponsored" は必須なので外さないこと。
 * ステマ規制の規制対象は商品を供給する事業者であってアフィリエイター自身ではない
 * （消費者庁）。詳細は CONTEXT.md「アフィリエイトの判断」。
 *
 * noreferrer は付けない（成果計測を妨げる可能性があるため）。
 *
 * アソシエイトタグが未設定のときは何も描画しない。
 */
type Props = {
  /** 検索に使うモデル名 */
  query: string;
  /** 検索語に足すカテゴリ。関連度を上げるために必要 */
  kind: PartKind;
  /** 'block' = ページ内で目立つボタン / 'inline' = 一覧の行に添える小さいリンク */
  variant?: 'block' | 'inline';
  /** 発売世代の判定に使う。旧世代なら文言と注記を変える */
  model?: { arch: string; releaseYear: number };
};

export function AffiliateLink({ query, kind, variant = 'inline', model }: Props) {
  const href = amazonSearchUrl(query, kind);
  if (href === null) return null;

  // 旧世代は新品で流通していない可能性が高いので、期待値を下げた文言にする
  const note = model ? stockNote(model) : null;
  const isOld = note !== null;
  const action = isOld ? '中古を含めて探す' : '最安で探す';

  if (variant === 'block') {
    return (
      <div>
        <a
          href={href}
          target="_blank"
          rel="sponsored noopener"
          className="flex items-center justify-between gap-3 border border-accent bg-accent
                     px-5 py-3.5 font-cond text-base font-bold text-paper
                     hover:brightness-110"
        >
          <span>
            Amazonで {query} を{action}
          </span>
          <span aria-hidden className="shrink-0 font-mono text-lg">
            →
          </span>
        </a>

        {/*
          GPUの検索は精度が低い。「RTX 3050 8GB」で 8GB版が1件も出ず、
          グラボステー(¥1,480)や RTX 5060 が並ぶケースを確認している。
          間違ったものを買わせないために、確認を促す。
        */}
        <p className="mt-2 text-xs text-dim">
          {note && <span className="mr-1 text-ink">{note}</span>}
          検索結果には別のモデルやアクセサリも表示されます。
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
      className="shrink-0 font-mono text-[10px] text-accent hover:underline"
    >
      Amazon →
    </a>
  );
}
