/**
 * 広告枠の場所取り。
 *
 * 中身はまだ実装しない（ROADMAP.md フェーズ5）。
 * ここでは「後から広告を入れてもレイアウトが崩れない余白」を確保するだけ。
 *
 * 一覧ページは検索流入の受け皿なので、表より上や表の途中には置かない。
 * 置くのは表の下と、画面が広いときだけ現れる右サイドの2か所。
 */
type Props = {
  /** inline: 表の下の横長枠 / rail: 広い画面でのみ出る右サイドの縦長枠 */
  variant: 'inline' | 'rail';
};

export function AdSlot({ variant }: Props) {
  const shape =
    variant === 'inline'
      ? 'min-h-[90px] w-full'
      : 'sticky top-6 hidden min-h-[600px] w-[300px] shrink-0 lg:block';

  return (
    <aside
      aria-hidden
      data-ad-slot={variant}
      className={`${shape} border border-dashed border-rule-soft`}
    />
  );
}
