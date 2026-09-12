/**
 * Amazonアソシエイトのリンク。
 *
 * **商品ASINでは紐付けない。** 120モデル分を人手で対応付ける必要があり、
 * 型番違い・在庫切れ・新モデルの登場で必ず陳腐化して維持できない。
 * モデル名からの検索URLなら自動生成でき、在庫切れにも強い。
 *
 * 価格は出していない。価格を出すには Creators API が必要で、その利用には
 * 「直近30日で10件以上の適格販売」が要る（Amazon公式ドキュメント）。
 * 旧 PA-API 5.0 は廃止済みで403を返す。
 * 詳細は CONTEXT.md「アフィリエイトの判断」。
 *
 * **推奨ロジックはこのファイルを一切参照しない。** 逆引きツールが選ぶ候補は
 * 性能指数だけで決まっており、広告の有無は順番に影響しない。ここが崩れると
 * サイトの信用が崩れるので、build.ts から affiliate.ts を import しないこと。
 */

/**
 * アソシエイトタグ（トラッキングID）。`xxxxx-22` の形式。
 *
 * URLに載って公開される情報なので秘密ではない。
 * Creators API の認証情報とは別物で、そちらは絶対にリポジトリに入れない。
 *
 * site.ts の SITE.url と同じ流儀で、既定値をコードに置いて環境変数で上書きできる。
 * 空文字を渡すとリンクも開示文も出なくなる（リンクが無いのに
 * 「収入を得ています」と書くと事実に反するため、その状態も作れるようにしてある）。
 */
const TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? 'sososi27-22';

export function hasAmazonTag(): boolean {
  return TAG !== '';
}

/** 規約で指定された開示文。文言を勝手に変えないこと */
export const AMAZON_DISCLOSURE =
  'Amazonのアソシエイトとして、PCアンカーは適格販売により収入を得ています。';

/**
 * 検索語はモデル名だけにする。
 *
 * 一度カテゴリ名（「グラフィックボード」等）を足し、価格の安い順に並べたが、
 * **両方とも逆効果だった**（実機で確認済み）:
 *
 *   「RTX 5060 グラフィックボード」＋安い順
 *     → upHere グラボステー ¥1,480（アクセサリ。商品名に
 *        「汎用グラフィックボード」が入るので語で拾ってしまう）
 *     → RTX 2060 SUPER 整備済み品 ¥19,800（別モデル・中古）
 *     → RTX 5060 Ti（別グレード）
 *
 *   「GeForce RTX 5060」だけ・おすすめ順
 *     → MSI GeForce RTX 5060 8G ¥65,455（正解）
 *
 * モデル名は十分に特徴的なので、余計な語を足さない方がよい。
 * 並べ替えも指定しない（安い順にすると整備済み品や下位モデルが上に来る）。
 * カテゴリの限定（i=computers）だけは別カテゴリの混入を防ぐので残す。
 */

export type PartKind = 'gpu' | 'cpu';

export function amazonSearchUrl(query: string): string | null {
  if (TAG === '') return null;
  const url = new URL('https://www.amazon.co.jp/s');
  url.searchParams.set('k', query);
  // パソコン・周辺機器に限定して、別カテゴリの混入を減らす
  url.searchParams.set('i', 'computers');
  url.searchParams.set('tag', TAG);
  return url.toString();
}
