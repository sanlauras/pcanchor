/**
 * ブログ記事の型（2026-10-13 追加）。
 *
 * 記事1本＝ src/content/blog/ の TSX ファイル1つ。中身は「記事の情報（meta）」「目次（toc）」「本文（Body）」。
 * 新しいライブラリ（MDX など）は入れず、本文は React の部品で書く。本文の中に、当サイトの計算（predict）から
 * 作った表や値を部品として埋め込めるので、fps の数字を手で書かずに済む（CLAUDE.md「ブログ記事の決まり」）。
 *
 * 将来 AI で下書きを作るときも、この形のファイルを1つ足し、人が中身と出典を確かめてから status を published にする。
 */

export type BlogCategoryId = 'game-pc' | 'fps' | 'parts';

export type BlogSource = {
  /** 出典の名前（例: EA 公式「Apex Legends PC 動作環境」） */
  label: string;
  url: string;
  /** 出典のページを開いて内容を確かめた日（YYYY-MM-DD） */
  checkedOn: string;
};

export type BlogMeta = {
  /** URL の最後（/blog/[slug]）。英小文字とハイフンだけ。'category' は使わない（カテゴリの URL と重なるため） */
  slug: string;
  /** 記事の見出し（H1）と検索結果の題名 */
  title: string;
  /** 検索結果の説明文。記事ごとに固有にする */
  description: string;
  /** 記事の冒頭の導入文（読者の悩みと、この記事で分かること） */
  lead: string;
  category: BlogCategoryId;
  /** 公開日・更新日（YYYY-MM-DD）。更新日は、実際に中身を確認・変更した日だけを入れる */
  publishedAt: string;
  updatedAt: string;
  /** draft は公開のビルドに出さない（ページもサイトマップも作らない）。npm run dev のときだけ見られる */
  status: 'draft' | 'published';
  /** 狙う検索語と、その裏にある悩み（書く前に決める。画面には出さない） */
  targetKeyword: string;
  relatedKeywords: string[];
  searchIntent: string;
  /** 記事の冒頭に出す要点（3つ前後） */
  keyPoints: string[];
  /** 出典。本文で使った公式情報など */
  sources: BlogSource[];
  /** 関連記事の slug（関係の深いものだけ。自動では選ばない） */
  related: string[];
  /** この記事を「関連する記事」として出す既存ページ（例: /tools/fps、/games/fortnite） */
  relatedPages: string[];
  /** この記事にある製品の置き場所（<ProductSlot slot="…" /> と同じ名前）。広告の表示を出すかの判定に使う */
  productSlots: string[];
  /** ブログトップの「注目の記事」に出すか */
  featured?: boolean;
};

export type BlogTocItem = { id: string; label: string };

export type BlogPost = {
  meta: BlogMeta;
  toc: BlogTocItem[];
  Body: () => React.ReactNode;
};
