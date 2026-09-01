# PCアンカー（PC Anchor）

ゲーミングPCのfps予想とボトルネック診断、GPU/CPUスペックデータベース。
https://pcanchor.jp

## 方針

- モデル別の性能は**メーカー公式スペックから自前で計算**する
- ゲーム別の係数は**自前の実測**と、**許諾を得た第三者の測定から算出した比率**のみ
- 他社のfps数値表は転載しない
- 根拠が足りない値は出さない（1% Low・終盤の高負荷時など）

詳細は `CLAUDE.md`（守るべきルール）、`CONTEXT.md`（判断の記録）、
`ROADMAP.md`（作る順番）を参照。

## 開発

```bash
npm install
npm run dev      # data:build が自動で走る
npm run build
npm run lint
```

`data/*.csv` が唯一の正。編集して再ビルドすると
`src/lib/data/generated/` が作り直される（`npm run data:build`）。
スペックの結合、slugの重複、実測の再現テストはすべてビルド時に検証され、
ズレるとビルドが落ちる。

## 環境変数

| 変数 | 既定値 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://pcanchor.jp` | canonical / sitemap / OGP の絶対URL |

ステージング等で変えたいときだけ設定する。

## 構成

```
data/                 検証済みスペック（CSV）と指数の計算スクリプト
scripts/build-data.mts CSV -> 型付きデータへの変換と検証
src/lib/data/         データ層（生成物を含む）
src/lib/fps/          fps予想の計算式・係数・診断・実測の再現テスト
src/app/              ページ
prototype/            移植元のプロトタイプ（参照用・未使用）
```
