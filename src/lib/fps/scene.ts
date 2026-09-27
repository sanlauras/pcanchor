import type { GameHighlight } from './model';

/**
 * 「どんな場面の値か」を文にする（2026-09-27）。
 *
 * ゲームページの強調枠と同じ中身を、GPU・CPU ページの表と、ゲームページの「よくある質問」の答えにも出すための文。
 * Apex の値は激しい戦闘シーンの測定が基準で、実戦マップでは高く出る（GPU 側だけ）。
 * これを書かないと、GPU・CPU ページだけを見た人が低めの数字をそのまま受け取ってしまう（SEO監査の指摘）。
 * 倍率は games.ts の highlight.comparison をそのまま使う（新しい数字は作らない）。
 */

/** 軽い場面での目安だけの文。倍率の根拠が無いゲームは空文字 */
export function lighterSentence(h: GameHighlight, cap: number | null): string {
  const c = h.comparison;
  if (!c) return '';
  const m = c.lighterMultiplier.toFixed(2);
  if (c.appliesTo === 'all') return `「${c.lighterLabel}」では約${m}倍が目安です。`;
  return (
    `「${c.lighterLabel}」では、GPUが上限を決めている構成で約${m}倍が目安です` +
    `（CPU側の上限${cap !== null ? `と${cap}fpsの上限` : ''}で頭打ちになります）。`
  );
}

/** 「〜での推定です」から始まる、場面の説明の全文 */
export function sceneSentence(h: GameHighlight, cap: number | null): string {
  const c = h.comparison;
  if (!c) return `${h.title}。`;
  return `数値は「${c.measuredLabel}」での推定です。${lighterSentence(h, cap)}`;
}
