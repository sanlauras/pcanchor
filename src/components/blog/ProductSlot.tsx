import { productsForSlot } from '@/content/products';

/**
 * 記事の中の製品の置き場所（2026-10-13）。製品の情報とアフィリエイトリンクは src/content/products.ts で管理する。
 *
 * - その置き場所に、公開してよい製品（アフィリエイトの URL と確認日つきの情報がそろったもの）が無いときは、
 *   **公開では見出しごと何も出さない**（誤った購入リンクや、確認していない価格を出さない）
 * - 開発中（npm run dev）だけ、未設定だと分かる枠を出す（記事を書く人が、あとで製品を足す場所を見つけられるように）
 * - 購入リンクには rel="sponsored"（有料リンクの申告。Google の要求）
 */
export function ProductSlot({ slot, title }: { slot: string; title: string }) {
  const list = productsForSlot(slot);
  if (list.length === 0) {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <div className="my-6 rounded-lg border-2 border-dashed border-[#b45309] bg-[#fff7ed] p-4 text-sm">
        <p className="font-bold">【開発中だけの表示】製品の置き場所「{slot}」（{title}）に、まだ製品がありません</p>
        <p className="mt-1 text-dim">
          src/content/products.ts に、公式ページで確かめた情報（確認日つき）と案件のアフィリエイト URL を入れ、slots に「{slot}」を書くと、ここに製品が出ます。公開のページには、この枠は出ません。
        </p>
      </div>
    );
  }
  return (
    <section className="my-8">
      <p className="mb-3 font-cond text-base font-bold">{title}</p>
      <div className="space-y-4">
        {list.map((p) => (
          <div key={p.id} className="rounded-xl border border-frame bg-panel p-5 shadow-glow">
            <p className="text-xs text-dim">{p.maker}</p>
            <p className="font-cond text-lg font-bold">{p.name}</p>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {[
                ['CPU', p.cpu],
                ['GPU', p.gpu],
                ['メモリ', p.memory],
                ['ストレージ', p.storage],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt className="text-dim">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {p.priceYen !== null && (
              <p className="mt-3 text-sm">
                参考価格 <span className="font-mono font-semibold">{p.priceYen.toLocaleString('ja-JP')}円</span>
                <span className="ml-2 text-xs text-dim">
                  （{p.priceCheckedOn} 時点・税込。最新の価格・在庫・納期・保証は販売ページで確認してください）
                </span>
              </p>
            )}
            <a
              href={p.affiliateUrl}
              target="_blank"
              rel="sponsored noopener"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent-vivid px-4 py-2.5 font-cond text-sm font-bold text-on-accent hover:brightness-110"
            >
              販売ページで構成と価格を見る<span aria-hidden>→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
