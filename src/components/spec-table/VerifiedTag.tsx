import { specStatus } from '@/components/model/DataStatus';

/**
 * 一覧の行の「スペックの確認状態」タグ。
 *
 * このサイトはデータの出所を明示することを前提にしているため
 * （CLAUDE.md 絶対ルール1・3）、行ごとに「スペックの値がどう確認されたか」を出す。
 * 何を確かめたかを札の文字で書く（2026-11-09。前は「確認済」だけで、何の確認か分からなかった）。
 * ゲーム性能（fps）の確認ではない。fps はどのモデルも推定。
 * CSV の原文（例: OK(ソース確認済)）と説明は title 属性で読める。
 */
export function VerifiedTag({ verified }: { verified: string }) {
  const s = specStatus(verified);

  return (
    <span
      title={s.detail}
      className={
        // 色ではなく枠線の種類と文字の明るさで区別する。照合済みは背景になじませ、準確認の方を目立たせる
        'inline-block cursor-help rounded border px-1.5 py-px font-mono text-[10px] whitespace-nowrap ' +
        (s.semi ? 'border-dashed border-caution text-caution' : 'border-rule text-dim')
      }
    >
      {s.semi ? '一部準確認' : '公式照合済'}
    </span>
  );
}
