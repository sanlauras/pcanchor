import { type GameProfile, VALORANT_RESOLUTION_K } from './model';

/**
 * ゲームごとの係数。
 *
 * 出典と算出過程は CONTEXT.md「ゲーム別の係数」「評価済みソース」に記録している。
 * ここの数値を変える前に必ずそちらを読むこと。
 *
 * CLAUDE.md 絶対ルール1: 他社のfps数値表はDB化しない。
 * 保存してよいのは割り算の結果（係数）だけ。
 *
 * lowRatio（1% Low ÷ 平均fps）は小数で持つ。割り算の式で書くと第三者の
 * fps数値そのものがコードに残るため。元の数値と算出過程は CONTEXT.md にある。
 */

/** Valorant 実測: 全て高 → 全て低（4K）= x1.74 */
const VALORANT_LOW_FACTOR = 1.74;

/**
 * Apex でこの性能指数未満のGPUは、測定との照合で +15〜50% 高めに出た。
 * 注記とゲーム別ページの両方で使うので、数字を1か所にまとめている。
 */
const APEX_OVERPREDICTS_BELOW = 15;

export const GAMES: GameProfile[] = [
  {
    id: 'valorant',
    name: 'VALORANT',
    cap: null,
    supported: true,
    confidence: 'measured',
    confidenceLabel: '自前の実測（CapFrameX・4条件）',
    gpuWeight: 1,
    // 基準そのものなので定義上1
    gpuScaling: 1,
    cpuWeight: 1,
    // 競技勢は低設定が多いが、Valorant は高設定でも十分fpsが出るため高を基準にする
    featuredPresetId: 'high',
    source: null,
    notes: [
      '設定でfps上限を解除できるため、全条件を同一タイトルで実測できた唯一のゲームです。',
    ],
    highlight: null,
    // 自前の実測は1台だけで、GPUの帯ごとのズレは確かめられていない
    overpredictsBelowIndex: null,
    presets: [
      {
        id: 'high',
        label: '全て高',
        factor: 1,
        k: VALORANT_RESOLUTION_K,
        // 実測: 4K全て高で 8.19GB
        vram4kMb: 8190,
        // 実測2点: 4K(GPU99%)=0.833 / 1440p(GPU97%)=0.752
        lowRatio: { min: 0.752, max: 0.833 },
      },
      {
        id: 'low',
        label: '全て低',
        factor: VALORANT_LOW_FACTOR,
        k: VALORANT_RESOLUTION_K,
        // 実測: 4K全て低で 8.41GB。画質を下げてもVRAMは減らなかった
        vram4kMb: 8410,
        // 実測2点: 1080p(GPU57%・CPU律速)=0.697 / 4K(GPU99%)=0.758
        lowRatio: { min: 0.697, max: 0.758 },
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
    // 測定GPUが RTX 5070 Ti の1枚だけなので、効き方は確かめようがない。比例とみなす
    gpuScaling: 1,
    // 観測された最大 651fps ÷ Valorant CPU天井 970.3（同じ Ryzen 7 9800X3D）
    cpuWeight: 651 / 970.3,
    // Fortnite の競技勢はほぼ Performance モードを使うため、これを基準にする
    featuredPresetId: 'performance',
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
      comparison: {
        measuredLabel: '公開マッチ',
        lighterLabel: 'クリエイティブなど',
        // ユーザー提供の知見。実測ではないため「目安」として表示する
        lighterMultiplier: 1.33,
        appliesTo: 'all',
      },
    },
    // 測定GPUが1枚だけで、GPUの帯ごとのズレは確かめられていない
    overpredictsBelowIndex: null,
    presets: [
      // 4K の実測 40 / 208 / 315 / 525 fps から、Epic を 1.0 とした倍率
      {
        id: 'performance',
        label: 'Performance（競技用）',
        factor: 525 / 40,
        // クリーンな2点が取れないため Low の指数を流用している
        k: 0.464,
        vram4kMb: 2779,
        // 3解像度で 0.261 / 0.261 / 0.276。ばらつき0.015で全プリセット中もっとも安定。
        // 平均が高くても実際は3分の1近くまで落ちる、というこのサイト固有の発見
        lowRatio: { min: 0.261, max: 0.276 },
        note: '1080p / 1440p では CPU側が上限になります。解像度を下げてもfpsはあまり伸びません。解像度指数は Low から流用した近似値です。',
      },
      {
        id: 'low',
        label: '低',
        factor: 315 / 40,
        k: 0.464,
        vram4kMb: 4256,
        // 3解像度で 0.528 / 0.481 / 0.613
        lowRatio: { min: 0.481, max: 0.613 },
      },
      {
        id: 'medium',
        label: '中',
        factor: 208 / 40,
        k: 0.471,
        vram4kMb: 5124,
        // 3解像度で 0.427 / 0.542 / 0.601
        lowRatio: { min: 0.427, max: 0.601 },
      },
      {
        id: 'epic',
        label: '最高（Epic / Lumen Epic）',
        factor: 1,
        k: 0.639,
        vram4kMb: 9981,
        // 3解像度で 0.594 / 0.671 / 0.750
        lowRatio: { min: 0.594, max: 0.750 },
        note: 'Lumen が有効なため非常に重く、VRAMも 4K で約10GB使います。',
      },
    ],
  },

  {
    id: 'apex',
    name: 'Apex Legends',
    cap: 300,
    supported: true,
    confidence: 'derived',
    confidenceLabel: '許諾を得た第三者の測定から算出した係数',
    // 以下の係数はすべて CONTEXT.md「Apex の係数の算出過程」で算出している。
    // GPU 30枚（Core i9 13900K・射撃訓練場）の 1080p/1440p/4K 最高・66点を、
    // 対数で最小二乗フィットして gpuWeight・gpuScaling・k を同時に求めた
    gpuWeight: 0.267,
    // 性能指数が2倍でfpsは約1.6倍。比例（1）のまま中位GPUに合わせると、RTX 4070〜4080 が平均+25%高く出た
    gpuScaling: 0.665,
    // CPU 15個（RTX 4090・キングスキャニオン・1080p最高）の fps ÷ Valorant CPU天井 の平均。CV 10%
    cpuWeight: 0.351,
    // 高fpsを狙う人向けに、軽い設定を基準にする（Fortnite の Performance と同じ考え方）
    featuredPresetId: 'low',
    // 許諾取得済み（出典の表記は任意）。ユーザーの判断で、測定者の名前もリンクも画面には出さない（2026-09-17）。
    // 出典と算出過程の記録は CONTEXT.md「Apex の係数の算出過程」にある
    source: null,
    notes: [
      '係数は許諾を得たうえで、第三者の測定から算出しています（fps数値表の転載はしていません）。',
      'エンジン仕様で300fpsが上限です。起動オプション +fps_max unlimited で既定の144fps上限は外せますが、300fpsは超えられません。',
      `性能指数${APEX_OVERPREDICTS_BELOW}未満のGPU（GTX 1650 など）では、予想が実際より高めに出る傾向があります。`,
      'CPU側の係数は実戦マップ（キングスキャニオン）での測定から算出しています。CPUが上限を決めている構成では、1% Low は表示より高く出ることがあります。',
    ],
    highlight: {
      title: 'この数値は激しい戦闘シーンでの値です',
      body: 'スモークやテルミット、スコープ越しの射撃を重ねた重い場面の測定から算出しています（測定者によると、実際のプレイの中でも重い側の1割に入る負荷）。実戦マップでのプレイでは、これより高く出ます。',
      comparison: {
        measuredLabel: '激しい戦闘シーン',
        lighterLabel: '実戦マップでのプレイ',
        // 同じ構成（13900K + RTX 4090・4K最高）で場所だけを変えた2つの測定の比。
        // RTX 4090 の1枚だけが根拠なので「上振れ側の目安」。CONTEXT.md「Apex の係数の算出過程」
        lighterMultiplier: 1.35,
        // CPU側の係数は元々実戦マップの測定から作っているので、GPU側だけに掛ける
        appliesTo: 'gpu',
        basis:
          '同じ構成（Core i9 13900K + RTX 4090・4K最高）で、射撃訓練場の重いテストと実戦マップ（キングスキャニオン）を比べた1組の測定から算出。GPU側だけに掛けています。根拠がGPU1枚のため、上振れ側の目安として見てください。',
      },
    },
    overpredictsBelowIndex: APEX_OVERPREDICTS_BELOW,
    // Apex にプリセットは無い。低/中/最高は測定者の定義（CONTEXT.md に中身を記録）。
    // 設定係数は 1080p で GPU律速の10枚（指数15〜45）の平均
    presets: [
      {
        id: 'low',
        label: '低',
        factor: 1.28,
        // 低・中は 1080p しか測定が無いので、最高の解像度指数を流用している
        k: 0.587,
        // 記事の VRAM 使用量は「5GB前後」の概数なので不明扱い
        vram4kMb: null,
        // GPU律速の15点の、上下1割を除いた範囲
        lowRatio: { min: 0.535, max: 0.619 },
        note: 'WQHD / 4K は、最高設定で測った解像度の効き方を流用した近似値です。',
      },
      {
        id: 'medium',
        label: '中',
        factor: 1.21,
        k: 0.587,
        vram4kMb: null,
        // GPU律速の16点の、上下1割を除いた範囲
        lowRatio: { min: 0.543, max: 0.615 },
        note: 'WQHD / 4K は、最高設定で測った解像度の効き方を流用した近似値です。',
      },
      {
        id: 'max',
        label: '最高',
        factor: 1,
        k: 0.587,
        vram4kMb: null,
        // GPU律速の66点（3解像度）の、上下1割を除いた範囲
        lowRatio: { min: 0.496, max: 0.636 },
        note: 'テクスチャストリーミング割り当てを「極（8GB）」にした設定です。',
      },
    ],
  },
];

/*
 * 対応ゲームのデータが揃っているかを、読み込んだ時点で確かめる。
 *
 * supported を true にしたのに presets が空だと、ゲーム別ページが
 * 「Reduce of empty array with no initial value」という原因の分からない
 * エラーでビルドごと落ちる（Apex の追加準備中に実際に踏んだ）。
 * ページ側で握りつぶすとデータの誤りが隠れるので、入口で分かる言葉で止める。
 */
for (const g of GAMES) {
  if (!g.supported) continue;
  if (g.presets.length === 0) {
    throw new Error(
      `${g.name}: supported が true なのに presets が空です。係数が揃ってから有効化してください。`,
    );
  }
  if (!g.presets.some((p) => p.id === g.featuredPresetId)) {
    throw new Error(
      `${g.name}: featuredPresetId「${g.featuredPresetId}」が presets の中にありません。`,
    );
  }
}

/**
 * 対応ゲームの名前を区切り文字でつなぐ。
 *
 * 「VALORANT・Fortnite」のようなゲーム名をページに直書きすると、
 * ゲームを増やしたときに直し忘れて表記が食い違う。ここに集めておけば
 * supported を true にするだけで全ページが追随する。
 */
export function supportedGameNames(separator: string): string {
  return GAMES.filter((g) => g.supported)
    .map((g) => g.name)
    .join(separator);
}

export function findGame(id: string): GameProfile {
  return GAMES.find((g) => g.id === id) ?? GAMES[0]!;
}
