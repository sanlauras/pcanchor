'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { AffiliateLink } from '@/components/AffiliateLink';
import { Badge } from '@/components/ui/Badge';
import { type Cpu, type Gpu, cpus, gpus } from '@/lib/data';
import { hasAmazonTag } from '@/lib/affiliate';
import { stockNote } from '@/lib/generation';
import { type Candidate, type Side, type Tier, type TierResult, TIERS, alternatives, solveBuild } from '@/lib/fps/build';
import { VRAM_MB_PER_GB } from '@/lib/fps/diagnose';
import { GAMES, findGame } from '@/lib/fps/games';
import {
  type GameProfile,
  type Prediction,
  type PresetProfile,
  REFRESH_RATES,
  RESOLUTIONS,
  type ResolutionId,
  predict,
} from '@/lib/fps/model';

/**
 * 目標fpsからPC構成を逆引きするツール。
 *
 * 計算は src/lib/fps/build.ts にある。ここは入力と表示だけを持つ。
 * 予想ツール(FpsTool)と同じ見た目に揃えてある。
 */

const supported = GAMES.filter((g) => g.supported);

/*
 * 入力の状態は URL に持つ（2026-09-27。SEO監査の指摘: 条件を共有・ブックマークできなかった）。
 * 例: /tools/build?game=apex&res=1440p&fps=240
 * 読み方と書き方は感度換算（SensTool）と同じ。既定値と同じ項目は URL に書かない（短く保つため）。
 * サーバー描画では既定値で描き、ブラウザで URL の値に差し替える（最初の描画が食い違わない）。
 * canonical は /tools/build のまま（パラメータ付きの URL はインデックスさせない）。
 */
type Settings = {
  game: string;
  res: ResolutionId;
  /** 空なら、そのゲームの先頭の画質 */
  preset: string;
  fps: string;
  gpuv: '' | 'NVIDIA' | 'AMD';
  cpuv: '' | 'Intel' | 'AMD';
  tier: Tier;
  /** new = 新品で買える世代に絞る（既定）/ all = 古い世代も含める */
  gen: 'new' | 'all';
};

const DEFAULTS: Settings = {
  game: supported[0]!.id,
  res: '1080p',
  preset: '',
  fps: '144',
  gpuv: '',
  cpuv: '',
  tier: 'value',
  gen: 'new',
};

const KEYS = Object.keys(DEFAULTS) as (keyof Settings)[];

/** URLを書き換えたことを自分自身に知らせるための合図 */
const CHANGE_EVENT = 'pcanchor:build-change';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
const getSnapshot = () => window.location.search;
const getServerSnapshot = () => '';

/** URL の値を読む。知らない値・壊れた値は既定値に落とす */
function parseSettings(search: string): Settings {
  const q = new URLSearchParams(search);
  const game = supported.find((g) => g.id === q.get('game'))?.id ?? DEFAULTS.game;
  const res = RESOLUTIONS.find((r) => r.id === q.get('res'))?.id ?? DEFAULTS.res;
  const preset = findGame(game).presets.find((p) => p.id === q.get('preset'))?.id ?? '';
  // 空欄は「自分で消した」ので空のまま。数字が1つも無い値（?fps=abc）は壊れた値として既定値に戻す
  const rawFps = q.get('fps');
  const digits = (rawFps ?? '').replace(/[^0-9]/g, '').slice(0, 4);
  const fps = rawFps === null ? DEFAULTS.fps : rawFps === '' || digits !== '' ? digits : DEFAULTS.fps;
  const gpuv = q.get('gpuv');
  const cpuv = q.get('cpuv');
  const tier = TIERS.find((x) => x.id === q.get('tier'))?.id ?? DEFAULTS.tier;
  return {
    game,
    res,
    preset,
    fps,
    gpuv: gpuv === 'NVIDIA' || gpuv === 'AMD' ? gpuv : '',
    cpuv: cpuv === 'Intel' || cpuv === 'AMD' ? cpuv : '',
    tier,
    gen: q.get('gen') === 'all' ? 'all' : 'new',
  };
}

/** 入力を書き換える。クリックや入力のときにだけ呼ばれる（描画中には呼ばない） */
function updateSettings(patch: Partial<Settings>) {
  const merged = { ...parseSettings(window.location.search), ...patch };
  const url = new URL(window.location.href);
  for (const key of KEYS) {
    const value = String(merged[key]);
    if (value === String(DEFAULTS[key])) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function BuildTool() {
  const settings = parseSettings(useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot));
  const { game: gameId, res: resolution, fps: target, gpuv: gpuVendor, cpuv: cpuVendor, tier } = settings;
  // 既定でON。放っておくと新品で買えない古いカードばかり出るため
  const currentGenOnly = settings.gen === 'new';

  const game = findGame(gameId);
  const preset = game.presets.find((p) => p.id === settings.preset) ?? game.presets[0];
  const presetId = preset?.id ?? '';

  const setResolution = (v: ResolutionId) => updateSettings({ res: v });
  const setPresetId = (v: string) => updateSettings({ preset: v === game.presets[0]?.id ? '' : v });
  const setTarget = (v: string) => updateSettings({ fps: v.replace(/[^0-9]/g, '').slice(0, 4) });
  const setGpuVendor = (v: string) => updateSettings({ gpuv: v as Settings['gpuv'] });
  const setCpuVendor = (v: string) => updateSettings({ cpuv: v as Settings['cpuv'] });
  const setTier = (v: Tier) => updateSettings({ tier: v });
  const setCurrentGenOnly = (on: boolean) => updateSettings({ gen: on ? 'new' : 'all' });

  // ゲームを変えるとプリセットの顔ぶれが変わるので、無効になったら先頭に戻す
  function changeGame(id: string) {
    const g = findGame(id);
    updateSettings({ game: id, preset: g.presets.some((p) => p.id === presetId) && presetId !== g.presets[0]?.id ? presetId : '' });
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
  const views = result?.tiers && preset ? toViews(result.tiers, game, preset, resolution) : [];
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
            className="rounded-lg w-full border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {/* モニターのHzから選べた方が早い。REFRESH_RATES は予想ツールと共通 */}
          <span className="mt-2 flex flex-wrap gap-1.5">
            {REFRESH_RATES.map((hz) => (
              <button
                key={hz}
                type="button"
                onClick={() => setTarget(String(hz))}
                className={`cursor-pointer rounded-md border px-2 py-1 font-mono text-[11px] ${
                  target === String(hz)
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-rule text-dim hover:border-accent hover:text-ink'
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
          <p className="rounded-lg border border-rule bg-panel p-5 text-sm text-dim">
            出したいfpsを入力してください。
          </p>
        ) : (
          <>
            <p className="font-mono text-[10px] tracking-wider text-dim uppercase">
              {game.name} / {RESOLUTIONS.find((r) => r.id === resolution)?.short} /{' '}
              {preset?.label} / 目標 {targetFps} fps
            </p>

            {/*
              3つの構成を縦に並べる（2026-11-09 段階4）。各カードに GPU・CPU・選定理由・目標・解像度・
              推定平均fps・推定1% Low・VRAM・律速・ゲーム側の上限の注意を出す。
              前の段と GPU・CPU の両方が同じなら、カードを繰り返さずに「〜と同じ構成です」とだけ書く。
              表示の整理だけで、solveBuild() の結果は変えていない。
            */}
            <div className="grid gap-4" data-tiers>
              {views.map((v, i) => (
                <TierCard
                  key={v.tier.tier}
                  step={i + 1}
                  view={v}
                  selected={v.tier.tier === tier}
                  onSelect={() => setTier(v.tier.tier)}
                  game={game}
                  targetFps={targetFps}
                  resolutionShort={RESOLUTIONS.find((r) => r.id === resolution)?.short ?? resolution}
                  presetLabel={preset?.label ?? ''}
                  lowRatio={preset?.lowRatio ?? null}
                />
              ))}
            </div>

            {current && (
              <section className="rounded-lg border border-rule bg-panel p-5" data-band>
                <h2 className="font-cond text-lg font-bold">{currentMeta.label}のほかの候補</h2>
                <p className="mt-1 max-w-[62ch] text-sm text-dim">
                  {currentMeta.summary}
                  {current.requiredAvg > 0 && (
                    <>（平均 {current.requiredAvg.toFixed(0)} fps 以上が必要）</>
                  )}
                  {/* 余裕・高性能の必要値はゲーム側の上限を超えることがある。性能（理論値）で探している旨を書く */}
                  {game.cap !== null && current.requiredAvg > game.cap && (
                    <>
                      。{game.cap} fps を超える部分は理論値で、実際の画面では {game.cap} fps で止まります。
                    </>
                  )}
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Band title="GPU（GPU側の上限・推定）" side={current.gpu} hrefBase="/gpu" />
                  <Band title="CPU（CPU側の上限・推定）" side={current.cpu} hrefBase="/cpu" />
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
              <section className="rounded-lg border border-rule bg-panel p-5">
                <h2 className="font-cond text-lg font-bold">設定を下げた場合</h2>
                <p className="mt-1 mb-3 max-w-[62ch] text-xs text-dim">
                  同じ {targetFps} fps を別の解像度・画質で狙った場合に必要な、最小のGPUです（必要十分な構成の基準）。要求が高すぎるときに、何を妥協すればどこまで下がるかが分かります。
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-y border-frame">
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
                  ・<strong className="font-medium text-ink">価格は考慮していません。</strong>
                  当サイトは価格データを持っていないため、「必要十分な構成」は「目標を満たす、最も性能の低い構成」という意味です。円あたりの性能で選んだものではありません。
                </li>
                <li>
                  ・推定値です（誤差 ±15〜20%）。ぎりぎりの構成は実際には目標を下回ることがあります。避けたい場合は「余裕を持たせた構成」を見てください。
                </li>
                <li>
                  ・GPUは目標fpsだけでなく、その設定で必要なVRAMを満たすものだけを出しています。
                </li>
                <li>
                  ・前の構成と GPU・CPU がどちらも同じになったときは、カードを繰り返さず「〜と同じ構成です」とまとめています。
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

/* ------------------------------------------------------------------ 3つの構成のカード */

type TierView = {
  tier: TierResult;
  meta: (typeof TIERS)[number];
  /** 前の段と GPU・CPU の両方が同じなら、その段の名前 */
  sameAs: string | null;
  /** 先頭の GPU と CPU を組み合わせた推定（predict() の結果そのまま）。どちらかが出せなければ null */
  pair: { gpu: Candidate<Gpu>; cpu: Candidate<Cpu>; p: Prediction } | null;
};

/**
 * solveBuild() の結果を、カードに出す形にする。計算は増やさない:
 * 推定平均fps・1% Low・律速は、その段の先頭の GPU と CPU を predict() に入れた結果をそのまま使う
 * （逆引きの自己テスト assertBuildInverts と同じ入れ直し）。
 */
function toViews(tiers: TierResult[], game: GameProfile, preset: PresetProfile, resolution: ResolutionId): TierView[] {
  const views: TierView[] = [];
  for (const t of tiers) {
    const meta = TIERS.find((x) => x.id === t.tier)!;
    const gpu = t.gpu.kind === 'ok' ? t.gpu.candidates[0]! : null;
    const cpu = t.cpu.kind === 'ok' ? t.cpu.candidates[0]! : null;
    const pair =
      gpu && cpu
        ? {
            gpu,
            cpu,
            p: predict({ gpuFps4kHigh: gpu.model.fpsValorant4kHigh, cpuCeiling: cpu.model.fpsValorantCeiling, resolution, game, preset }),
          }
        : null;
    // GPU と CPU の両方が一致したときだけ「同じ構成」とする
    const same = pair
      ? views.find((v) => v.pair && v.sameAs === null && v.pair.gpu.model.name === pair.gpu.model.name && v.pair.cpu.model.name === pair.cpu.model.name)
      : undefined;
    views.push({ tier: t, meta, sameAs: same ? same.meta.label : null, pair });
  }
  return views;
}

/** 選定理由。どの基準（必要な平均fps）で選び、GPU側・CPU側がいくつの見込みかを、計算した値から書く */
function reasonOf(v: TierView, targetFps: number, lowRatio: PresetProfile['lowRatio']): string {
  const need = Math.ceil(v.tier.requiredAvg);
  const pick = 'GPU と CPU のうち、それぞれ性能指数がいちばん低いものを選びました';
  let head: string;
  if (v.tier.tier === 'value') head = `平均fpsが目標の ${targetFps} fps に届く ${pick}。`;
  else if (v.tier.tier === 'headroom') head = `目標の1.2倍（平均 ${need} fps）に届く ${pick}。`;
  else {
    const r = lowRatio ? `この画質の 1% Low は平均の約${Math.round(lowRatio.min * 100)}〜${Math.round(lowRatio.max * 100)}%なので、低い側でも` : '';
    head = `${r}1% Low が目標の ${targetFps} fps に届くよう、平均 ${need} fps 以上が出る ${pick}。`;
  }
  if (!v.pair) return head;
  return `${head}GPU側は ${v.pair.gpu.fps.toFixed(0)} fps、CPU側は ${v.pair.cpu.fps.toFixed(0)} fps の見込みです（推定）。`;
}

function TierCard({
  step,
  view: v,
  selected,
  onSelect,
  game,
  targetFps,
  resolutionShort,
  presetLabel,
  lowRatio,
}: {
  step: number;
  view: TierView;
  selected: boolean;
  onSelect: () => void;
  game: GameProfile;
  targetFps: number;
  resolutionShort: string;
  presetLabel: string;
  lowRatio: PresetProfile['lowRatio'];
}) {
  const { pair } = v;
  const vramNeed = v.tier.vramNeedMb;
  return (
    <article
      data-tier={v.tier.tier}
      className={`rounded-lg border bg-panel p-4 sm:p-5 ${selected ? 'border-accent' : 'border-rule'}`}
    >
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[11px] text-dim">{step}</span>
        <h3 className="font-cond text-lg font-bold">{v.meta.label}</h3>
        <p className="w-full text-xs text-dim sm:w-auto sm:flex-1">{v.meta.summary}</p>
      </header>

      {v.sameAs ? (
        <p className="mt-3 rounded-md border border-rule-soft px-3 py-2 text-sm" data-same>
          この条件では{v.sameAs}と同じ構成です（GPU・CPU とも同じ）。
        </p>
      ) : pair ? (
        <>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="font-mono text-[10px] text-dim">GPU</dt>
              <dd className="font-medium">
                <Link href={`/gpu/${pair.gpu.model.slug}`} className="hover:text-accent" data-gpu>
                  {pair.gpu.model.name}
                </Link>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-[10px] text-dim">CPU</dt>
              <dd className="font-medium">
                <Link href={`/cpu/${pair.cpu.model.slug}`} className="hover:text-accent" data-cpu>
                  {pair.cpu.model.name}
                </Link>
              </dd>
            </div>
          </dl>

          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rule-soft pt-3">
            <div>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-dim">
                推定平均fps <Badge tone="estimate">推定</Badge>
              </p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-accent sm:text-3xl" data-avg>
                {pair.p.uncapped.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-dim">
                推定1% Low <Badge tone="estimate">推定</Badge>
              </p>
              <p className="mt-0.5 font-mono text-2xl font-semibold whitespace-nowrap tabular-nums sm:text-3xl" data-low>
                {pair.p.fps1Low ? `${pair.p.fps1Low.min.toFixed(0)}〜${pair.p.fps1Low.max.toFixed(0)}` : '—'}
              </p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-dim">
            目標 {targetFps} fps ・ {resolutionShort} ・ {presetLabel}
            {!pair.p.fps1Low && '・この画質では 1% Low を出していません'}
          </p>

          <h4 className="mt-3 font-mono text-[10px] tracking-wider text-dim">選定理由</h4>
          <p className="mt-0.5 text-sm text-dim" data-reason>
            {reasonOf(v, targetFps, lowRatio)}
          </p>

          <ul className="mt-3 space-y-1 text-xs text-dim" data-notes>
            <li>
              <span className="font-medium text-ink">VRAM：</span>
              {vramNeed === null
                ? 'この画質は VRAM の必要量を見積もれないため、判定していません。'
                : `この設定の目安は約 ${(vramNeed / VRAM_MB_PER_GB).toFixed(1)}GB。${pair.gpu.model.name}（${pair.gpu.model.vramGb}GB）は足りる見込みです。`}
            </li>
            <li>
              <span className="font-medium text-ink">律速：</span>
              {pair.p.bottleneck === 'cpu'
                ? 'CPU が上限を決めています（CPU律速）。GPU を上げても、平均fpsはほとんど伸びません。'
                : pair.p.bottleneck === 'gpu'
                  ? 'GPU が上限を決めています（GPU律速）。CPU を上げても、平均fpsはほとんど伸びません。'
                  : 'GPU と CPU がほぼ同じところで上限を決めています。片方だけ上げても、伸びは小さめです。'}
            </li>
            <li>
              <span className="font-medium text-ink">fps上限：</span>
              {pair.p.cap === null
                ? '計算上のゲーム側の上限は設けていません（ゲーム内で選べる fps 制限の設定は含めていません）。'
                : pair.p.capped
                  ? `理論値 ${pair.p.uncapped.toFixed(0)} fps はゲーム側の上限 ${pair.p.cap} fps を超えるため、画面では ${pair.p.cap} fps で止まります。`
                  : `ゲーム側の上限（${pair.p.cap} fps）より下です。`}
            </li>
          </ul>
        </>
      ) : (
        <dl className="mt-3 space-y-1.5 text-sm">
          <div>
            <dt className="font-mono text-[10px] text-dim">GPU</dt>
            <dd className="text-dim">{v.tier.gpu.kind === 'ok' ? v.tier.gpu.candidates[0]!.model.name : ngText(v.tier.gpu)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] text-dim">CPU</dt>
            <dd className="text-dim">{v.tier.cpu.kind === 'ok' ? v.tier.cpu.candidates[0]!.model.name : ngText(v.tier.cpu)}</dd>
          </div>
        </dl>
      )}
      {!v.sameAs && !pair && game.cap !== null && targetFps > game.cap && (
        <p className="mt-2 text-xs text-dim">目標を {game.cap} fps 以下にすると出せます。</p>
      )}

      {(v.tier.gpu.kind === 'ok' || v.tier.cpu.kind === 'ok') && (
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={`mt-3 min-h-9 cursor-pointer rounded-md border px-3 py-1.5 text-xs ${
            selected ? 'border-accent bg-accent-soft text-accent' : 'border-rule text-dim hover:border-accent hover:text-ink'
          }`}
        >
          {selected ? 'ほかの候補を下に表示中' : 'ほかの候補を見る'}
        </button>
      )}
    </article>
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
      className="rounded-lg w-full cursor-pointer border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
    >
      {children}
    </select>
  );
}
