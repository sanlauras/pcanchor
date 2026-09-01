import type { MetadataRoute } from 'next';

// メタデータのルートは内部的に Route Handler なので、
// 静的書き出し（output: 'export'）では静的化を明示する必要がある
export const dynamic = 'force-static';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
