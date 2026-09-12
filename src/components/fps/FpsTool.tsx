'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cpus, gpus } from '@/lib/data';
import { diagnose } from '@/lib/fps/diagnose';
import { GAMES, findGame } from '@/lib/fps/games';
import {
  type Prediction,
  RESOLUTIONS,
  type ResolutionId,
  errorRange,
  predict,
  refreshVerdicts,
} from '@/lib/fps/model';

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
            {/*
              平均fpsと 1% Low を同格で並べる。
              平均だけ見て決めると、Fortnite の Performance のように
              「平均は高いのに実際はカクつく」設定を選んでしまうため。
            */}
            <p className="mt-2 font-mono text-5xl font-semibold tabular-nums text-accent">
              {result.prediction.fps.toFixed(0)}
            </p>
            <p className="mt-1 font-mono text-xs text-dim">
              平均fps（推定）・およそ {errorRange(result.prediction.fps).min.toFixed(0)}〜
              {errorRange(result.prediction.fps).max.toFixed(0)}
            </p>
            <p className="mt-1 text-xs text-dim">推定値です。誤差 ±15〜20%。</p>

            {/*
              1% Low は独立した枠で出す。
              平均fpsの脇に小さく置くと見落とされるが、Fortnite の Performance のように
              平均の3割程度しか出ない設定があり、平均だけ見て決めると必ず外すため。
            */}
            {result.prediction.fps1Low && preset.lowRatio && (
              <div className="mt-4 border border-accent bg-accent-soft p-4">
                <p className="font-cond text-base font-bold text-ink">
                  カクつきの底は {result.prediction.fps1Low.min.toFixed(0)} fps です
                </p>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-ink">
                    {result.prediction.fps1Low.min.toFixed(0)}
                    <span className="text-xl text-dim">〜</span>
                    {result.prediction.fps1Low.max.toFixed(0)}
                  </span>
                  <span className="font-mono text-xs text-dim">
                    1% Low（推定）・平均の {Math.round(preset.lowRatio.min * 100)}〜
                    {Math.round(preset.lowRatio.max * 100)}%
                  </span>
                </div>

                {result.diagnosis.stutterNote && (
                  <p className="mt-2 max-w-[62ch] text-xs text-dim">
                    {result.diagnosis.stutterNote}
                  </p>
                )}

                {/* モニターのHzごとの判定。買い物の判断に直結する部分 */}
                <MonitorVerdicts prediction={result.prediction} />

                <p className="mt-3 max-w-[62ch] text-[11px] text-dim">
                  1% Low は「遅い方から1%のフレーム」の速度で、カクつきの目安です。
                  平均が高くてもここが低いと、体感は数字ほど滑らかになりません。
                </p>
              </div>
            )}

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
            1% Low の出し方と、その限界
            <span className="ml-2 font-mono text-[10px] text-accent">［読む］</span>
          </summary>
          <div className="max-w-[80ch] space-y-2 pb-3">
            <p>
              平均fpsに対する 1% Low の比を、ゲーム別・画質プリセット別に実測から
              求めています。比は1つの値ではなく実測のばらつきをそのままレンジで
              持たせているので、
              <strong className="font-medium text-ink">
                レンジが狭い条件ほど信用できる
              </strong>
              と読んでください。
            </p>
            <p>
              比は条件で大きく変わります。Valorant は 0.70〜0.83 ですが、
              Fortnite の Performance は 0.26〜0.28 です。
              同じ「平均500fps」でも体感がまるで違います。
              GPU使用率が高いほど比が上がる傾向は2タイトルで共通しています。
            </p>
            <p>
              <strong className="font-medium text-ink">限界</strong> —
              自前の実測は1構成のみで、画質プリセットあたり2点しかありません。
              Fortnite側は実プレイの映像から求めたもので、テストシーンを固定できて
              いません（平均fpsで約10%のばらつきがあります）。
              またゲームと画質ごとの比なので、GPUとCPUの組み合わせによる違いは
              反映していません。実測の投稿が集まれば精度を上げられます。
            </p>
            <p>
              <strong className="font-medium text-ink">終盤の高負荷時のfps</strong> —
              こちらは実測データが無いため出していません。何をもって高負荷とするかの
              定義から決める必要があります。他サイトの数値を転載すれば今すぐ出せますが、
              それは他社の計測結果であり、当サイトでは使いません。
            </p>
          </div>
        </details>

        <p className="border-t border-rule-soft pt-3 text-xs text-dim">
          逆に「この目標fpsを出すには何が必要か」を調べるなら
          <Link href="/tools/build" className="text-accent underline">
            目標fpsから選ぶPC構成
          </Link>
          が使えます。
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 部品 */

/**
 * モニターのリフレッシュレートごとに、そのHzを活かせるかを出す。
 *
 * 平均だけで判定すると「240Hzを買えば活かせる」と読み違えるので、
 * 平均とカクつきの底の両方で見る。判定の定義は model.ts の RefreshLevel。
 */
function MonitorVerdicts({ prediction }: { prediction: Prediction }) {
  const verdicts = refreshVerdicts(prediction);
  if (!verdicts) return null;

  const style = {
    clear: { mark: '○', cls: 'border-accent text-accent' },
    stutter: { mark: '△', cls: 'border-rule text-ink' },
    short: { mark: '✕', cls: 'border-rule-soft text-dim opacity-60' },
  } as const;

  return (
    <div className="mt-3 border-t border-accent/25 pt-3">
      <p className="mb-2 font-mono text-[10px] tracking-wider text-dim uppercase">
        モニターを活かせるか
      </p>
      <ul className="flex flex-wrap gap-2">
        {verdicts.map((v) => {
          const st = style[v.level];
          return (
            <li
              key={v.hz}
              className={`flex items-center gap-1.5 border px-2 py-1 font-mono text-xs ${st.cls}`}
            >
              <span aria-hidden>{st.mark}</span>
              {v.hz}Hz
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-dim">
        ○ 平均もカクつきの底も足りる ／ △ 平均は足りるが底が届かない ／ ✕ 平均が足りない
      </p>
    </div>
  );
}

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
