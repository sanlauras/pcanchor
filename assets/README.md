# assets

サイトでそのまま配信しないが、生成の元になる素材を置く。
`public/` と違い、ここのファイルはビルド出力に含まれない。

- `og-source.jpg` — **2026-09-30 から使っていない**（OGP の背景を hero-source.png に替えた）。以前の OGP画像の背景。Gemini で生成した線画の錨（1584x672）。
  文字は入れずに生成し、`scripts/make-og.mjs` でサイトと同じフォントを重ねている。
  差し替えるときは `npm run og` を実行し直すこと。
  2026-09-22 のデザインの作り直しで、この画像は**明るさを反転して**使っている
  （暗い地の光る線 → 紙の色の地に墨の線）。反転の度合いは `make-og.mjs` の LOW / HIGH で調整する。

- `hero-source.png` — ホームのヒーローの背景写真と、OGP画像の背景（ユーザーが生成。2170x725、2026-09-30）。
  左が暗く、右に PC とモニター。差し替えたら `npm run hero`（配信用の WebP を `public/hero/` に作る）と
  `npm run og`（OGP画像）を実行し直すこと。スマホ用の切り抜き位置は `scripts/make-hero.mjs` の MOBILE_CROP、
  OGP の切り抜き位置は `scripts/make-og.mjs` の CROP で調整する。
  明るさ・彩度・光のにじみの強さは `scripts/hero-look.mjs` の LOOK で調整する（両方の画像に効く）。
