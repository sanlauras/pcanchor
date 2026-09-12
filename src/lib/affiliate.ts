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

/** モデル名でAmazonを検索するURL。タグ未設定なら null */
export function amazonSearchUrl(query: string): string | null {
  if (TAG === '') return null;
  const url = new URL('https://www.amazon.co.jp/s');
  url.searchParams.set('k', query);
  url.searchParams.set('tag', TAG);
  return url.toString();
}
