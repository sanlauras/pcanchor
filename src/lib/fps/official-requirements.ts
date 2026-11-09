/**
 * ゲーム会社が公表している動作環境（2026-09-27 追加。SEO監査の指摘:「Apex 推奨スペック」で探す人は公式の条件を見たい）。
 *
 * **公式ページの記載を、そのまま写す。** 書き換えない・補わない・記憶から書かない（CLAUDE.md 絶対ルール2）。
 * 確認日と出典の URL を必ず添え、公式が更新されたら確認し直す。
 * ここの値は fps の計算には使わない（公式の条件は「動くかどうか」の目安で、fps の根拠ではないため）。
 *
 * VALORANT は 2026-11-09 に追加（全面再設計・段階5）。Riot Games のサポートページ（日本語）を取得し、表と注意書きを原文どおりに写した。
 *   表の RAM と OS の欄は、公式の表で3つの区分にまたがる1つの欄（colspan=3）なので、3つの区分すべてに同じ値を入れた。
 *   箇条書きの項目は「 / 」でつないだ（語句は変えていない）。
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
  /** 公式ページの表の外にある注意書き。原文のまま */
  notes?: string[];
};

export const OFFICIAL_REQUIREMENTS: Record<string, OfficialRequirements> = {
  valorant: {
    tiers: [
      {
        label: '必要動作環境（30 FPS）',
        rows: [
          ['CPU', 'Intel i3-540 / AMD Athlon 200GE / ARM：非対応'],
          ['GPU', 'Intel HD 4000 / AMD Radeon R5 220'],
          ['RAM', '4GB'],
          ['OS', 'Windows 10（ビルド19041以降）64-bit / Windows 11 64ビット'],
        ],
      },
      {
        label: '推奨動作環境（60 FPS）',
        rows: [
          ['CPU', 'Intel i3-4150 / AMD Ryzen 3 1200 / ARM：非対応'],
          ['GPU', 'NVIDIA GeForce GT 730 / AMD Radeon R7 240'],
          ['RAM', '4GB'],
          ['OS', 'Windows 10（ビルド19041以降）64-bit / Windows 11 64ビット'],
        ],
      },
      {
        label: 'ハイエンド動作環境（144 FPS）',
        rows: [
          ['CPU', 'Intel i5-9400F 2.90GHz / AMD Ryzen 5 2600X / ARM：非対応'],
          ['GPU', 'NVIDIA GTX 1050 Ti / AMD Radeon R7 370 / Intel Arc A310'],
          ['RAM', '4GB'],
          ['OS', 'Windows 10（ビルド19041以降）64-bit / Windows 11 64ビット'],
        ],
      },
    ],
    notes: [
      'SSE 4.2またはAVXサポートが必要',
      '注意：あなたのPCが専用グラフィックスカードまたはディスクリートGPUを使用している場合、少なくとも1GBのVRAMも必要になります。',
      'DirectX 11対応必須',
      'Windows 10のサポートが利用可能です（Build 10904以上）。ただし、このゲームには最新のグラフィックドライバーが必要であり、そのためにはより新しいWindowsビルドが必要になる場合があります。',
      'Windows 11ではTPM 2.0とUEFI Secure Bootの有効化も必要です。',
      'VALORANTはクラウドゲームや仮想マシンには対応していません。',
    ],
    sourceLabel: 'Riot Games「PCの必要動作環境と推奨動作環境 - VALORANT Support」',
    sourceUrl: 'https://support.riotgames.com/ja/valorant/support-tools/minimum-recommended-pc-specs',
    checkedOn: '2026-11-09',
    caveat:
      'RAM と OS は、公式の表では3つの区分に共通の1つの欄です。また、表の OS 欄は「ビルド19041以降」、同じページの Windows 10 の説明は「Build 10904以上」とビルド番号が食い違っていますが、公式の記載のまま載せています。（30 FPS）などの fps は Riot Games が示している目安で、当サイトの推定ではありません',
  },
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
