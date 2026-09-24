import { PageHeader } from '@/components/PageHeader';
import { tally } from '@/lib/data/summary';

type Props = {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
};

/**
 * GPU/CPU一覧の見出し。ツールページと同じ PageHeader を使い、
 * データの集計（収録数・確認済み件数）を表題欄に出す。
 */
export function Masthead({ eyebrow, title, lead }: Props) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      lead={<p>{lead}</p>}
      facts={[
        { label: 'GPUモデル', value: tally.gpuCount },
        { label: 'CPUモデル', value: tally.cpuCount },
        { label: 'ソース確認済み', value: tally.verifiedCount },
        { label: '誤りを発見・修正', value: tally.correctionsFound },
      ]}
    />
  );
}
