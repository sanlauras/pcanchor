'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cpus, gpus } from '@/lib/data';
import { diagnose } from '@/lib/fps/diagnose';
import { GAMES, findGame } from '@/lib/fps/games';
import {
  ANCHOR,
  type GameProfile,
  type LighterComparison,
  type Prediction,
  RESOLUTIONS,
  type ResolutionId,
  errorRange,
  lighterScene,
  predict,
  refreshVerdicts,
} from '@/lib/fps/model';

const DEFAULT_GPU = ANCHOR.gpuName;
const DEFAULT_CPU = ANCHOR.cpuName;
const DEFAULT_GAME = 'valorant';
const DEFAULT_RES: ResolutionId = '1440p';

/** スマホの1行の結果に添える、上限を決めている側 */
const BOTTLENECK_SHORT: Record<Prediction['bottleneck'], string> = {
  gpu: 'GPU律速',
  cpu: 'CPU律速',
  balanced: 'GPUとCPUが拮抗',
};

/*
 * 選択は URL に持つ（2026-11-09 の全面再設計・段階3。それまでは ?game= ?gpu= ?cpu= を読むだけだった）。
 *
 *   ?game=valorant&gpu=radeon-rx-9070-xt&cpu=ryzen-7-9800x3d&res=1440p&preset=high
 *
 * - 選び直すたびに history.replaceState で書き換える（履歴は増やさない）。必要スペック診断（BuildTool）と同じ書き方
 * - 書くときは5つ全部を書く。コピーした URL だけで、同じ条件と同じ結果を開けるようにするため
 * - 読むときは1つずつ確かめ、知らない値・壊れた値は既定値に落とす。
 *   以前の ?game= ?gpu= ?cpu= だけの URL（ゲーム・GPU・CPU のページやホームからのリンク）もそのまま読める
 * - canonical は /tools/fps のまま（pageMetadata は変えていない）
 * - サーバー描画では空として扱い既定の選択で描画し、ブラウザで描画し直すときに差し替える
 *
 * 値はゲームの id、GPU・CPU の slug（個別ページの URL と同じもの）、解像度と画質の id。
 * メモリ・電源の任意入力は fps に使わないので URL には載せない。
 */
const CHANGE_EVENT = 'fpstool:change';

function subscribeUrl(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
const getSearch = () => window.location.search;
const getServerSearch = () => '';

type Selection = { gameId: string; gpuName: string; cpuName: string; resolution: ResolutionId; presetId: string };

function selectionFromUrl(search: string): Selection {
  const params = new URLSearchParams(search);
  const game = GAMES.find((g) => g.supported && g.id === params.get('game')) ?? findGame(DEFAULT_GAME);
  const gpu = gpus.find((g) => g.slug === params.get('gpu'));
  const cpu = cpus.find((c) => c.slug === params.get('cpu'));
  const res = RESOLUTIONS.find((r) => r.id === params.get('res'));
  // 画質はゲームごとに顔ぶれが違う。そのゲームに無い画質なら、そのゲームの基準の画質
  const preset = game.presets.find((p) => p.id === params.get('preset'));
  return {
    gameId: game.id,
    gpuName: gpu?.name ?? DEFAULT_GPU,
    cpuName: cpu?.name ?? DEFAULT_CPU,
    resolution: res?.id ?? DEFAULT_RES,
    presetId: preset?.id ?? game.featuredPresetId,
  };
}

/** 選択の URL（相対）。5つの条件を全部書く */
function selectionQuery(s: Selection): string {
  const q = new URLSearchParams({
    game: s.gameId,
    gpu: gpus.find((g) => g.name === s.gpuName)?.slug ?? '',
    cpu: cpus.find((c) => c.name === s.cpuName)?.slug ?? '',
    res: s.resolution,
    preset: s.presetId,
  });
  return `?${q.toString()}`;
}

/** 選び直したときに呼ぶ（描画中には呼ばない）。URL を書き換え、画面に知らせる */
function updateSelection(patch: Partial<Selection>) {
  const merged = { ...selectionFromUrl(window.location.search), ...patch };
  const url = new URL(window.location.href);
  url.search = selectionQuery(merged);
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * 自前の実測をした条件（CONTEXT.md「Valorant 実測4点」の A〜D）。fps の数値ではなく、条件の組み合わせだけ。
 * 基準機（RX 9070 XT＋Ryzen 7 9800X3D）でこの条件を選んだときだけ、「実測した条件」と書く。
 */
const MEASURED_CONDITIONS: { resolution: ResolutionId; presetId: string }[] = [
  { resolution: '1080p', presetId: 'low' },
  { resolution: '4k', presetId: 'high' },
  { resolution: '1440p', presetId: 'high' },
  { resolution: '4k', presetId: 'low' },
];

type Basis = { tone: 'estimate' | 'caution'; label: string; body: string };

/**
 * この推定がどんな根拠で出ているか。**確かめられる事実だけ**で分ける（新しい精度や保証は足さない）。
 * 分け方の判断は CONTEXT.md「全面再設計（2026-11）」段階3 に記録している。
 */
function basisOf(game: GameProfile, gpuName: string, cpuName: string, resolution: ResolutionId, presetId: string): Basis {
  const reference = gpuName === ANCHOR.gpuName && cpuName === ANCHOR.cpuName;
  if (game.id === 'valorant') {
    const measured = MEASURED_CONDITIONS.some((m) => m.resolution === resolution && m.presetId === presetId);
    if (reference && measured) {
      return {
        tone: 'estimate',
        label: '基準機で実測した条件',
        body: 'この組み合わせと条件は、当サイトが実測した4条件の1つです。係数はこの実測を再現するように決めていますが、表示している数字は計算の結果で、実測値そのものではありません。',
      };
    }
    if (resolution === '1080p') {
      return {
        tone: 'caution',
        label: '参考値（外挿）',
        body: 'VALORANT の 1080p は、GPU側の係数を実測から求められていません（1080p の実測は CPU が上限を決めていたため）。1440p と 4K の実測から外挿した係数を使っています。',
      };
    }
    return {
      tone: 'estimate',
      label: '自前の実測から換算',
      body: 'VALORANT の 4K・1440p の係数は、基準機の実測から求めています。',
    };
  }
  return {
    tone: 'estimate',
    label: '第三者の測定の比から換算',
    body: `${game.name} の係数は、${game.confidenceLabel}です。fps の数値そのものは保存せず、条件を変えたときの比だけを使っています。`,
  };
}

export function FpsTool() {
  const sel = selectionFromUrl(useSyncExternalStore(subscribeUrl, getSearch, getServerSearch));
  const { gpuName, cpuName, gameId, resolution } = sel;
  const [memory, setMemory] = useState('');
  const [psu, setPsu] = useState('');
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);

  const gpu = gpus.find((g) => g.name === gpuName) ?? gpus[0]!;
  const cpu = cpus.find((c) => c.name === cpuName) ?? cpus[0]!;
  const game = findGame(gameId);
  const res = RESOLUTIONS.find((r) => r.id === resolution)!;
  const preset = game.presets.find((p) => p.id === sel.presetId) ?? game.presets[0];

  function selectGame(id: string) {
    const next = findGame(id);
    // 選び直したゲームにその画質が無ければ、そのゲームの基準の画質に戻す
    updateSelection({ gameId: id, presetId: next.presets.some((p) => p.id === sel.presetId) ? sel.presetId : next.featuredPresetId });
  }

  async function copyUrl() {
    const url = `${window.location.origin}${window.location.pathname}${selectionQuery(sel)}`;
    // 表示中の条件を URL に書いてからコピーする（まだ何も選び直していない初期表示でも、条件つきの URL になる）
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    window.setTimeout(() => setCopied(null), 2500);
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

  const basis = preset ? basisOf(game, gpu.name, cpu.name, resolution, preset.id) : null;
  const notReference = [
    gpu.name !== ANCHOR.gpuName ? `GPU（${gpu.name}）` : null,
    cpu.name !== ANCHOR.cpuName ? `CPU（${cpu.name}）` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ------------------------------------------------ 入力 */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="GPU" required>
          <Select value={gpuName} onChange={(v) => updateSelection({ gpuName: v })}>
            {gpus.map((g) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="CPU" required>
          <Select value={cpuName} onChange={(v) => updateSelection({ cpuName: v })}>
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

        {/*
          スマホだけに出す1行の結果（2026-09-27。SEO監査の指摘: スマホでは結果が画面の下に隠れ、
          選んでも何も起きていないように見えた）。結果の本体は入力欄の下にあるので、そこへ飛べるようにする。
          値は下の結果と同じもの（計算は変えていない）。PC 幅では結果が横に並ぶので出さない。
        */}
        {game.supported && result && preset && (
          <a
            href="#fps-result"
            data-mobile-summary
            className="flex items-center justify-between gap-3 rounded-lg border border-frame bg-panel px-3 py-2 lg:hidden"
          >
            <span className="min-w-0">
              <span className="block font-mono text-[10px] tracking-wider text-dim">
                {res.short} / {preset.label}
              </span>
              <span className="font-mono text-2xl font-semibold tabular-nums text-accent">
                {result.prediction.uncapped.toFixed(0)}
              </span>
              <span className="ml-1.5 text-xs text-dim">
                fps（推定）・{BOTTLENECK_SHORT[result.prediction.bottleneck]}
              </span>
            </span>
            <span className="shrink-0 rounded-md bg-accent-vivid px-2 py-1 font-mono text-[11px] font-semibold text-on-accent">
              詳しく ↓
            </span>
          </a>
        )}

        {game.supported && (
          <>
            <Field label="解像度" required group>
              <Chips
                items={RESOLUTIONS.map((r) => ({ id: r.id, label: r.short }))}
                value={resolution}
                onChange={(v) => updateSelection({ resolution: v as ResolutionId })}
              />
            </Field>

            <Field label="画質" required group>
              <Chips
                items={game.presets.map((x) => ({ id: x.id, label: x.label }))}
                value={preset?.id ?? ''}
                onChange={(v) => updateSelection({ presetId: v })}
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
        {game.supported && result && preset && basis ? (
          <section
            id="fps-result"
            className="rounded-lg scroll-mt-[calc(var(--header-h)+1rem)] border border-rule bg-panel p-5"
          >
            {/* 見出しの階層をそろえるための見出し（下の「この数字の根拠」が H3 のため。2026-11-09 段階6） */}
            <h2 className="sr-only">予想の結果</h2>
            {/* 1. 選んだ条件。どの条件の数字なのかを、数字より先に見せる */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm" data-conditions>
                <dt className="font-mono text-[10px] leading-5 tracking-wider text-dim">ゲーム</dt>
                <dd className="min-w-0 font-medium">{game.name}</dd>
                <dt className="font-mono text-[10px] leading-5 tracking-wider text-dim">GPU</dt>
                <dd className="min-w-0 font-medium">{gpu.name}</dd>
                <dt className="font-mono text-[10px] leading-5 tracking-wider text-dim">CPU</dt>
                <dd className="min-w-0 font-medium">{cpu.name}</dd>
                <dt className="font-mono text-[10px] leading-5 tracking-wider text-dim">解像度・画質</dt>
                <dd className="min-w-0 font-medium">
                  {res.short} ／ {preset.label}
                </dd>
              </dl>
              <div className="flex flex-col gap-1 sm:items-end">
                <button
                  type="button"
                  onClick={copyUrl}
                  data-copy-url
                  className="min-h-10 cursor-pointer rounded-md border border-frame px-3 py-2 text-xs font-medium hover:border-accent hover:text-accent"
                >
                  この結果のURLをコピー
                </button>
                <span className="min-h-4 text-[11px] text-dim" role="status" aria-live="polite">
                  {copied === 'ok' ? 'コピーしました' : copied === 'fail' ? 'コピーできませんでした。アドレス欄のURLを使ってください' : ''}
                </span>
              </div>
            </div>

            {/*
              2. 推定平均fps と 推定1% Low を同格で大きく並べる。
              主役は理論値（ゲーム側の上限を除いた値）。このサイトの目的はPCの性能を知ることで、
              上限込みの値を主役にすると、上位構成がどれも同じ数字に揃って差が見えなくなるため（2026-09-17 ユーザー決定）。
              平均だけ見て決めると、Fortnite の Performance のように「平均は高いのに実際はカクつく」設定を選んでしまうため、1% Low も並べる。
            */}
            <div className="mt-4 grid gap-3 border-t border-rule-soft pt-4 sm:grid-cols-2">
              <div data-avg>
                <p className="flex items-center gap-2 text-xs text-dim">
                  推定平均fps <Badge tone="estimate">推定</Badge>
                </p>
                <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-accent">
                  {result.prediction.uncapped.toFixed(0)}
                </p>
                <p className="mt-1 font-mono text-xs text-dim">
                  およそ {errorRange(result.prediction.uncapped).min.toFixed(0)}〜
                  {errorRange(result.prediction.uncapped).max.toFixed(0)} fps
                  {game.cap !== null && '・上限を除いた理論値'}
                </p>
              </div>
              <div data-low>
                <p className="flex items-center gap-2 text-xs text-dim">
                  推定1% Low（カクつきの目安） <Badge tone="estimate">推定</Badge>
                </p>
                {result.prediction.fps1Low && preset.lowRatio ? (
                  <>
                    <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-ink">
                      {result.prediction.fps1Low.min.toFixed(0)}
                      <span className="text-2xl text-dim">〜</span>
                      {result.prediction.fps1Low.max.toFixed(0)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-dim">
                      平均の {Math.round(preset.lowRatio.min * 100)}〜{Math.round(preset.lowRatio.max * 100)}%
                      {result.prediction.cap !== null && result.prediction.fps1Low.max >= result.prediction.cap && '・上限で頭打ち'}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-dim">この画質では出していません</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-dim">
              どちらも当サイトの計算による推定値です（誤差 ±15〜20%）。この組み合わせで測った値ではありません。
            </p>

            {/* 3. ゲーム側の fps 上限。理論値・上限・上限を当てた後の値を分けて出す（値はすべて predict() の結果） */}
            <CapBreakdown game={game} prediction={result.prediction} />

            {/*
              カクつき（1% Low）とモニターの判定。
              1% Low の数字は上に大きく出したので、ここは読み方と判定だけ。
            */}
            {result.prediction.fps1Low && preset.lowRatio && (
              <div className="mt-4 rounded-lg border border-accent bg-accent-soft p-4">
                <p className="font-cond text-base font-bold text-ink">
                  カクつきの底は {result.prediction.fps1Low.min.toFixed(0)} fps の見込みです
                </p>

                {result.diagnosis.stutterNote && (
                  <p className="mt-2 max-w-[62ch] text-xs text-dim">
                    {result.diagnosis.stutterNote}
                  </p>
                )}

                {/* モニターのHzごとの判定。買い物の判断に直結する部分 */}
                <MonitorVerdicts prediction={result.prediction} />

                <p className="mt-3 max-w-[62ch] text-[11px] text-dim">
                  1% Low は「遅い方から1%のフレーム」の速度で、カクつきの目安です。平均が高くてもここが低いと、体感は数字ほど滑らかになりません。
                </p>
              </div>
            )}

            {/*
              「どういう条件での数値か」を取り違えると体感と大きく食い違うため、
              注記の箇条書きに埋めず、数値のすぐ下に独立した枠で出す。
            */}
            {game.highlight && (
              <div className="mt-4 rounded-lg border border-accent bg-accent-soft p-4">
                <p className="font-cond text-base font-bold text-ink">
                  {game.highlight.title}
                </p>
                <p className="mt-1 text-xs text-dim">{game.highlight.body}</p>
                {/* 倍率の根拠が無いゲームは文章だけにする */}
                {game.highlight.comparison && (
                  <SceneComparison
                    prediction={result.prediction}
                    comparison={game.highlight.comparison}
                  />
                )}
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-rule-soft pt-4 sm:grid-cols-3">
              <Stat label="GPU側の上限（推定）" value={`${result.prediction.gpuFps.toFixed(0)} fps`} />
              <Stat label="CPU側の上限（推定）" value={`${result.prediction.cpuFps.toFixed(0)} fps`} />
              <Stat label="上限を決めている側" value={BOTTLENECK_SHORT[result.prediction.bottleneck]} />
            </dl>

            {/*
              4. 推定の根拠。実測は基準機（RX 9070 XT＋Ryzen 7 9800X3D）の1台だけで、
              それ以外を実測済みと読ませない（2026-11-09 ユーザー指示）。「実測」の札はこの1台の説明にだけ使う。
            */}
            <div className="mt-4 border-t border-rule-soft pt-4" data-basis>
              <h3 className="font-cond text-base font-bold">この数字の根拠</h3>
              <ul className="mt-2 space-y-2 text-xs text-dim">
                <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Badge tone={basis.tone}>{basis.label}</Badge>
                  <span className="min-w-0 flex-1 basis-[16rem]">{basis.body}</span>
                </li>
                <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Badge tone="measured">実測は1台だけ</Badge>
                  <span className="min-w-0 flex-1 basis-[16rem]">
                    当サイトの実測データは、基準機（{ANCHOR.gpuName}＋{ANCHOR.cpuName}）で VALORANT を4条件測ったものだけです。ほかの構成・ゲーム・条件の数字は、そこからの推定です。
                  </span>
                </li>
                {notReference.length > 0 && (
                  <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Badge tone="estimate">スペックからの推定</Badge>
                    <span className="min-w-0 flex-1 basis-[16rem]">
                      選んだ{notReference.join('と')}の性能は、メーカー公式スペックから計算した性能指数で見積もっています（実測していません）。
                    </span>
                  </li>
                )}
              </ul>

              {/* ゲーム固有の注意書きと、プリセット固有の注意書き */}
              <ul className="mt-3 space-y-1.5 text-xs text-dim">
                {game.notes.map((n) => (
                  <li key={n}>・{n}</li>
                ))}
                {preset.note && <li>・{preset.note}</li>}
                <li>・デスクトップ向けの GPU・CPU が対象です。DLSS・FSR などのアップスケーリングとフレーム生成は計算に含めていません。</li>
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-dim">
                <span>
                  係数の出どころ: <span className="text-ink">{game.confidenceLabel}</span>
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
                <Link href="/methodology" className="text-accent underline">
                  算出方法を読む
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-rule bg-panel p-5">
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
                だけです。当サイトの検証機（RX 9070 XT + Ryzen 7 9800X3D）では、1440p最高でも4K最低でも300に張り付きました。根拠のない数値を出すより、出せないと書くことを選んでいます。
              </p>
            )}
          </section>
        )}

        {result && (
          <>
            <section className="border-l-2 border-accent bg-panel px-5 py-4">
              <h2 className="font-cond text-lg font-bold">{result.diagnosis.headline}</h2>
              <p className="mt-1.5 text-sm text-dim">{result.diagnosis.detail}</p>

              {result.diagnosis.capNote && (
                <p className="mt-2 text-xs text-dim">※ {result.diagnosis.capNote}</p>
              )}

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
                          {result.prediction.uncapped.toFixed(0)} → {u.toFps.toFixed(0)} fps
                          <span className="ml-2 text-accent">+{Math.round(u.gain * 100)}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-dim">
                    指数の誤差が ±15〜20% あるため、20%以上の改善が見込める候補だけを出しています。価格は扱っていないので、費用対効果は判断していません。
                  </p>
                </>
              )}
            </section>

            {result.diagnosis.vramWarning && (
              <section className="border-l-2 border-frame bg-panel px-5 py-4">
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
              平均fpsに対する 1% Low の比を、ゲーム別・画質プリセット別に実測から求めています。比は1つの値ではなく実測のばらつきをそのままレンジで持たせているので、
              <strong className="font-medium text-ink">
                レンジが狭い条件ほど信用できる
              </strong>
              と読んでください。
            </p>
            <p>
              比は条件で大きく変わります。Valorant は 0.70〜0.83 ですが、Fortnite の Performance は 0.26〜0.28 です。同じ「平均500fps」でも体感がまるで違います。GPU使用率が高いほど比が上がる傾向は2タイトルで共通しています。
            </p>
            <p>
              <strong className="font-medium text-ink">限界</strong> —
              自前の実測は1構成のみで、画質プリセットあたり2点しかありません。Fortnite側は実プレイの映像から求めたもので、テストシーンを固定できていません（平均fpsで約10%のばらつきがあります）。またゲームと画質ごとの比なので、GPUとCPUの組み合わせによる違いは反映していません。実測の投稿が集まれば精度を上げられます。
            </p>
            <p>
              <strong className="font-medium text-ink">終盤の高負荷時のfps</strong> —
              こちらは実測データが無いため出していません。何をもって高負荷とするかの定義から決める必要があります。他サイトの数値を転載すれば今すぐ出せますが、それは他社の計測結果であり、当サイトでは使いません。
            </p>
          </div>
        </details>

        <p className="border-t border-rule-soft pt-3 text-xs text-dim">
          逆に「この目標fpsを出すには何が必要か」を調べるなら
          <Link href="/tools/build" className="text-accent underline">
            必要スペック診断
          </Link>
          が使えます。
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 部品 */

/**
 * ゲーム側の fps 上限の内訳（2026-11-09 段階3）。
 *
 * 主役は上限を除いた理論値のまま。上限のあるゲームでは、
 * 理論値・当サイトの計算に使う上限・上限を当てた後の値の3つを分けて並べる。
 * 値はどれも predict() の結果（uncapped・cap・fps）をそのまま出す。計算は足さない。
 * 「上限」はゲームのデータ（games.ts の cap）にあるものだけで、ゲーム内の fps 制限の設定は含めない。
 */
function CapBreakdown({ game, prediction: p }: { game: GameProfile; prediction: Prediction }) {
  if (p.cap === null) {
    return (
      <p className="mt-4 rounded-lg border border-rule-soft px-3 py-2 text-xs text-dim" data-cap>
        当サイトの計算に使うゲーム側の fps 上限：<span className="font-medium text-ink">設けていない</span>
        。ゲーム内の設定で選べる fps の制限は含めていません。上の数字は、その制限をかけない場合の推定です。
      </p>
    );
  }
  const row = 'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5';
  return (
    <div className="mt-4 rounded-lg border border-frame p-4" data-cap>
      <p className="font-cond text-base font-bold">{game.name} にはゲーム側の fps 上限があります</p>
      <dl className="mt-2 divide-y divide-rule-soft">
        <div className={row}>
          <dt className="text-xs text-dim">理論値（上限を当てない推定）</dt>
          <dd className="font-mono text-base font-semibold tabular-nums" data-cap-uncapped>
            {p.uncapped.toFixed(0)} fps
          </dd>
        </div>
        <div className={row}>
          <dt className="text-xs text-dim">当サイトの計算に使うゲーム側の上限</dt>
          <dd className="font-mono text-base font-semibold tabular-nums" data-cap-limit>
            {p.cap} fps<span className="ml-1 text-[11px] font-normal text-dim">（エンジン仕様）</span>
          </dd>
        </div>
        <div className={row}>
          <dt className="text-xs text-dim">上限を当てた後の推定（画面に出る fps の目安）</dt>
          <dd className="font-mono text-base font-semibold tabular-nums text-accent" data-cap-applied>
            {p.fps.toFixed(0)} fps
          </dd>
        </div>
      </dl>
      <p className="mt-2 max-w-[62ch] text-xs text-dim">
        {p.capped
          ? `理論値が上限を超えているため、実際の画面では ${p.cap} fps で止まります。${p.cap} を超える部分は計算上の値で、画面で確かめることはできません。`
          : '理論値が上限より下なので、上限を当てても値は変わりません。'}
        ゲーム内の設定で選べる fps の制限は含めていません。
      </p>
    </div>
  );
}

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

/**
 * 重い場面と軽い場面の2行比較。
 *
 * 伸び率は倍率そのものではなく、実際に計算した比で出す。
 * Apex は倍率をGPU側だけに掛けるので、CPU側や300fps上限で頭打ちになると伸びないため。
 */
function SceneComparison({
  prediction: p,
  comparison: c,
}: {
  prediction: Prediction;
  comparison: LighterComparison;
}) {
  const lighter = lighterScene(p, c);
  // 性能の比較なので理論値どうしで比べる（上限で止めると伸びが見えなくなる）
  const gain = Math.round((lighter.uncapped / p.uncapped - 1) * 100);
  const overCap = (v: number) => p.cap !== null && v > p.cap;

  return (
    <>
      <dl className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3 border-b border-accent/25 pb-1.5">
          <dt className="text-xs text-dim">{c.measuredLabel}</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-ink">
            {p.uncapped.toFixed(0)} fps
            {overCap(p.uncapped) && (
              <span className="ml-2 text-[10px] font-normal text-dim">画面上は{p.cap}</span>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs text-dim">{c.lighterLabel}</dt>
          <dd className="font-mono text-lg font-semibold tabular-nums text-accent">
            約 {lighter.uncapped.toFixed(0)} fps
            {overCap(lighter.uncapped) && (
              <span className="ml-2 text-[10px] font-normal text-dim">画面上は{p.cap}</span>
            )}
            <span className="ml-2 text-[10px] font-normal text-dim">+{gain}% の目安</span>
          </dd>
        </div>
      </dl>
      {/* GPU側だけに掛けるゲームで伸びないのは、CPU側が理論値を決めているとき */}
      {c.appliesTo === 'gpu' && gain === 0 && (
        <p className="mt-2 text-xs text-dim">
          CPU側が上限を決めているため、場面が軽くなっても伸びません。
        </p>
      )}
      {c.basis && <p className="mt-2 text-[11px] text-dim">根拠: {c.basis}</p>}
    </>
  );
}

/**
 * 入力欄の見出し。選択肢のボタン（Chips）を包むときは group にする（2026-11-09）。
 * label で包むと、中のボタン全部が「解像度 1080p 1440p 4K」という同じ名前で読み上げられていたため。
 */
function Field({
  label, required, group, children,
}: { label: string; required?: boolean; group?: boolean; children: React.ReactNode }) {
  const head = (
    <span className="mb-1 block font-mono text-[10px] tracking-wider text-dim uppercase" aria-hidden={group || undefined}>
      {label}
      {required && <span className="ml-1 text-accent">*</span>}
    </span>
  );
  if (group) {
    return (
      <div role="group" aria-label={label} className="block">
        {head}
        {children}
      </div>
    );
  }
  return (
    <label className="block">
      {head}
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
      className="rounded-lg w-full cursor-pointer border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
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
      className="rounded-lg w-full border border-rule bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
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
            className={`cursor-pointer min-h-9 rounded-md border px-3 py-2 text-xs ${
              on
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule text-dim hover:border-accent hover:text-ink'
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
