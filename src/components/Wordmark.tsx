import { SITE } from '@/lib/site';

/**
 * ロゴの英字「PC ANCHOR」。ANCHOR の頭の「A」だけを青くする（2026-09-30 ユーザーの提案）。
 *
 * 色を変えるためにスパンで分けているだけなので、文字としては今まで通り「PC ANCHOR」のまま
 * （読み上げ・検索から見た文字は変わらない。ホームの h1 の中身もこれ）。
 * 書体・大きさは使う側で付ける。
 */
export function Wordmark() {
  const name = SITE.nameEn.toUpperCase(); // "PC ANCHOR"
  const i = name.indexOf('A');
  if (i < 0) return <>{SITE.nameEn}</>;
  return (
    <>
      {SITE.nameEn.slice(0, i)}
      <span className="text-accent">{SITE.nameEn.slice(i, i + 1)}</span>
      {SITE.nameEn.slice(i + 1)}
    </>
  );
}
