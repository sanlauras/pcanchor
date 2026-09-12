import { amazonSearchUrl } from '@/lib/affiliate';
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
 * **文言に「最安」と書かないこと。** 価格の安い順に並べると整備済み品や
 * アクセサリが上位に来るため、並べ替えを指定していない。
 * 並べていないのに「最安」と書くと、果たせない約束になる。
 *
 * アソシエイトタグが未設定のときは何も描画しない。
 */
type Props = {
  /** 検索に使うモデル名 */
  query: string;
  /** 'block' = ページ内で目立つボタン / 'inline' = 一覧の行に添える小さいリンク */
  variant?: 'block' | 'inline';
  /** 発売世代の判定に使う。旧世代なら文言と注記を変える */
  model?: { arch: string; releaseYear: number };
};

export function AffiliateLink({ query, variant = 'inline', model }: Props) {
  const href = amazonSearchUrl(query);
  if (href === null) return null;

  // 旧世代は新品で流通していない可能性が高いので、期待値を下げた文言にする
  const note = model ? stockNote(model) : null;
  const action = note !== null ? 'を中古も含めて探す' : 'の価格を見る';

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
            Amazonで {query} {action}
          </span>
          <span aria-hidden className="shrink-0 font-mono text-lg">
            →
          </span>
        </a>

        {/*
          検索結果の上位はスポンサー広告（グラボステー等のアクセサリ）に
          取られることがある。間違ったものを買わせないために確認を促す。
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
