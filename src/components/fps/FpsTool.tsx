'use client';

import { useMemo, useState } from 'react';
import { cpus, gpus } from '@/lib/data';
import { diagnose } from '@/lib/fps/diagnose';
import { GAMES, findGame } from '@/lib/fps/games';
import { RESOLUTIONS, type ResolutionId, predict } from '@/lib/fps/model';

const DEFAULT_GPU = 'Radeon RX 9070 XT';
const DEFAULT_CPU = 'Ryzen 7 9800X3D';

export function FpsTool() {
  const [gpuName, setGpuName] = useState(DEFAULT_GPU);
  const [cpuName, setCpuName] = useState(DEFAULT_CPU);
  const [gameId, setGameId] = useState('valorant');
  const [presetId, setPresetId] = useState('high');
  const [resolution, setResolution] = useState<ResolutionId>('1440p');
  const [memory, setMemory] = useState('');
  const [psu, setPsu] = useState('');

  const gpu = gpus.find((g) => g.name === gpuName) ?? gpus[0]!;
  const cpu = cpus.find((c) => c.name === cpuName) ?? cpus[0]!;
  const game = findGame(gameId);
  const res = RESOLUTIONS.find((r) => r.id === resolution)!;
  // ゲームを切り替えるとプリセットの顔ぶれが変わる。無ければ先頭に落とす
  const preset = game.presets.find((p) => p.id === presetId) ?? game.presets[0];

  function selectGame(id: string) {
    setGameId(id);
    const next = findGame(id);
    if (!next.presets.some((p) => p.id === presetId)) {
      setPresetId(next.presets[0]?.id ?? '');
    }
  }

  const result = useMemo(() => {
    if (!preset) return null;
    const prediction = predict({
      gpuFps4kHigh: gpu.fpsValorant4kHigh,
      cpuCeiling: cpu.fpsValorantCeiling,
      resolution,
      game,
      preset,
    });
    const memoryGb = memory === '' ? null : Number(memory);
    const psuWatts = psu === '' ? null : Number(psu);
    return {
      prediction,
      diagnosis: diagnose({
        gpu, cpu, resolution, game, preset, prediction, gpus, cpus,
        memoryGb: Number.isFinite(memoryGb) ? memoryGb : null,
        psuWatts: Number.isFinite(psuWatts) ? psuWatts : null,
      }),
    };
  }, [gpu, cpu, resolution, game, preset, memory, psu]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ------------------------------------------------ 入力 */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="GPU" required>
          <Select value={gpuName} onChange={setGpuName}>
            {gpus.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="CPU" required>
          <Select value={cpuName} onChange={setCpuName}>
            {cpus.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="ゲーム" required>
          <Select value={gameId} onChange={selectGame}>
            {GAMES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.supported ? '' : '（対応準備中）'}
              </option>
            ))}
          </Select>
        </Field>

        {game.supported && (
          <>
            <Field label="解像度" required>
              <Chips
                items={RESOLUTIONS.map((r) => ({ id: r.id, label: r.short }))}
                value={resolution}
                onChange={(v) => setResolution(v as ResolutionId)}
              />
            </Field>

            <Field label="画質" required>
              <Chips
                items={game.presets.map((x) => ({ id: x.id, label: x.label }))}
                value={preset?.id ?? ''}
                onChange={setPresetId}
              />
            </Field>
          </>
        )}

        <fieldset className="border-t border-rule-soft pt-4">
          <legend className="sr-only">任意の入力</legend>
          <p className="mb-3 font-mono text-[10px] tracking-wider text-dim uppercase">
            任意 — fps推定には使いません
          </p>
          <div className="space-y-3">
            <Field label="メモリ容量 (GB)">
              <NumberInput value={memory} onChange={setMemory} placeholder="32" />
            </Field>
            <Field label="電源容量 (W)">
              <NumberInput value={psu} onChange={setPsu} placeholder="750" />
            </Field>
          </div>
        </fieldset>
      </form>

      {/* ------------------------------------------------ 結果 */}
      <div className="space-y-5">
        {game.supported && result && preset ? (
          <section className="border border-rule bg-panel p-5">
            <p className="font-mono text-[10px] tracking-wider text-dim uppercase">
              {game.name} / {res.short} / {preset.label}
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-5xl font-semibold tabular-nums text-accent">
                {result.prediction.fps.toFixed(0)}
              </span>
              <span className="font-mono text-sm text-dim">fps（平均・推定）</span>
            </p>
            <p className="mt-2 text-xs text-dim">推定値です。誤差 ±15〜20%。</p>

            {/*
              「どういう条件での数値か」を取り違えると体感と大きく食い違うため、
              注記の箇条書きに埋めず、数値のすぐ下に独立した枠で出す。
            */}
            {game.highlight && (
              <div className="mt-4 border border-accent bg-accent-soft p-4">
                <p className="font-cond text-base font-bold text-ink">
                  {game.highlight.title}
                </p>
                <p className="mt-1 text-xs text-dim">{game.highlight.body}</p>
                <dl className="mt-3 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 border-b border-accent/25 pb-1.5">
                    <dt className="text-xs text-dim">{game.highlight.measuredLabel}</dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums text-ink">
                      {result.prediction.fps.toFixed(0)} fps
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs text-dim">{game.highlight.lighterLabel}</dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums text-accent">
                      約 {(result.prediction.fps * game.highlight.lighterMultiplier).toFixed(0)} fps
                      <span className="ml-2 text-[10px] font-normal text-dim">
                        +{Math.round((game.highlight.lighterMultiplier - 1) * 100)}% の目安
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-rule-soft pt-4 sm:grid-cols-3">
              <Stat label="GPU側の上限" value={`${result.prediction.gpuFps.toFixed(0)} fps`} />
              <Stat label="CPU側の上限" value={`${result.prediction.cpuFps.toFixed(0)} fps`} />
              <Stat label="ゲーム上限" value={game.cap === null ? 'なし' : `${game.cap} fps`} />
            </dl>

            {/* ゲーム固有の注意書きと、プリセット固有の注意書き */}
            <ul className="mt-4 space-y-1.5 border-t border-rule-soft pt-4 text-xs text-dim">
              {game.notes.map((n) => (
                <li key={n}>・{n}</li>
              ))}
              {preset.note && <li>・{preset.note}</li>}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule-soft pt-3 font-mono text-[10px] text-dim">
              <span>
                根拠:{' '}
                <span className={game.confidence === 'measured' ? 'text-accent' : 'text-ink'}>
                  {game.confidenceLabel}
                </span>
              </span>
              {game.source && (
                <span>
                  出典:{' '}
                  <a
                    href={game.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    {game.source.label}
                  </a>
                </span>
              )}
            </div>
          </section>
        ) : (
          <section className="border border-rule bg-panel p-5">
            <h2 className="font-cond text-lg font-bold">
              {game.name} のfps数値は出せません
            </h2>
            {game.notes.map((n) => (
              <p key={n} className="mt-2 text-sm text-dim">{n}</p>
            ))}
            {game.cap !== null && (
              <p className="mt-2 text-sm text-dim">
                分かっているのは
                <strong className="font-medium text-ink"> 上限が {game.cap} fps であること</strong>
                だけです。当サイトの検証機（RX 9070 XT + Ryzen 7 9800X3D）では、
                1440p最高でも4K最低でも300に張り付きました。
                根拠のない数値を出すより、出せないと書くことを選んでいます。
              </p>
            )}
          </section>
        )}

        {result && (
          <>
            <section className="border-l-2 border-accent bg-panel px-5 py-4">
              <h2 className="font-cond text-lg font-bold">{result.diagnosis.headline}</h2>
              <p className="mt-1.5 text-sm text-dim">{result.diagnosis.detail}</p>

              {result.diagnosis.freeActions.length > 0 && (
                <>
                  <h3 className="mt-4 font-mono text-[10px] tracking-wider text-dim uppercase">
                    買い替えずにできること
                  </h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-dim">
                    {result.diagnosis.freeActions.map((a) => (
                      <li key={a}>・{a}</li>
                    ))}
                  </ul>
                </>
              )}

              {result.diagnosis.pointless && (
                <p className="mt-4 border border-rule px-3 py-2 text-sm">
                  <strong className="font-medium text-ink">{result.diagnosis.pointless}</strong>
                </p>
              )}

              {result.diagnosis.upgrades.length > 0 && (
                <>
                  <h3 className="mt-4 font-mono text-[10px] tracking-wider text-dim uppercase">
                    交換すると伸びる候補
                  </h3>
                  <ul className="mt-1.5 space-y-1.5">
                    {result.diagnosis.upgrades.map((u) => (
                      <li
                        key={`${u.kind}-${u.name}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule-soft pb-1.5 text-sm"
                      >
                        <span>
                          <span className="font-mono text-[10px] text-dim uppercase">{u.kind}</span>{' '}
                          {u.name}
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {result.prediction.fps.toFixed(0)} → {u.toFps.toFixed(0)} fps
                          <span className="ml-2 text-accent">+{Math.round(u.gain * 100)}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-dim">
                    指数の誤差が ±15〜20% あるため、20%以上の改善が見込める候補だけを出しています。
                    価格は扱っていないので、費用対効果は判断していません。
                  </p>
                </>
              )}
            </section>

            {result.diagnosis.vramWarning && (
              <section className="border-l-2 border-ink bg-panel px-5 py-4">
                <h2 className="font-cond text-base font-bold">VRAMが不足します</h2>
                <p className="mt-1.5 text-sm text-dim">{result.diagnosis.vramWarning}</p>
              </section>
            )}

            {(result.diagnosis.memoryNote || result.diagnosis.psuNote) && (
              <section className="border border-rule px-5 py-4 text-sm text-dim">
                <h2 className="font-mono text-[10px] tracking-wider uppercase">任意入力について</h2>
                {result.diagnosis.memoryNote && <p className="mt-1.5">{result.diagnosis.memoryNote}</p>}
                {result.diagnosis.psuNote && <p className="mt-1.5">{result.diagnosis.psuNote}</p>}
              </section>
            )}
          </>
        )}

        <details className="border-t border-rule-soft text-xs text-dim">
          <summary className="cursor-pointer list-none py-2 marker:content-none hover:text-ink">
            1% Low と「終盤の高負荷時」を出していない理由
            <span className="ml-2 font-mono text-[10px] text-accent">［読む］</span>
          </summary>
          <div className="max-w-[80ch] space-y-2 pb-3">
            <p>
              どちらも根拠が足りないため出していません。他サイトが載せている数値を
              転載すれば今すぐ出せますが、それは他社の計測結果であり、当サイトでは使いません。
            </p>
            <p>
              <strong className="font-medium text-ink">1% Low</strong> —
              平均fpsに対する比が、Valorant では 0.70〜0.83、Fortnite では 0.26〜0.75 と、
              ゲームによっても条件によっても大きく変わります。共通の固定比では出せません。
              GPU使用率が高いほど比が上がる傾向は2タイトルで共通して見えているので、
              データが増えれば出せる可能性があります。
            </p>
            <p>
              <strong className="font-medium text-ink">終盤の高負荷時</strong> —
              実測データがありません。何をもって高負荷とするかの定義から決める必要があります。
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 部品 */

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] tracking-wider text-dim uppercase">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value, onChange, children,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
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

function NumberInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
    />
  );
}

function Chips({
  items, value, onChange,
}: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const on = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(it.id)}
            className={`cursor-pointer border px-3 py-1.5 text-xs ${
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule text-dim hover:border-ink hover:text-ink'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] text-dim">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}
