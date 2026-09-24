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

export type NavLink = { href: string; label: string };

/** ヘッダーのメニュー（PC幅は横並び、スマホは MENU の中） */
export const HEADER_NAV: NavLink[] = [
  { href: '/', label: 'ホーム' },
  ...TOOL_ORDER.map((t) => ({ href: t.href, label: t.short })),
  { href: '/gpu', label: 'GPU' },
  { href: '/cpu', label: 'CPU' },
];
