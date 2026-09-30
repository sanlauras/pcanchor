/**
 * 更新履歴（2026-09-27 追加。SEO監査の指摘: 更新日がどこにも無く、情報が新しいか分からない）。
 *
 * **各ページの「最終更新」の日付は、ここから決める。** そのページに関係する記録のうち、いちばん新しい日付。
 * git の日付をビルド時に読む方法は使わない。Cloudflare Pages の取り込み方（浅い clone）によっては
 * 全ファイルが同じ日付になり、不正確な日付を出してしまうため。
 *
 * 書き方の決まり:
 * - 日付は git のコミット日（公開した日）。記憶から書かない
 * - 読む人に関係がある変更だけを書く（内部の整理・文言の微修正は書かない）
 * - areas は影響したページのパス。'/gpu' は一覧と全個別ページ（/gpu/…）の両方を指す。
 *   '*' は全ページ。見た目だけの変更（デザインの作り直しなど）では「内容の更新」にならないので付けない
 * - 新しいものを上に足す
 */

export type ChangelogEntry = {
  date: string;
  title: string;
  body?: string;
  areas: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-30',
    title: 'サイト全体を暗い青のデザインに作り直し',
    body: 'ホームに写真のヒーローを入れ、ヘッダーのメニューを「ツール」「データベース」にまとめました。スマホのメニューは、外をタップすると閉じるようにしています。',
    areas: ['/'],
  },
  {
    date: '2026-09-27',
    title: 'GPU・CPUのページに、モデルごとの情報を追加',
    body: '全モデルの中での位置（図）、前後の世代の同じクラスとの性能差、VRAM が足りなくなる見込みの条件、ゲーム別の 1% Low（カクつき）の目安を載せました。Apex Legends の表には、激しい戦闘シーンの値であることと 300fps の上限を添えています。',
    areas: ['/gpu', '/cpu'],
  },
  {
    date: '2026-09-27',
    title: 'Apex Legends のページに公式の必要・推奨動作環境を掲載',
    body: 'EA 公式の動作環境をそのまま載せ、確認日と出典を添えました。よくある質問の答えにも、数値がどんな場面の値かを書き足しています。',
    areas: ['/games'],
  },
  {
    date: '2026-09-27',
    title: '運営者情報・算出方法・更新履歴のページを追加',
    body: 'このサイトについてのページに運営者の紹介を足し、推定fpsと性能指数の算出方法を1ページにまとめました。',
    areas: ['/about', '/methodology', '/changelog'],
  },
  {
    date: '2026-09-27',
    title: 'ツールの使い勝手を改善',
    body: 'スマホの fps予想で、選んだ直後に結果の要約が見えるようにしました。構成の逆引きは条件が URL に残るようになり、共有やブックマークができます。また、VRAM の判定の単位の食い違いを直しました。VALORANT の 4K 全て高（実測 8.19GB）で、VRAM 8GB の GPU を「足りる」と判定していたため、fps予想で警告を出し、構成の逆引きでは候補から外すようにしています。',
    areas: ['/tools/fps', '/tools/build'],
  },
  {
    date: '2026-09-26',
    title: 'ゲーム・GPU・CPUのページを相互にリンク',
    body: 'ゲームのページに解像度別の必要なGPU・CPU別のfps上限・よくある質問を、GPUのページに組み合わせるCPUの目安を、CPUのページに性能を出し切れるGPUの目安を追加しました。各ページから、そのゲーム・GPU・CPUを選んだ状態で fps予想を開けます。',
    areas: ['/games', '/gpu', '/cpu', '/tools/fps'],
  },
  {
    date: '2026-09-24',
    title: 'サイト全体のデザインを作り直し',
    body: '明るい技術資料風のデザインにしました。',
    areas: ['/'],
  },
  {
    date: '2026-09-22',
    title: 'FPS感度の換算ツールを追加',
    body: 'ゲーム間の感度の換算と、振り向き（cm/360°）の計算ができます。',
    areas: ['/tools/sensitivity', '/tools', '/'],
  },
  {
    date: '2026-09-17',
    title: 'Apex Legends に対応',
    body: 'fps予想・構成の逆引き・ゲーム別ページ・GPU/CPUのページで Apex Legends の推定fpsを出せるようになりました。あわせて、大きく表示する予想fpsを、ゲーム側の上限を除いた理論値にしました（上限で止まる話は補足として添えています）。',
    areas: ['/tools/fps', '/tools/build', '/games', '/gpu', '/cpu', '/'],
  },
  {
    date: '2026-09-12',
    title: '目標fpsから構成を逆引きするツールを追加',
    body: '目標のfpsを選ぶと、届くGPUとCPUの組み合わせを3段階で出します。各モデルのページに Amazon の検索リンクも付けました。',
    areas: ['/tools/build', '/tools', '/gpu', '/cpu', '/'],
  },
  {
    date: '2026-09-12',
    title: 'プライバシーポリシーに Amazon アソシエイトについて追記',
    areas: ['/privacy'],
  },
  {
    date: '2026-09-09',
    title: '1% Low（カクつき）の目安を公開',
    body: 'fps予想で、平均fpsに加えて 1% Low の目安と、モニターのリフレッシュレートに足りるかの判定を出すようにしました。GPU・CPUの一覧には比較機能を付けました。',
    areas: ['/tools/fps', '/gpu', '/cpu'],
  },
  {
    date: '2026-09-03',
    title: 'Fortnite の基準を Performance モードに',
    body: '競技で多く使われる Performance モードを基準の画質にしました。',
    areas: ['/games', '/tools/fps'],
  },
  {
    date: '2026-09-01',
    title: 'サイトを公開',
    body: 'GPU 78モデル・CPU 42モデルのスペックと性能指数、VALORANT・Fortnite の fps予想を公開しました。',
    areas: ['*'],
  },
];

/** パスがその記録の対象か。'/gpu' は '/gpu' と '/gpu/…' の両方に当たる。'/' はホームだけ */
function covers(area: string, path: string): boolean {
  if (area === '*') return true;
  if (area === '/') return path === '/';
  return path === area || path.startsWith(`${area}/`);
}

/** そのページの最終更新日（YYYY-MM-DD）。関係する記録が無ければ公開日 */
export function lastUpdated(path: string): string {
  const dates = CHANGELOG.filter((e) => e.areas.some((a) => covers(a, path))).map((e) => e.date);
  return dates.sort().at(-1)!;
}

/** サイト全体の最終更新日 */
export function siteLastUpdated(): string {
  return CHANGELOG.map((e) => e.date).sort().at(-1)!;
}
