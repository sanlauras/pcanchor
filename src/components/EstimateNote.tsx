/**
 * 指数が推定値であることの注記。
 *
 * CLAUDE.md 絶対ルール3 は「推定値は必ず推定と明示し、算出方法も公開する」を求めている。
 * ただしページの主役は表なので、既定では1行だけ出し、詳しい内容は開いたときに読める形にした。
 * 算出方法の専用ページ（ROADMAP.md 1-5）ができたらリンクに置き換える。
 */
export function EstimateNote({ kind }: { kind: 'gpu' | 'cpu' }) {
  const baseline =
    kind === 'gpu' ? 'Radeon RX 9070 XT = 100' : 'Ryzen 7 9800X3D = 100';

  return (
    <details className="group border-b border-rule-soft text-xs text-dim">
      <summary className="cursor-pointer list-none py-2 marker:content-none hover:text-ink">
        指数は推定値です（誤差 ±15〜20%、基準 {baseline}）
        <span className="ml-2 font-mono text-[10px] text-accent">
          <span className="group-open:hidden">［算出方法と限界］</span>
          <span className="hidden group-open:inline">［閉じる］</span>
        </span>
      </summary>
      <ul className="max-w-[80ch] space-y-1 pb-3">
        <li>
          メーカー公式の公開スペックと公表IPCから計算した値です。
          この指数に他社のベンチマーク数値は使っていません。
        </li>
        <li>
          実測は RX 9070 XT + Ryzen 7 9800X3D の1構成のみで、
          他のモデルはそこからの外挿です。
        </li>
        <li>
          <strong className="font-medium text-ink">
            近接したモデル同士の順位は信用できません。
          </strong>
          アーキテクチャごとに係数を1つしか持てないため、指数が数%しか違わない
          組み合わせは実際には逆転しえます。世代をまたいだ大きな差は、それなりに信用できます。
        </li>
      </ul>
    </details>
  );
}
