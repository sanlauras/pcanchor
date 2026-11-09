import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { ANCHOR } from '@/lib/fps/model';

/**
 * スペックの確認状態とゲーム性能の確認状態を、分けて書く（2026-11-09 の全面再設計・段階5）。
 *
 * スペック（CSV の verified 列。値はそのまま読むだけで変えない）:
 *   「OK(ソース確認済)」         → メーカー公式仕様と照合済み
 *   「準OK(兄弟モデルから整合確認)」「準OK(同世代整合)」 → 一部準確認（公式資料ではなく、兄弟モデル・同世代モデルとの整合で確かめた）
 * ゲーム性能:
 *   どのモデルも推定。自前の実測があるのは基準機（RX 9070 XT＋Ryzen 7 9800X3D）で VALORANT を測ったものだけ。
 *   基準機のモデルでも、表の数字は計算の結果で、実測値そのものではない。
 * モデルごとの出典 URL はデータに無いので作らない。発売は年だけ（月日は持っていない）。
 */

export type SpecStatus = { semi: boolean; label: string; detail: string };

export function specStatus(verified: string): SpecStatus {
  if (verified.startsWith('準')) {
    // 括弧の中（兄弟モデルから整合確認・同世代整合）がどう確かめたか
    const how = verified.match(/[（(](.+)[)）]/)?.[1] ?? '';
    return {
      semi: true,
      label: '一部準確認',
      detail: `メーカー公式資料での照合ではなく、${how.includes('兄弟') ? '兄弟モデル' : '同世代のモデル'}との整合で確かめた値を含みます（データ上の記録: ${verified}）。`,
    };
  }
  return { semi: false, label: '公式仕様と照合済み', detail: 'メーカー公式の製品仕様と照合した値です。' };
}

/** 一覧の行と、詳細ページの見出しに付ける小さな札。何を確かめたか（スペック）を札の文字で書く */
export function SpecStatusTag({ verified }: { verified: string }) {
  const s = specStatus(verified);
  return (
    <span title={s.detail} className="inline-flex">
      <Badge tone={s.semi ? 'caution' : 'neutral'}>スペック: {s.label}</Badge>
    </span>
  );
}

/** そのモデルが基準機の部品か（ゲーム性能の説明を出し分けるため） */
export function isReferencePart(kind: 'gpu' | 'cpu', name: string): boolean {
  return kind === 'gpu' ? name === ANCHOR.gpuName : name === ANCHOR.cpuName;
}

/** 詳細ページの最後の節「データの出典と確認状態」 */
export function DataStatusSection({
  kind,
  name,
  verified,
  releaseYear,
}: {
  kind: 'gpu' | 'cpu';
  name: string;
  verified: string;
  releaseYear: number;
}) {
  const spec = specStatus(verified);
  const reference = isReferencePart(kind, name);
  const vendorList = kind === 'gpu' ? 'NVIDIA・AMD' : 'AMD・Intel';
  return (
    <section className="mt-10 rounded-lg border border-frame bg-panel p-4 sm:p-5" data-status>
      <h2 className="mb-3 font-cond text-xl font-bold">データの出典と確認状態</h2>
      <dl className="divide-y divide-rule-soft text-sm">
        <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="font-medium">スペック</dt>
          <dd className="text-dim">
            <Badge tone={spec.semi ? 'caution' : 'neutral'}>{spec.label}</Badge>
            <span className="ml-2">{spec.detail}</span>
          </dd>
        </div>
        <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="font-medium">ゲーム性能（fps）</dt>
          <dd className="text-dim">
            <Badge tone="estimate">推定</Badge>
            <span className="ml-2">
              {reference
                ? `${name} は基準機（${ANCHOR.gpuName}＋${ANCHOR.cpuName}）の部品で、VALORANT だけは当サイトが自前で実測しています。それでもこのページの fps は計算の結果で、実測値そのものではありません。ほかのゲームは実測していません。`
                : `${name} のゲーム性能は実測していません。メーカー公式スペックから計算した性能指数と、ゲームごとの係数から出した推定値です（誤差 ±15〜20%）。`}
            </span>
            <span className="mt-1 block">
              {`当サイトの実測データは、基準機で VALORANT を4条件測ったものだけです。`}
            </span>
          </dd>
        </div>
        <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="font-medium">出典</dt>
          <dd className="text-dim">
            {`${vendorList} 各社の公式の製品仕様。モデルごとの出典ページは掲載していません。クロックはリファレンス仕様値です。`}
          </dd>
        </div>
        <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
          <dt className="font-medium">発売</dt>
          <dd className="text-dim">{`${releaseYear}年（データは年だけを持っており、月日は掲載していません）`}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-dim">
        性能指数と推定fpsの計算方法は
        <Link href="/methodology" className="text-accent underline">
          算出方法
        </Link>
        にまとめています。
      </p>
    </section>
  );
}
