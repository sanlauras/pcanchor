import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CHANGELOG } from '@/lib/changelog';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: '更新履歴',
  description:
    'PCアンカーの更新履歴です。対応ゲームの追加、ツールの追加、推定fpsの計算やページの内容の変更を、公開した日付とあわせて記録しています。',
  path: '/changelog',
});

/*
 * 更新履歴（2026-09-27 追加）。中身は src/lib/changelog.ts。
 * 各ページの「最終更新」の日付も同じデータから決めているので、ここと食い違わない。
 */
export default function ChangelogPage() {
  // 同じ日付の記録を1つにまとめる（新しい順）
  const byDate = new Map<string, typeof CHANGELOG>();
  for (const e of CHANGELOG) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  const days = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <main className="mx-auto max-w-[820px] px-5">
      <Breadcrumbs trail={[{ href: '/changelog', label: '更新履歴' }]} />

      <header className="border-b border-frame pt-8 pb-7">
        <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-signal uppercase">
          CHANGELOG
        </p>
        <h1 className="mb-4 font-cond text-[clamp(1.8rem,5vw,3rem)] leading-none font-bold tracking-tight">
          更新履歴
        </h1>
        <p className="max-w-[60ch] text-dim">
          読む人に関係のある変更を、公開した日付とあわせて記録しています。各ページの「最終更新」も、ここに書いた日付から決めています。
        </p>
      </header>

      <ol className="py-6">
        {days.map(([date, entries]) => (
          <li key={date} className="grid gap-x-6 gap-y-2 border-b border-rule-soft py-5 sm:grid-cols-[7.5rem_1fr]">
            <time dateTime={date} className="font-mono text-sm font-semibold tabular-nums">
              {date}
            </time>
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.title}>
                  <p className="font-cond text-base font-bold">{e.title}</p>
                  {e.body && <p className="mt-1 max-w-[70ch] text-sm text-dim">{e.body}</p>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </main>
  );
}
