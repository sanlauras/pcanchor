import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * 静的書き出し。全ページが静的生成なのでサーバーは不要で、
   * Cloudflare Pages に out/ を置くだけで動く。
   *
   * この設定があるとサーバー依存の機能（Route Handlers・ISR・
   * Server Actions・リダイレクト等）を使った時点でビルドが落ちる。
   * 意図せずホスティング要件が上がるのを防ぐ歯止めにもなっている。
   */
  output: 'export',
};

export default nextConfig;
