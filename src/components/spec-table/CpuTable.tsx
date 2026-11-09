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
      getIndex={(r) => r.perfIndex}
      getVerified={(r) => r.verified}
      getYear={(r) => r.releaseYear}
      getHref={(r) => `/cpu/${r.slug}`}
      kind="cpu"
      badge={(r) => (r.has3dVCache ? '3D V-Cache' : null)}
    />
  );
}
