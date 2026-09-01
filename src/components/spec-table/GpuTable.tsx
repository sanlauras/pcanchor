'use client';

import { gpus } from '@/lib/data';
import { gpuColumns, gpuDetail } from './columns';
import { SpecTable } from './SpecTable';

/**
 * 列定義は表示用の関数を持つため、Server Component から props で渡せない
 * （関数はサーバーとクライアントの境界を越えられない）。
 * データと列定義をこのクライアント側のラッパーで読み込んでいる。
 */
export function GpuTable() {
  return (
    <SpecTable
      rows={gpus}
      columns={gpuColumns}
      detail={gpuDetail}
      getName={(r) => r.name}
      getVendor={(r) => r.vendor}
      getArch={(r) => r.arch}
      getVerified={(r) => r.verified}
      getHref={(r) => `/gpu/${r.slug}`}
    />
  );
}
