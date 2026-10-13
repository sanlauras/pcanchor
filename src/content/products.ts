/**
 * 記事で紹介する製品（BTO パソコンなど）と、そのアフィリエイトリンク（2026-10-13 追加）。
 *
 * 記事の本文とは分けて、ここ1か所で管理する。記事には「置き場所（slot）」だけを書いておき（<ProductSlot slot="…" />）、
 * 案件が決まったら、ここに製品を1件足して slots にその置き場所を書くだけで、記事の文章を直さずに製品が出る。
 *
 * 決まり:
 * - **製品の情報は、メーカー公式ページで確かめたものだけ**を入れる。価格は変わるので必ず確認日を入れる（記憶から書かない）
 * - **affiliateUrl は案件ごとに別**。全部の製品に同じ URL を使わない。架空の URL を入れない。
 *   空のあいだは購入リンクを出さない（公開では製品の枠ごと出さない。開発中だけ「リンク未設定」と分かる表示）
 * - 記事に広告リンクが1つでも出るときだけ、記事の冒頭に広告の表示が自動で出る（広告が無いのに出さない）
 *
 * 2026-10-13 時点: ユーザーの判断で、案件が決まるまで製品は登録していない。
 */

export type Product = {
  id: string;
  name: string;
  maker: string;
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  /** 参考価格（税込・円）。確認日とセットで入れる */
  priceYen: number | null;
  /** 価格と構成を公式ページで確かめた日（YYYY-MM-DD） */
  priceCheckedOn: string | null;
  /** メーカー公式の製品ページ（購入リンクとしては出さない。情報の出典） */
  officialUrl: string;
  /** アフィリエイトの URL（案件ごとに別）。空なら購入リンクを出さない */
  affiliateUrl: string;
  /** 記事のどの置き場所に出すか（例: 'fortnite-240'）。1つの製品を複数の記事に出してよい */
  slots: string[];
  /** 成果条件などの管理用のメモ（画面には出さない） */
  note?: string;
};

export const PRODUCTS: Product[] = [];

/** 公開してよい製品か（アフィリエイトの URL と、確認日つきの情報がそろっている） */
export function isProductReady(p: Product): boolean {
  return p.affiliateUrl.trim() !== '' && p.priceCheckedOn !== null;
}

/** その置き場所に出す、公開してよい製品 */
export function productsForSlot(slot: string): Product[] {
  return PRODUCTS.filter((p) => p.slots.includes(slot) && isProductReady(p));
}

/** 記事の置き場所のどれかに、公開してよい製品（＝広告リンク）があるか。記事の冒頭の広告の表示に使う */
export function hasAdIn(slots: string[]): boolean {
  return slots.some((s) => productsForSlot(s).length > 0);
}
