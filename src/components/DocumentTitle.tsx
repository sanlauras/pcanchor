'use client';

import { useEffect } from 'react';

/**
 * ブラウザのタブの題名を差し替える（2026-11-09 段階6。404 ページ用）。
 *
 * not-found.tsx は metadata を export できず、本文に <title> を書くとレイアウトの既定の <title> と2つになり、
 * 先に出る既定の方が使われてしまう（ビルドの出力で確認した）。404 は検索に出さないページ
 * （Next.js が noindex を付け、Cloudflare が HTTP 404 を返す）なので、見る人のタブの題名だけを直す。
 *
 * 読み込みの直後に Next.js がレイアウトの既定の題名を入れ直すため（手元で確認）、<title> の変化を見張って、
 * 変わったら差し替え直す。同じ値なら何もしないので、繰り返しにはならない。
 */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
  return null;
}
