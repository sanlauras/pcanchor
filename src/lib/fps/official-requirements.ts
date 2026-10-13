/**
 * ゲーム会社が公表している動作環境（2026-09-27 追加。SEO監査の指摘:「Apex 推奨スペック」で探す人は公式の条件を見たい）。
 *
 * **公式ページの記載を、そのまま写す。** 書き換えない・補わない・記憶から書かない（CLAUDE.md 絶対ルール2）。
 * 確認日と出典の URL を必ず添え、公式が更新されたら確認し直す。
 * ここの値は fps の計算には使わない（公式の条件は「動くかどうか」の目安で、fps の根拠ではないため）。
 *
 * VALORANT は、公式ページを取得して確認できていないため載せていない。確認できたら同じ形で足す。
 * Fortnite は 2026-10-13 に追加。Epic のページは自動の取得を拒否されたため、ユーザーが公式ページのスクリーンショットを
 * 撮ってくれたものを、原文どおりに写した（同じページの「クオリティプリセット『最高』の要件」は画像に無かったので入れていない）。
 */

export type OfficialRequirements = {
  /** 公式の呼び方（「必要動作環境」「推奨動作環境」） */
  tiers: { label: string; rows: [string, string][] }[];
  sourceLabel: string;
  sourceUrl: string;
  /** 公式ページを見て、この内容と一致することを確かめた日 */
  checkedOn: string;
  /** 公式の記載そのものについての注意（例: 数字の食い違い）。書き換えずに注意だけ添える */
  caveat?: string;
};

export const OFFICIAL_REQUIREMENTS: Record<string, OfficialRequirements> = {
  fortnite: {
    tiers: [
      {
        label: '最小システム要件',
        rows: [
          ['ビデオカード', 'PC上のIntel HD 4000、AMD Radeon Vega 8'],
          ['プロセッサ', 'Core i3-3225 3.3 GHz'],
          ['メモリ', '8GBのRAM'],
          ['OS', 'Windows 10(64ビット版) バージョン22H2またはWindows 10 Enterprise(64ビット版) バージョン21H2'],
        ],
      },
      {
        label: '推奨システム要件',
        rows: [
          ['ビデオカード', 'Nvidia GTX 960、AMD R9 280、同等のDX11対応GPU'],
          ['ビデオメモリ', '2GBのVRAM'],
          ['プロセッサ', 'Core i5-7300U 3.5 GHz、AMD Ryzen 3 3300U、または同等のプロセッサ'],
          ['メモリ', '16GB以上のRAM'],
          ['ハードドライブ', 'NVMe SSD'],
          ['OS', 'Windows 10/11 64-bit'],
        ],
      },
    ],
    sourceLabel: 'Epic Games ヘルプ「PC上で『フォートナイト』に最低限必要なシステム要件」',
    sourceUrl:
      'https://www.epicgames.com/help/ja-JP/c-Category_Fortnite/c-Fortnite_TechnicalSupport/what-are-the-minimum-system-requirements-to-play-fortnite-a000084793',
    checkedOn: '2026-10-13',
  },
  apex: {
    tiers: [
      {
        label: '必要動作環境',
        rows: [
          ['OS', '64ビット版Windows 10'],
          ['CPU', 'Intel Core i3-6300 3.8 GHz / AMD FX-4350 4.2 GHz Quad-Core プロセッサ'],
          ['メモリ', '6 GB'],
          ['GPU', 'NVIDIA GTX 950 / AMD Radeon HD 7790（Feature Level 12_0必須）'],
          ['GPU RAM', '2 GB'],
          ['ストレージ', '75 GB以上の空き容量'],
          ['DirectX', 'DirectX 12'],
        ],
      },
      {
        label: '推奨動作環境',
        rows: [
          ['OS', '64ビット版Windows 10'],
          ['CPU', 'Intel i5 3570Kおよび同等のプロセッサ'],
          ['メモリ', '8 GB'],
          ['GPU', 'Nvidia GeForce GTX 970 / AMD Radeon R9 290'],
          ['GPU RAM', '8 GB'],
          ['ストレージ', '75 GB以上の空き容量'],
        ],
      },
    ],
    sourceLabel: 'EA 公式「Apex Legends PC 動作環境」',
    sourceUrl: 'https://www.ea.com/ja-jp/games/apex-legends/about/pc-system-requirements',
    checkedOn: '2026-09-27',
    caveat:
      '推奨の「GPU RAM 8 GB」は、同じ欄の GeForce GTX 970（VRAM 4GB）とは合いませんが、公式の記載のまま載せています。',
  },
};

/** 公式の表の1項目（例: フォートナイトの推奨のメモリ）。記事の本文に、公式の記載をそのまま出すときに使う */
export function officialValue(gameId: string, tierLabel: string, item: string): string {
  const v = OFFICIAL_REQUIREMENTS[gameId]?.tiers.find((t) => t.label === tierLabel)?.rows.find(([k]) => k === item)?.[1];
  if (!v) throw new Error(`公式の動作環境: ${gameId} の「${tierLabel}」に「${item}」がありません`);
  return v;
}
