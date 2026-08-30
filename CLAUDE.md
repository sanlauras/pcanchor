# プロジェクト指示

ゲーミングPCのfps予想ツール＋GPU/CPUスペックDB。
Next.js / TypeScript / Tailwind / Supabase / Vercel。

## 絶対ルール

1. **他社のベンチマーク数値を転載しない。** ドスパラ、レビューサイト、YouTube等の
   計測値を収集してDB化するのは禁止。データベースの著作物にあたり、利用規約違反にもなる。
   使ってよいのはメーカー公式の公開スペック、メーカー公表IPC、自前の実測、ユーザー投稿のみ。
   公開ベンチは「自前モデルの予測が何%ズレているか」の検算にのみ使う。

2. **数値を記憶から生成しない。** fps値もスペック値も、一次ソースで確認するか
   計算式から導出する。それっぽい数字を書かない。不明なら「不明」と書く。

3. **推定値は必ず推定と明示する。** 予想fpsも性能指数も「推定・誤差±15〜20%」と表示。
   算出方法も公開する。断定的な数値表示はしない。

4. **AI推論をユーザー向け機能で多用しない。** 使われるほど赤字になる。
   計算・診断はブラウザ内で完結させる。解説文をLLM生成する場合は
   条件の組み合わせ単位でキャッシュし、同一条件で再生成しない。

## 作業の進め方

- 実装前にプランモードで方針を出し、承認を得てから書く
- ファイル変更は手動承認。勝手に広範囲を書き換えない
- ユーザーはプログラミング初心者。専門用語には短い説明を添える

## 実測アンカー（唯一の実測データ）

RX 9070 XT + Ryzen 7 9800X3D の1台のみ。Valorantで測定。

```
GPU基準点   4K全て高で 464.6 fps（RX 9070 XT = 指数100）
CPU天井     1080p全て低で 970.3 fps（Ryzen 7 9800X3D = 指数100）
解像度係数  4K→1440p は x1.87（ピクセル比の理論値2.25より緩やか）
設定係数    高→低（4K）は x1.74
```

予想fpsの式:

```
予想fps = min(GPU由来のfps, CPU由来のfps, ゲーム固有の上限)
```

ゲーム固有の上限: Apex Legends = 300fps（エンジン仕様、解除不可）／Valorant = なし

## 詳細ドキュメント

必要になったら読むこと。毎回読む必要はない。

- `CONTEXT.md` — 全判断の記録。指数の計算式と係数、デュアルCCDの扱い、
  VRAMの知見、ユーザー投稿機能の設計要件、公開の順番の判断根拠。
  **指数の計算やデータの扱いに触れる作業の前には必ず読む。**
- `data/*.csv` — 検証済みスペック（GPU 78件 / CPU 42件、全件メーカー公式と照合済み）
- `data/make_index.py` — 指数の計算ロジック
- `prototype/benchmark-list.html` — 一覧ページのプロトタイプ（動作する）

## データ上の注意

- クロックは全てリファレンス仕様値で統一。Founders Edition等の工場OC値と混ぜない
- GPU指数の係数はアーキごとに1つしかないため、近接モデルの順位は信用できない
- NVIDIAのAmpere以降はCUDAコアがFP32倍カウント表記。AMDのRDNAは全世代
  「CU x 64」の一貫表記で倍カウントなし。ここを取り違えると順位が壊れる

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
