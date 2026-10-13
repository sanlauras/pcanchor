import { OFFICIAL_REQUIREMENTS, officialValue } from '@/lib/fps/official-requirements';
import { DataTable } from './Prose';

/**
 * ゲーム会社の公式の動作環境を、記事に出す部品（2026-10-13）。
 * 中身は src/lib/fps/official-requirements.ts（ゲーム別のページと同じデータ）。公式の記載をそのまま出し、確認日と出典を添える。
 */
export function OfficialSpecTables({ gameId }: { gameId: string }) {
  const o = OFFICIAL_REQUIREMENTS[gameId];
  if (!o) throw new Error(`記事の部品: ${gameId} の公式の動作環境がありません`);
  return (
    <>
      {o.tiers.map((tier) => (
        <DataTable key={tier.label} caption={tier.label} head={['項目', '公式の記載']} rows={tier.rows.map(([k, v]) => [k, v])} />
      ))}
      <p className="-mt-2 mb-6 text-xs leading-relaxed text-dim">
        {'出典: '}
        <a href={o.sourceUrl} target="_blank" rel="noopener" className="text-accent underline">
          {o.sourceLabel}
        </a>
        {`（${o.checkedOn} に確認。公式の記載をそのまま載せています）`}
        {o.caveat && `。${o.caveat}`}
      </p>
    </>
  );
}

/** 公式の表の1項目を、本文の中にそのまま出す（例: 推奨のメモリ「16GB以上のRAM」） */
export function OfficialValue({ gameId, tier, item }: { gameId: string; tier: string; item: string }) {
  return <span className="font-semibold">「{officialValue(gameId, tier, item)}」</span>;
}
