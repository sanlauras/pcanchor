/**
 * ブログ記事の本文の部品（2026-10-13）。記事のファイルはこれを組み合わせて書く。
 *
 * 読みやすさの方針: 1行は長文向けに絞る（約40字）、行間を広め、段落は短く。見出しは目次から飛べるよう id を持つ。
 * 2026-11-09 からサイト全体と同じ暗い配色。注意の枠と表は共通の部品（src/components/ui/）を使う。
 */

import { Notice } from '@/components/ui/Notice';

export { DataTable } from '@/components/ui/DataTable';

const SCROLL = 'scroll-mt-[calc(var(--header-h)+1.25rem)]';

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className={`${SCROLL} mt-14 mb-4 border-b-2 border-frame pb-2 font-cond text-[1.45rem] leading-snug font-bold sm:text-2xl`}>
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className={`${SCROLL} mt-9 mb-3 border-l-4 border-accent pl-3 font-cond text-lg leading-snug font-bold`}>
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="my-4 leading-[1.95]">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="my-4 list-disc space-y-1.5 pl-6 leading-[1.85] marker:text-accent">{children}</ul>;
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol className="my-4 list-decimal space-y-1.5 pl-6 leading-[1.85] marker:font-semibold marker:text-accent">{children}</ol>;
}

/** 強調（太字）。色だけで意味を伝えないよう、太さで示す */
export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-bold text-ink">{children}</strong>;
}

/** 用語の初出に添える短い説明（括弧書きより目立たせない） */
export function Term({ word, children }: { word: string; children: React.ReactNode }) {
  return (
    <>
      <B>{word}</B>
      <span className="text-dim">（{children}）</span>
    </>
  );
}

/** 補足・注意の枠。中身は共通の Notice（tone は意味。注意のときは見出しに「注意：」が付く） */
export function Note({
  title,
  tone = 'info',
  children,
}: {
  title: string;
  tone?: 'info' | 'caution';
  children: React.ReactNode;
}) {
  return (
    <Notice title={title} tone={tone} className="my-6">
      {children}
    </Notice>
  );
}

/**
 * 書きかけの印（開発中だけ出す）。確認待ちの情報がある場所に置く。公開のビルドでは何も出さない。
 * これが残っている記事は、status を published にしないこと
 */
export function DevTodo({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div className="my-6 rounded-lg border-2 border-dashed border-caution bg-caution-soft p-4 text-sm">
      <p className="font-bold text-caution">【開発中だけの表示・確認待ち】</p>
      <div className="mt-1 text-dim">{children}</div>
    </div>
  );
}

/** 結論の枠。記事の結論を後ろに隠さず、最初の方で示す */
export function Conclusion({ title = '結論', children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="my-8 rounded-xl border-2 border-accent bg-panel p-5 shadow-glow">
      <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent">CONCLUSION</p>
      <p className="mb-3 font-cond text-lg font-bold">{title}</p>
      <div className="leading-[1.85] [&>p]:my-2 [&>ul]:my-2">{children}</div>
    </section>
  );
}
