'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AffiliateLink } from '@/components/AffiliateLink';
import { cpus, gpus } from '@/lib/data';
import { hasAmazonTag } from '@/lib/affiliate';
import { stockNote } from '@/lib/generation';
import { type Side, type Tier, TIERS, alternatives, solveBuild } from '@/lib/fps/build';
import { GAMES, findGame } from '@/lib/fps/games';
import { REFRESH_RATES, RESOLUTIONS, type ResolutionId } from '@/lib/fps/model';

/**
 * 目標fpsからPC構成を逆引きするツール。
 *
 * 計算は src/lib/fps/build.ts にある。ここは入力と表示だけを持つ。
 * 予想ツール(FpsTool)と同じ見た目に揃えてある。
 */

const supported = GAMES.filter((g) => g.supported);

export function BuildTool() {
  const [gameId, setGameId] = useState(supported[0]!.id);
  const [resolution, setResolution] = useState<ResolutionId>('1080p');
  const [target, setTarget] = useState('144');
  const [gpuVendor, setGpuVendor] = useState('');
  const [cpuVendor, setCpuVendor] = useState('');
  const [tier, setTier] = useState<Tier>('value');
  // 既定でON。放っておくと新品で買えない古いカードばかり出るため
  const [currentGenOnly, setCurrentGenOnly] = useState(true);

  const game = findGame(gameId);
  const [presetId, setPresetId] = useState(game.presets[0]?.id ?? '');
  const preset = game.presets.find((p) => p.id === presetId) ?? game.presets[0];

  // ゲームを変えるとプリセットの顔ぶれが変わるので、無効になったら先頭に戻す
  function changeGame(id: string) {
    setGameId(id);
    const g = findGame(id);
    if (!g.presets.some((p) => p.id === presetId)) setPresetId(g.presets[0]?.id ?? '');
  }

  const targetFps = Number(target);
  const valid = Number.isFinite(targetFps) && targetFps > 0 && preset !== undefined;

  // 手動のメモ化はしない。React Compiler が自動でやるので、
  // 依存配列を自分で持つとかえって最適化を妨げる（lintで止まる）。
  const result = computeResult();

  function computeResult() {
    if (!valid || !preset) return null;
    const req = {
      gameId,
      presetId: preset.id,
      resolution,
      targetFps,
      gpuVendor: (gpuVendor || null) as 'NVIDIA' | 'AMD' | null,
      cpuVendor: (cpuVendor || null) as 'Intel' | 'AMD' | null,
      currentGenOnly,
    };
    return {
      tiers: solveBuild({ req, gpus, cpus }),
      alts: alternatives({ req, gpus, cpus, resolutions: RESOLUTIONS.map((r) => r.id) }),
    };
  }

  const current = result?.tiers?.find((t) => t.tier === tier);
  const currentMeta = TIERS.find((x) => x.id === tier)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="ゲーム">
          <Select value={gameId} onChange={changeGame}>
            {supported.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="解像度">
          <Select value={resolution} onChange={(v) => setResolution(v as ResolutionId)}>
            {RESOLUTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="画質">
          <Select value={preset?.id ?? ''} onChange={setPresetId}>
            {game.presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="出したいfps">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {/* モニターのHzから選べた方が早い。REFRESH_RATES は予想ツールと共通 */}
          <span className="mt-2 flex flex-wrap gap-1.5">
            {REFRESH_RATES.map((hz) => (
              <button
                key={hz}
                type="button"
                onClick={() => setTarget(String(hz))}
                className={`cursor-pointer border px-2 py-1 font-mono text-[11px] ${
                  target === String(hz)
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-rule text-dim hover:border-ink hover:text-ink'
                }`}
              >
                {hz}Hz
              </button>
            ))}
          </span>
        </Field>

        <fieldset className="border-t border-rule-soft pt-4">
          <legend className="sr-only">候補の絞り込み</legend>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={currentGenOnly}
              onChange={(e) => setCurrentGenOnly(e.target.checked)}
              className="mt-0.5 cursor-pointer accent-accent"
            />
            <span className="text-sm">
              新品で買える世代に絞る
              <span className="mt-0.5 block text-xs text-dim">
                外すと GTX 1070 のような古いモデルも候補に入ります。中古で探すなら有効です。
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="border-t border-rule-soft pt-4">
          <legend className="sr-only">メーカーの指定</legend>
          <p className="mb-3 font-mono text-[10px] tracking-wider text-dim uppercase">
            任意 — メーカーを絞る
          </p>
          <div className="space-y-3">
            <Field label="GPU">
              <Select value={gpuVendor} onChange={setGpuVendor}>
                <option value="">指定なし</option>
                <option value="NVIDIA">GeForce（NVIDIA）</option>
                <option value="AMD">Radeon（AMD）</option>
              </Select>
            </Field>
            <Field label="CPU">
              <Select value={cpuVendor} onChange={setCpuVendor}>
                <option value="">指定なし</option>
                <option value="Intel">Intel</option>
                <option value="AMD">Ryzen（AMD）</option>
              </Select>
            </Field>
          </div>
        </fieldset>
      </form>

      <div className="space-y-5">
        {!valid || !result?.tiers ? (
          <p className="border border-rule bg-panel p-5 text-sm text-dim">
            出したいfpsを入力してください。
          </p>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-wider text-dim uppercase">
              {game.name} / {RESOLUTIONS.find((r) => r.id === resolution)?.short} /{' '}
              {preset?.label} / 目標 {targetFps} fps
            </p>

            {/* 3段階を並べて見比べられるようにする。押すと下に詳細が出る */}
            <div className="grid gap-3 sm:grid-cols-3">
              {result.tiers.map((t) => {
                const meta = TIERS.find((x) => x.id === t.tier)!;
                const on = t.tier === tier;
                const g = t.gpu.kind === 'ok' ? t.gpu.candidates[0]!.model.name : null;
                const c = t.cpu.kind === 'ok' ? t.cpu.candidates[0]!.model.name : null;
                return (
                  <button
                    key={t.tier}
                    type="button"
                    onClick={() => setTier(t.tier)}
                    aria-pressed={on}
                    className={`cursor-pointer border p-4 text-left ${
                      on ? 'border-accent bg-accent-soft' : 'border-rule bg-panel hover:border-ink'
                    }`}
                  >
                    <p className={`font-cond font-bold ${on ? 'text-accent' : 'text-ink'}`}>
                      {meta.label}
                    </p>
                    <dl className="mt-2 space-y-1.5 font-mono text-xs">
                      <div>
                        <dt className="text-[10px] text-dim">GPU</dt>
                        <dd className={g ? 'text-ink' : 'text-dim'}>{g ?? '該当なし'}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] text-dim">CPU</dt>
                        <dd className={c ? 'text-ink' : 'text-dim'}>{c ?? '該当なし'}</dd>
                      </div>
                    </dl>
                  </button>
                );
              })}
            </div>

            {current && (
              <section className="border border-rule bg-panel p-5">
                <h2 className="font-cond text-lg font-bold">{currentMeta.label}</h2>
                <p className="mt-1 max-w-[62ch] text-sm text-dim">
                  {currentMeta.summary}
                  {current.requiredAvg > 0 && (
                    <>（平均 {current.requiredAvg.toFixed(0)} fps 以上が必要）</>
                  )}
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Band title="GPU" side={current.gpu} hrefBase="/gpu" />
                  <Band title="CPU" side={current.cpu} hrefBase="/cpu" />
                </div>

                {(current.gpu.kind === 'ok' || current.cpu.kind === 'ok') && (
                  <p className="mt-4 border-t border-rule-soft pt-3 text-xs text-dim">
                    上から順に性能が低い（＝必要十分に近い）並びです。
                    <strong className="font-medium text-ink">
                      この帯の中の順位は誤差に埋もれます。
                    </strong>
                    在庫や価格で選んで構いません。
                  </p>
                )}

                {hasAmazonTag() && (
                  <p className="mt-2 text-xs text-dim">
                    Amazonへのリンクは広告です。
                    <strong className="font-medium text-ink">
                      候補は性能指数だけで選んでおり、広告の有無は順番に一切影響していません。
                    </strong>
                  </p>
                )}
              </section>
            )}

            {result.alts.length > 0 && (
              <section className="border border-rule bg-panel p-5">
                <h2 className="font-cond text-lg font-bold">設定を下げた場合</h2>
                <p className="mt-1 mb-3 max-w-[62ch] text-xs text-dim">
                  同じ {targetFps} fps を別の解像度・画質で狙った場合に必要な、最小のGPUです
                  （コスパ構成の基準）。要求が高すぎるときに、何を妥協すればどこまで下がるかが
                  分かります。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-y border-ink">
                        <th className="px-2 py-2 text-left font-cond text-xs">解像度</th>
                        <th className="px-2 py-2 text-left font-cond text-xs">画質</th>
                        <th className="px-2 py-2 text-left font-cond text-xs">必要な最小GPU</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.alts.map((a) => (
                        <tr
                          key={`${a.resolution}-${a.presetId}`}
                          className="border-b border-rule-soft"
                        >
                          <td className="px-2 py-2 font-mono text-xs whitespace-nowrap">
                            {RESOLUTIONS.find((r) => r.id === a.resolution)?.short}
                          </td>
                          <td className="px-2 py-2 text-xs whitespace-nowrap">{a.presetLabel}</td>
                          <td className="px-2 py-2 text-xs">
                            {a.gpu.kind === 'ok' ? (
                              <Link
                                href={`/gpu/${a.gpu.candidates[0]!.model.slug}`}
                                className="text-accent hover:underline"
                              >
                                {a.gpu.candidates[0]!.model.name}
                              </Link>
                            ) : (
                              <span className="text-dim">{ngText(a.gpu)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="border-l-2 border-accent pl-4 text-sm text-dim">
              <h2 className="mb-1.5 font-cond text-base font-bold text-ink">この結果について</h2>
              <ul className="max-w-[70ch] space-y-1">
                <li>
                  ・<strong className="font-medium text-ink">価格は見ていません。</strong>
                  当サイトは価格データを持っていないため、「コスパ構成」は
                  「目標をちょうど満たす、最も性能の低い構成」という意味です。
                  円あたりの性能で選んだものではありません。
                </li>
                <li>
                  ・推定値です（誤差 ±15〜20%）。ぎりぎりの構成は実際には目標を下回ることが
                  あります。避けたい場合は余裕構成を見てください。
                </li>
                <li>
                  ・GPUは目標fpsだけでなく、その設定で必要なVRAMを満たすものだけを出しています。
                </li>
                <li>
                  ・逆に「この構成で何fps出るか」を調べるなら
                  <Link href="/tools/fps" className="text-accent underline">
                    ゲーム別fps予想・ボトルネック診断
                  </Link>
                  が使えます。
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 部品 */

/** 出せない理由を日本語にする。理由ごとに言うべきことが違う */
function ngText(side: Side<unknown>): string {
  if (side.kind === 'ok') return '';
  switch (side.reason) {
    case 'cap':
      return `ゲーム側の上限が ${side.cap} fps なので、どんな構成でも届きません`;
    case 'noRatio':
      return 'この画質では 1% Low の実測が無いため出せません';
    case 'vendor':
      return '条件を満たすモデルはありますが、指定したメーカーには該当がありません';
    case 'generation':
      return '条件を満たすモデルはありますが、新品で買える世代にはありません。絞り込みを外すと出ます';
    case 'none':
      return '掲載しているモデルでは届きません';
  }
}

function Band<
  T extends { name: string; slug: string; perfIndex: number; arch: string; releaseYear: number },
>({
  title,
  side,
  hrefBase,
}: {
  title: string;
  side: Side<T>;
  hrefBase: string;
}) {
  return (
    <div>
      <h3 className="mb-2 font-mono text-[10px] tracking-wider text-dim uppercase">{title}</h3>
      {side.kind === 'ng' ? (
        <p className="text-sm text-dim">{ngText(side)}</p>
      ) : (
        <ol className="space-y-1.5">
          {side.candidates.map((c, i) => (
            <li key={c.model.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <Link
                href={`${hrefBase}/${c.model.slug}`}
                className={`text-sm hover:text-accent ${
                  i === 0 ? 'font-medium text-ink' : 'text-dim'
                }`}
              >
                {c.model.name}
              </Link>
              <span className="ml-auto font-mono text-xs tabular-nums text-dim">
                {c.fps.toFixed(0)} fps
              </span>
              <AffiliateLink query={c.model.name} model={c.model} />
              {stockNote(c.model) && (
                <span className="w-full text-[11px] text-dim">{stockNote(c.model)}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] tracking-wider text-dim uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
    >
      {children}
    </select>
  );
}
