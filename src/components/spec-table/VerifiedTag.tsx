/**
 * 各行の検証状態タグ。
 *
 * このサイトはデータの出所を明示することを前提にしているため
 * （CLAUDE.md 絶対ルール1・3）、行ごとに「その値がどう確認されたか」を出す。
 * CSVの原文（例: OK(ソース確認済)）は title 属性で参照できる。
 */
export function VerifiedTag({ verified }: { verified: string }) {
  const isSemi = verified.startsWith('準');

  return (
    <span
      title={verified}
      className={
        // アクセントを1色に絞るため、色ではなく枠線の種類と文字の明るさで区別する。
        // 確認済は背景になじませ、確認が弱い「準確認」の方を目立たせる。
        'inline-block cursor-help border px-1.5 py-px font-mono text-[10px] whitespace-nowrap ' +
        (isSemi
          ? 'border-dashed border-dim text-ink'
          : 'border-rule text-dim')
      }
    >
      {isSemi ? '準確認' : '確認済'}
    </span>
  );
}
