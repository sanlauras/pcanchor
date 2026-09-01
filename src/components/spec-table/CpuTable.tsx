'use client';

import { cpus } from '@/lib/data';
import { cpuColumns, cpuDetail } from './columns';
import { SpecTable } from './SpecTable';

export function CpuTable() {
  return (
    <SpecTable
      rows={cpus}
      columns={cpuColumns}
      detail={cpuDetail}
      getName={(r) => r.name}
      getVendor={(r) => r.vendor}
      getArch={(r) => r.arch}
      getVerified={(r) => r.verified}
      getHref={(r) => `/cpu/${r.slug}`}
      badge={(r) => (r.has3dVCache ? '3D V-Cache' : null)}
    />
  );
}
