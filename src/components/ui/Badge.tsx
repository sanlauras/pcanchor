/**
 * 小さな札（2026-11-09 の全面再設計で共通化）。
 *
 * **数字の性質を見分けるための札**。色だけで区別させないよう、札の文字そのもので意味を書く。
 *   estimate  当サイトの計算による推定（fps・性能指数）
 *   official  メーカー・ゲーム会社の公式情報を写したもの
 *   measured  自前の実測（RX 9070 XT＋Ryzen 7 9800X3D の1台だけ。それ以外に付けないこと）
 *   caution   注意・外挿（実測の無い範囲への当てはめ）
 *   neutral   分類（カテゴリなど）
 */
export type BadgeTone = 'estimate' | 'official' | 'measured' | 'caution' | 'neutral';

const LOOK: Record<BadgeTone, string> = {
  estimate: 'border-accent/50 bg-accent-soft text-accent',
  official: 'border-cyan/50 bg-cyan-soft text-cyan',
  measured: 'border-ink/40 bg-raise text-ink',
  caution: 'border-caution/50 bg-caution-soft text-caution',
  neutral: 'border-frame bg-raise text-dim',
};

export function Badge({ tone = 'neutral', className = '', children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-cond text-[11px] leading-none font-bold whitespace-nowrap ${LOOK[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
