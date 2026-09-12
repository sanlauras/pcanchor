import Link from 'next/link';
import { tally } from '@/lib/data/summary';

/**
 * 404ページ。
 *
 * これが無いと Next の既定が出る。既定は英語で、しかも
 * `body{background:#fff}` を注入するため暗いサイトなのに白背景になり、
 * `height:100vh` でヘッダー・フッターと分裂して見える。
 * さらにリンクが1つも無く、来た人がそこで行き止まりになる。
 *
 * `global-not-found` ではなく `not-found` にしてあるので、
 * layout の中に描画される＝ヘッダーのナビとフッターがそのまま使える。
 *
 * なお `not-found.tsx` は metadata を export できない（できるのは
 * global-not-found の方）。<title> は layout の既定になるが、
 * Cloudflare が HTTP 404 を返すのでインデックスはされない。
 */
const links = [
  { href: '/', label: 'ホーム', note: 'サイトの入口' },
  {
    href: '/tools/fps',
    label: 'ゲーム別fps予想・ボトルネック診断',
    note: 'GPUとCPUを選ぶと推定fpsとカクつきの底が出ます',
  },
  {
    href: '/tools/build',
    label: '目標fpsから選ぶPC構成',
    note: '出したいfpsから必要なGPUとCPUを逆引きします',
  },
  { href: '/games', label: 'ゲーム別の推奨GPU', note: 'VALORANT / Fortnite' },
  { href: '/gpu', label: 'GPUスペック一覧', note: `${tally.gpuCount}モデル` },
  { href: '/cpu', label: 'CPUスペック一覧', note: `${tally.cpuCount}モデル` },
];

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[1240px] px-5">
      <header className="border-b border-ink pt-14 pb-8">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          404 NOT FOUND
        </p>
        <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          ページが見つかりません
        </h1>
        <p className="max-w-[60ch] text-dim">
          URLが間違っているか、ページが移動・削除された可能性があります。
          お探しのものが下にあるかもしれません。
        </p>
      </header>

      <nav aria-label="主要ページ" className="grid gap-3 py-8 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block border border-rule bg-panel p-5 hover:border-ink"
          >
            <h2 className="font-cond text-lg font-bold">{l.label}</h2>
            <p className="mt-1 text-sm text-dim">{l.note}</p>
          </Link>
        ))}
      </nav>

      <section className="border-l-2 border-rule pb-10 pl-4 text-sm text-dim">
        <p className="max-w-[60ch]">
          リンク切れを見つけた場合は
          <Link href="/contact" className="text-accent underline">
            お問い合わせ
          </Link>
          から教えていただけると助かります。
        </p>
      </section>
    </main>
  );
}
