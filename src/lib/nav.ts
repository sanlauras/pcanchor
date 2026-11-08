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
  /**
   * この項目の前に区切りを入れ、小見出しを付ける（2026-11-09。ツールのまとめで「感度換算」を一段下げるため）。
   * 区切りより下は、まとめの中で優先度が低い項目
   */
  section?: string;
};

/** ホーム。2026-11-09 からヘッダーではロゴがホームへのリンクを兼ね、スマホのメニューの先頭にだけ置く */
export const HOME_NAV: NavLink = { href: '/', label: 'ホーム' };

/**
 * ブログ（2026-10-13 追加）。2026-11-09 の全面再設計で、メニューでの名前を「PC選びのガイド」にした
 * （記事の中身＝ゲーミングPCの選び方に合わせた名前。URL は /blog のまま）
 */
export const BLOG_NAV: NavLink = { href: '/blog', label: 'PC選びのガイド', sub: 'ゲーミングPCの選び方と解説' };

export type NavGroup = { label: string; items: NavLink[] };

/** サイトについての入口。メニューの「PC ANCHOR について」と、フッターで使う */
export const SITE_INFO_NAV: NavLink[] = [
  { href: '/about', label: 'このサイトについて・運営者', sub: '運営者と実測環境' },
  { href: '/methodology', label: '算出方法', sub: '推定fpsと性能指数の計算のしかた' },
  { href: '/changelog', label: '更新履歴', sub: 'データと計算の更新' },
];

/**
 * ヘッダーのメニュー（2026-11-09 の全面再設計。ユーザーの依頼の5項目）。
 *   1. PC診断・ツール   2. ゲーム別   3. GPU・CPUデータベース   4. PC選びのガイド（/blog。まとめではなく1つのリンク）
 *   5. PC ANCHOR について
 * 4 は NAV_LINK_AFTER_GROUPS として別に持つ（まとめではないため）。
 *
 * ゲームの項目は、対応しているゲームの一覧（src/lib/fps/games.ts）から作るので、引数で受け取る。
 * このファイルはヘッダーの部品（ブラウザで動く）からも読まれるため、計算の本体を含む games.ts をここで import しない。
 * 作るのはサーバー側の layout（src/app/layout.tsx）。
 */
export function mainNavGroups(gameLinks: NavLink[]): { before: NavGroup[]; after: NavGroup[] } {
  return {
    before: [
      {
        label: 'PC診断・ツール',
        items: [
          { href: TOOLS.fps.href, label: TOOLS.fps.short, sub: TOOLS.fps.long },
          { href: TOOLS.build.href, label: TOOLS.build.short, sub: TOOLS.build.long },
          { href: TOOLS.sensitivity.href, label: TOOLS.sensitivity.short, sub: TOOLS.sensitivity.long, section: 'その他のツール' },
        ],
      },
      {
        label: 'ゲーム別',
        items: [...gameLinks, { href: TOOLS.games.href, label: 'ゲーム一覧', sub: TOOLS.games.long, section: 'すべてのゲーム' }],
      },
      {
        label: 'GPU・CPUデータベース',
        items: [
          { href: '/gpu', label: 'GPU', sub: 'GPUスペック一覧' },
          { href: '/cpu', label: 'CPU', sub: 'CPUスペック一覧' },
        ],
      },
    ],
    after: [{ label: 'PC ANCHOR について', items: SITE_INFO_NAV }],
  };
}

/**
 * いま開いているページが、そのメニュー項目の中か（ヘッダーの下線とスマホのメニューの印に使う）。
 * ホーム（/）は、ホームそのものを開いているときだけ当たりにする（全ページが / で始まるため）。
 */
export function isCurrentSection(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
