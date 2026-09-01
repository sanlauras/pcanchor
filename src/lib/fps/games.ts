import { type GameProfile, VALORANT_RESOLUTION_K } from './model';

/**
 * ゲームごとの係数。
 *
 * 出典と算出過程は CONTEXT.md「ゲーム別の係数」「評価済みソース」に記録している。
 * ここの数値を変える前に必ずそちらを読むこと。
 *
 * CLAUDE.md 絶対ルール1: 他社のfps数値表はDB化しない。
 * 保存してよいのは割り算の結果（係数）だけ。
 */

/** Valorant 実測: 全て高 → 全て低（4K）= x1.74 */
const VALORANT_LOW_FACTOR = 1.74;

export const GAMES: GameProfile[] = [
  {
    id: 'valorant',
    name: 'VALORANT',
    cap: null,
    supported: true,
    confidence: 'measured',
    confidenceLabel: '自前の実測（CapFrameX・4条件）',
    gpuWeight: 1,
    cpuWeight: 1,
    source: null,
    notes: [
      '設定でfps上限を解除できるため、全条件を同一タイトルで実測できた唯一のゲームです。',
    ],
    highlight: null,
    presets: [
      {
        id: 'high',
        label: '全て高',
        factor: 1,
        k: VALORANT_RESOLUTION_K,
        // 実測: 4K全て高で 8.19GB
        vram4kMb: 8190,
      },
      {
        id: 'low',
        label: '全て低',
        factor: VALORANT_LOW_FACTOR,
        k: VALORANT_RESOLUTION_K,
        // 実測: 4K全て低で 8.41GB。画質を下げてもVRAMは減らなかった
        vram4kMb: 8410,
        note: '実測では画質を下げてもVRAM使用量は減りませんでした（8.19GB→8.41GB）。',
      },
    ],
  },

  {
    id: 'fortnite',
    name: 'Fortnite',
    cap: null,
    supported: true,
    confidence: 'derived',
    confidenceLabel: 'Boss Benchmarks さんの実測から算出した係数',
    // 4K Epic 40fps ÷ RTX 5070 Ti の Valorant 4K高 467.5
    gpuWeight: 40 / 467.5,
    // 観測された最大 651fps ÷ Valorant CPU天井 970.3（同じ Ryzen 7 9800X3D）
    cpuWeight: 651 / 970.3,
    // 作者から「出典の記載は不要」との回答を得ているため、画面には出さない。
    // 検算のための記録は CONTEXT.md「Fortnite の係数の算出過程」に残してある。
    // 元動画: https://www.youtube.com/watch?v=A5ACNelDcRU
    source: null,
    notes: [
      '係数は許諾を得たうえで、Boss Benchmarks さんの実測から算出しています（fps数値表の転載はしていません）。',
    ],
    highlight: {
      title: 'この数値は公開マッチでの値です',
      body: 'クリエイティブなど負荷の軽い場所では、これを大きく上回ります。同じPCでも遊ぶ場所でfpsが変わるので、公開マッチの数値として見てください。',
      measuredLabel: '公開マッチ',
      lighterLabel: 'クリエイティブなど',
      // ユーザー提供の知見。実測ではないため「目安」として表示する
      lighterMultiplier: 1.33,
    },
    presets: [
      // 4K の実測 40 / 208 / 315 / 525 fps から、Epic を 1.0 とした倍率
      {
        id: 'performance',
        label: 'Performance（競技用）',
        factor: 525 / 40,
        // クリーンな2点が取れないため Low の指数を流用している
        k: 0.464,
        vram4kMb: 2779,
        note: '1080p / 1440p では CPU側が上限になります。解像度を下げてもfpsはあまり伸びません。解像度指数は Low から流用した近似値です。',
      },
      {
        id: 'low',
        label: '低',
        factor: 315 / 40,
        k: 0.464,
        vram4kMb: 4256,
      },
      {
        id: 'medium',
        label: '中',
        factor: 208 / 40,
        k: 0.471,
        vram4kMb: 5124,
      },
      {
        id: 'epic',
        label: '最高（Epic / Lumen Epic）',
        factor: 1,
        k: 0.639,
        vram4kMb: 9981,
        note: 'Lumen が有効なため非常に重く、VRAMも 4K で約10GB使います。',
      },
    ],
  },

  {
    id: 'apex',
    name: 'Apex Legends',
    cap: 300,
    supported: false,
    confidence: 'derived',
    confidenceLabel: '係数なし',
    gpuWeight: 0,
    cpuWeight: 0,
    source: null,
    notes: [
      'エンジン仕様で300fpsが上限です。+fps_max 0 でも解除できないため、上限より上を測定できず係数が取れていません。',
    ],
    highlight: null,
    presets: [],
  },
];

export function findGame(id: string): GameProfile {
  return GAMES.find((g) => g.id === id) ?? GAMES[0]!;
}
