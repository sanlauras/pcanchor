/**
 * サイトの項目の一覧。ヘッダー・スマホのメニュー・ホーム・ツール一覧・各ツールの見出しがここを読む。
 *
 * ページ名をあちこちに直書きすると、名前を変えたり項目を増やしたときに直し忘れて
 * 表記が食い違う（supportedGameNames() と同じ理由）。項目を増やすときはここに足すだけにする。
 * 記事やまとめを増やすときも、ここに種類を足してホームのセクションに並べる想定。
 *
 * short は見出しやメニューで大きく出す短い名前。long は正式名で、見出しの下に小さく添える
 * （「見出しが長くて見にくい」への対応。2026-09-22 のデザインの作り直しで導入）。
 */

export type SiteTool = {
  href: string;
  /** 大きく出す短い名前 */
  short: string;
  /** 正式名。見出しの下や検索向けの文言に使う */
  long: string;
  /** 見出しの上に出す英字の小見出し */
  eyebrow: string;
  /** 一覧で添える一文 */
  note: string;
  /** ホームの表の「入力」「出力」 */
  input: string;
  output: string;
};

export const TOOLS = {
  fps: {
    href: '/tools/fps',
    short: 'FPS予想',
    long: 'ゲーム別fps予想・ボトルネック診断',
    eyebrow: 'TOOL / FPS PREDICTOR',
    note: 'GPUとCPUを選ぶだけ。どちらが足を引っ張っているかまで分かります',
    input: 'GPU・CPU・ゲーム・画質',
    output: '平均fps・1% Low・律速',
  },
  build: {
    href: '/tools/build',
    short: '構成選び',
    long: '目標fpsから選ぶPC構成',
    eyebrow: 'TOOL / BUILD PICKER',
    note: '出したいfpsを入れると、それを満たすGPUとCPUが分かります',
    input: 'ゲーム・画質・目標fps',
    output: '届く最小のGPU・CPU',
  },
  sensitivity: {
    href: '/tools/sensitivity',
    short: '感度換算',
    long: 'FPS感度の換算・振り向き距離の計算',
    eyebrow: 'TOOL / SENSITIVITY',
    note: 'ゲームを移っても同じ振り向き距離になる感度が分かります',
    input: '感度・eDPI・DPI',
    output: 'cm/360・各ゲームの感度',
  },
  games: {
    href: '/games',
    short: '推奨GPU',
    long: 'ゲーム別の推奨GPU',
    eyebrow: 'GAMES',
    note: 'GPU別に何fps出るかを、ゲームごとに一覧で',
    input: 'ゲーム',
    output: 'GPU別の推定fps',
  },
} satisfies Record<string, SiteTool>;

/** ホームやツール一覧で並べる順番 */
export const TOOL_ORDER: SiteTool[] = [TOOLS.fps, TOOLS.build, TOOLS.sensitivity, TOOLS.games];

export type NavLink = {
  href: string;
  label: string;
  /** スマホのメニューで名前の下に小さく添える正式名。ページの見出しと同じ言葉を使う */
  sub?: string;
};

/** ヘッダーのいちばん左。まとめではなく、そのままのリンク */
export const HOME_NAV: NavLink = { href: '/', label: 'ホーム' };

export type NavGroup = { label: string; items: NavLink[] };

/**
 * ヘッダーのメニューのまとめ（2026-09-30 ユーザーの要望。valorantnews.jp を参考にした形）。
 * PC は「ツール ∨」「データベース ∨」にカーソルを合わせると下に一覧が出る。スマホの MENU も同じまとめ方で区切る。
 *
 * 「推奨GPU」（ゲーム別の推奨GPU）は、ゲームごとに GPU の推定fps を並べたデータなので「データベース」に入れている。
 * 名前と説明は TOOLS と、GPU・CPU 一覧の既存の言葉をそのまま使う（新しい文言は作らない）。
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ツール',
    items: [TOOLS.fps, TOOLS.build, TOOLS.sensitivity].map((t) => ({ href: t.href, label: t.short, sub: t.long })),
  },
  {
    label: 'データベース',
    items: [
      { href: '/gpu', label: 'GPU', sub: 'GPUスペック一覧' },
      { href: '/cpu', label: 'CPU', sub: 'CPUスペック一覧' },
      { href: TOOLS.games.href, label: TOOLS.games.short, sub: TOOLS.games.long },
    ],
  },
];

/** サイトについての入口。フッターと、スマホのメニューの下の段で使う */
export const SITE_INFO_NAV: NavLink[] = [
  { href: '/about', label: 'このサイトについて・運営者' },
  { href: '/methodology', label: '算出方法' },
  { href: '/changelog', label: '更新履歴' },
];

/**
 * いま開いているページが、そのメニュー項目の中か（ヘッダーの下線とスマホのメニューの印に使う）。
 * ホーム（/）は、ホームそのものを開いているときだけ当たりにする（全ページが / で始まるため）。
 */
export function isCurrentSection(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
