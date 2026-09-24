'use client';

import { useState, useSyncExternalStore } from 'react';
import { AffiliateLink } from '@/components/AffiliateLink';
import {
  cm360,
  convertSens,
  degreesInWidth,
  edpi,
  scopedCm360,
  sensFromCm360,
  toInch360,
} from '@/lib/sens/convert';
import { SENS_GAMES, findSensGame, showsEdpi } from '@/lib/sens/games';

/**
 * 感度換算ツール。
 *
 * 計算はすべてこの中（ブラウザ内）で完結する（CLAUDE.md 絶対ルール4）。
 * 係数は src/lib/sens/games.ts、式は convert.ts にある。
 *
 * **入力の置き場所はURL。** React の state ではなくURLのパラメータを唯一の状態にして、
 * 書き込みはコンポーネントの外で行う（ThemePicker と同じ作り）。こうすると
 * 「今の設定のURLをそのまま共有できる」「再読み込みしても消えない」が自然に満たせる。
 * 端末の保存（localStorage）は、URLにパラメータが無いときの初期値として使う。
 */

/** 入力のしかた。同じ振り向き距離を出すための入口が3つある */
type Mode = 'sens' | 'edpi' | 'cm360';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'sens', label: 'ゲーム内感度', hint: '今のゲームの感度とDPIを入れます' },
  { id: 'edpi', label: 'eDPI', hint: 'eDPI（DPI × 感度）から出します' },
  { id: 'cm360', label: '振り向き距離', hint: '360度振り向く距離（cm）から出します' },
];

/** よく使うDPI。数値入力も残してあるので、ここに無い値も入れられる */
const DPI_PRESETS = ['400', '800', '1600', '3200'];

/** 端末への保存先。URLにパラメータが無いときだけ使う */
const STORAGE_KEY = 'pcanchor.sens';

/** URLを書き換えたことを自分自身に知らせるための合図 */
const CHANGE_EVENT = 'pcanchor:sens-change';

type Settings = {
  mode: Mode;
  game: string;
  sens: string;
  dpi: string;
  edpi: string;
  cm: string;
  scope: string;
  pad: string;
};

const DEFAULTS: Settings = {
  mode: 'sens', game: 'valorant', sens: '0.4', dpi: '800',
  edpi: '320', cm: '40', scope: '', pad: '',
};

const KEYS = Object.keys(DEFAULTS) as (keyof Settings)[];

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * 状態のかたまりを1本の文字列で返す。
 * オブジェクトを返すと毎回中身が別物になって描画が止まらなくなるため、文字列にしてある。
 */
function getSnapshot(): string {
  let saved = '';
  try {
    saved = localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    // プライベートウィンドウ等では読めない。既定値で動かす
  }
  return `${window.location.search}||${saved}`;
}

function getServerSnapshot(): string {
  return '||';
}

/** URL > 端末の保存 > 既定値 の順で拾う */
function parseSettings(snapshot: string): Settings {
  const sep = snapshot.indexOf('||');
  const params = new URLSearchParams(snapshot.slice(0, sep));
  let stored: Partial<Settings> = {};
  try {
    const raw = snapshot.slice(sep + 2);
    if (raw) stored = JSON.parse(raw) as Partial<Settings>;
  } catch {
    // 壊れた保存は無視して既定値に落とす
  }

  const pick = (key: keyof Settings): string =>
    params.get(key) ?? stored[key] ?? DEFAULTS[key];

  const mode = pick('mode');
  const game = pick('game');
  return {
    mode: mode === 'sens' || mode === 'edpi' || mode === 'cm360' ? mode : DEFAULTS.mode,
    game: SENS_GAMES.some((g) => g.id === game) ? game : DEFAULTS.game,
    sens: pick('sens'),
    dpi: pick('dpi'),
    edpi: pick('edpi'),
    cm: pick('cm'),
    scope: pick('scope'),
    pad: pick('pad'),
  };
}

/**
 * 設定を書き換える。URLと端末の保存を更新してから、描画し直す合図を出す。
 * React の描画中ではなく、クリックや入力のときにだけ呼ばれる。
 */
function updateSettings(patch: Partial<Settings>) {
  const merged = { ...parseSettings(getSnapshot()), ...patch };
  const url = new URL(window.location.href);
  for (const key of KEYS) {
    const value = String(merged[key]);
    // 空欄はURLに残さない（?scope= のような意味のないパラメータを増やさないため）
    if (value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(null, '', url);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // 保存できない環境でも計算は使えるので、黙って諦める
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 感度は 0.07 から 40 まで幅が広いので、桁に応じて小数点以下を変える */
function fmtSens(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return '—';
  if (v < 1) return v.toFixed(4);
  if (v < 10) return v.toFixed(3);
  if (v < 100) return v.toFixed(2);
  return v.toFixed(1);
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function SensTool() {
  // URLと端末の保存から今の設定を読む。書き込みは updateSettings が行う
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const settings = parseSettings(snapshot);
  const { mode, sens, dpi, edpi: edpiValue, cm, scope, pad: padWidth } = settings;
  const [copied, setCopied] = useState(false);

  const game = findSensGame(settings.game);
  const dpiNum = num(dpi);

  // どの入力方式でも、いったん「振り向き距離(cm/360)」に直してから各ゲームへ配る
  let baseCm = 0;
  let baseSens = 0;
  if (mode === 'cm360') {
    baseCm = num(cm);
    baseSens = dpiNum > 0 && baseCm > 0 ? sensFromCm360(baseCm, game.yaw, dpiNum) : 0;
  } else {
    baseSens = mode === 'edpi' ? (dpiNum > 0 ? num(edpiValue) / dpiNum : 0) : num(sens);
    baseCm = baseSens > 0 && dpiNum > 0 ? cm360({ yaw: game.yaw, sens: baseSens, dpi: dpiNum }) : 0;
  }

  const ready = baseCm > 0 && baseSens > 0 && dpiNum > 0;

  const rows = SENS_GAMES.map((g) => {
    const s = ready
      ? convertSens({ yaw: game.yaw, sens: baseSens, dpi: dpiNum }, { yaw: g.yaw, dpi: dpiNum })
      : 0;
    return { game: g, sens: s, edpi: edpi(s, dpiNum) };
  });

  // 基準のゲームを切り替える。振り向き距離は保ったまま、感度だけ入れ替える
  function switchBase(id: string) {
    const to = findSensGame(id);
    const next = ready
      ? convertSens({ yaw: game.yaw, sens: baseSens, dpi: dpiNum }, { yaw: to.yaw, dpi: dpiNum })
      : 0;
    if (mode === 'edpi') {
      updateSettings({ game: id, edpi: String(Math.round(next * dpiNum * 100) / 100) });
    } else if (mode === 'sens') {
      updateSettings({ game: id, sens: fmtSens(next) });
    } else {
      updateSettings({ game: id });
    }
  }

  // 設定はURLに入っているので、今のURLをそのまま渡せば同じ画面が開く
  function copyLink() {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // クリップボードが使えない環境ではURLをそのまま見せる
        window.prompt('このURLをコピーしてください', url);
      });
  }

  const padNum = num(padWidth);
  const half = baseCm / 2;
  const scopeNum = num(scope);
  const showScope = ready && scopeNum > 0 && scopeNum !== 1;
  const scopedCm = showScope ? scopedCm360(baseCm, scopeNum) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ------------------------------------------------ 入力 */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="入力のしかた" required>
          <Chips
            items={MODES.map((m) => ({ id: m.id, label: m.label }))}
            value={mode}
            onChange={(v) => updateSettings({ mode: v as Mode })}
          />
          <p className="mt-1.5 text-[11px] text-dim">
            {MODES.find((m) => m.id === mode)?.hint}
          </p>
        </Field>

        <Field label={mode === 'cm360' ? '基準にするゲーム' : '今プレイしているゲーム'} required>
          <Select value={settings.game} onChange={(v) => updateSettings({ game: v })}>
            {SENS_GAMES.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>

        {mode === 'sens' && (
          <Field label={game.scale === 'percent' ? 'ゲーム内感度（％）' : 'ゲーム内感度'} required>
            <NumberInput value={sens} onChange={(v) => updateSettings({ sens: v })} placeholder={game.placeholder} />
          </Field>
        )}

        {mode === 'edpi' && (
          <Field label="eDPI" required>
            <NumberInput value={edpiValue} onChange={(v) => updateSettings({ edpi: v })} placeholder="320" />
          </Field>
        )}

        {mode === 'cm360' && (
          <Field label="振り向き距離（cm/360）" required>
            <NumberInput value={cm} onChange={(v) => updateSettings({ cm: v })} placeholder="40" />
          </Field>
        )}

        <Field label="マウスのDPI" required>
          <NumberInput value={dpi} onChange={(v) => updateSettings({ dpi: v })} placeholder="800" />
          <div className="mt-2">
            <Chips
              items={DPI_PRESETS.map((d) => ({ id: d, label: d }))}
              value={dpi}
              onChange={(v) => updateSettings({ dpi: v })}
            />
          </div>
        </Field>

        <fieldset className="border-t border-rule-soft pt-4">
          <legend className="sr-only">任意の入力</legend>
          <p className="mb-3 font-mono text-[10px] tracking-wider text-dim uppercase">
            任意
          </p>
          <div className="space-y-3">
            <Field label="覗き込み時の感度倍率">
              <NumberInput value={scope} onChange={(v) => updateSettings({ scope: v })} placeholder="1" />
              <p className="mt-1 text-[11px] text-dim">
                スコープ・ADSの感度倍率です（VALORANTの「スコープ感度」など）。
              </p>
            </Field>
            <Field label="マウスパッドの横幅（cm）">
              <NumberInput value={padWidth} onChange={(v) => updateSettings({ pad: v })} placeholder="45" />
            </Field>
          </div>
        </fieldset>
      </form>

      {/* ------------------------------------------------ 結果 */}
      <div className="space-y-5">
        {ready ? (
          <>
            <section className="border border-rule bg-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-mono text-[10px] tracking-wider text-dim uppercase">
                  {game.name} / {fmtSens(baseSens)}
                  {game.scale === 'percent' && '%'} / {dpiNum} DPI
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="cursor-pointer border border-rule px-2.5 py-1 font-mono text-[10px] text-dim hover:border-ink hover:text-ink"
                >
                  {copied ? 'コピーしました' : 'リンクをコピー'}
                </button>
              </div>
              <p className="mt-2 font-mono text-5xl font-semibold tabular-nums text-accent">
                {baseCm.toFixed(1)}
                <span className="ml-2 text-xl text-dim">cm/360</span>
              </p>
              <p className="mt-1 font-mono text-xs text-dim">
                振り向き距離 — 360度回すのに動かすマウスの距離。
                {toInch360(baseCm).toFixed(2)} inch/360
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-rule-soft pt-4 sm:grid-cols-3">
                <Stat label="180度" value={`${half.toFixed(1)} cm`} />
                <Stat
                  label="eDPI"
                  value={showsEdpi(game) ? `${Math.round(baseSens * dpiNum)}` : '—'}
                />
                <Stat label="DPI" value={`${dpiNum}`} />
              </dl>
              {!showsEdpi(game) && (
                <p className="mt-2 text-[11px] text-dim">
                  {game.name} は％のスケールなので、eDPI（DPI × 感度）は他ゲームと比べられません。
                </p>
              )}
            </section>

            {showScope && (
              <section className="border border-accent bg-accent-soft p-5">
                <h2 className="font-cond text-lg font-bold">覗き込み時（倍率 {scopeNum}）</h2>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-ink">
                    {scopedCm.toFixed(1)}
                    <span className="ml-1 text-base text-dim">cm/360</span>
                  </span>
                  <span className="font-mono text-xs text-dim">
                    180度 {(scopedCm / 2).toFixed(1)} cm
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-dim">
                  <li>
                    ・倍率がそのまま感度に掛かるゲームでの計算です。
                    <strong className="font-medium text-ink">ゲーム内で確かめてください</strong>
                    （倍率を半分にして、振り向き距離が倍になれば合っています）。
                  </li>
                  <li>
                    ・<strong className="font-medium text-ink">ゲームをまたいだ「覗いたときの体感」は合わせていません。</strong>
                    覗くと視野も狭くなるため、そこまで揃えるには別の考え方（モニター距離の一致）が要ります。
                  </li>
                  <li>・上の換算表は腰だめの感度です。この倍率は表には影響しません。</li>
                </ul>
              </section>
            )}

            <section className="border border-rule bg-panel p-5">
              <h2 className="font-cond text-lg font-bold">他のゲームでの感度</h2>
              <p className="mt-1 text-xs text-dim">
                振り向き距離が {baseCm.toFixed(1)}cm でそろう感度です（DPI {dpiNum} のまま）。行を押すと、そのゲームを基準に切り替えます。
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-ink">
                      <th className="px-2 py-2 text-left font-cond text-xs">ゲーム</th>
                      <th className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap">感度</th>
                      <th className="px-2 py-2 text-right font-cond text-xs whitespace-nowrap">eDPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const isBase = r.game.id === game.id;
                      return (
                        <tr
                          key={r.game.id}
                          className={`border-b border-rule-soft ${isBase ? 'bg-accent-soft' : ''}`}
                        >
                          <th scope="row" className="px-2 py-2 text-left font-normal">
                            <button
                              type="button"
                              onClick={() => switchBase(r.game.id)}
                              className="cursor-pointer text-left hover:text-accent"
                            >
                              {r.game.name}
                            </button>
                            {isBase && (
                              <span className="ml-2 font-mono text-[10px] text-accent">基準</span>
                            )}
                          </th>
                          <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                            {fmtSens(r.sens)}
                            {r.game.scale === 'percent' && (
                              <span className="ml-0.5 text-[10px] text-dim">%</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-xs text-dim tabular-nums whitespace-nowrap">
                            {showsEdpi(r.game) ? Math.round(r.edpi) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="mt-3 space-y-1 text-xs text-dim">
                <li>・腰だめ（覗いていないとき）の感度だけを扱っています。ADS・スコープ時の感度はゲームごとに別の倍率が掛かります。</li>
                {SENS_GAMES.filter((g) => g.note).map((g) => (
                  <li key={g.id}>・{g.name}: {g.note}</li>
                ))}
              </ul>
            </section>

            <section className="border border-rule bg-panel p-5">
              <h2 className="font-cond text-lg font-bold">マウスパッドの幅は足りていますか</h2>
              <p className="mt-1 text-xs text-dim">
                180度振り向くのに {half.toFixed(1)}cm 動かします。パッドの端から端まで使い切ることはできないので、余裕を見た幅が要ります。
              </p>
              {padNum > 0 ? (
                <>
                  <p className="mt-3 font-mono text-2xl font-semibold tabular-nums text-ink">
                    横幅 {padNum}cm で{' '}
                    <span className="text-accent">
                      {Math.round(degreesInWidth(padNum, baseCm))}度
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-dim">
                    一振り（端から端まで）で回せる角度の目安です。
                  </p>
                  {padNum < half && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm text-ink">
                        180度に届いていません。横幅 {Math.ceil(half)}cm 以上のパッドなら、持ち替えずに振り向けます。
                      </p>
                      <AffiliateLink
                        query="ゲーミングマウスパッド 大型"
                        variant="block"
                        advice={
                          <>
                            商品ページの
                            <strong className="font-medium text-ink">横幅（mm）を確認</strong>
                            してください。同じ「XL」でもメーカーによって大きさが違います。
                          </>
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-dim">
                  左の「マウスパッドの横幅」を入れると、一振りで何度回せるかが出ます。
                </p>
              )}
            </section>
          </>
        ) : (
          <section className="border border-rule bg-panel p-5">
            <h2 className="font-cond text-lg font-bold">数値を入れてください</h2>
            <p className="mt-1.5 text-sm text-dim">
              感度・eDPI・振り向き距離のどれかと、マウスのDPIが必要です。DPIが分からない場合は、マウスの設定ソフトで確認できます。
            </p>
          </section>
        )}
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

/**
 * 数値入力。
 * step は "any" にしてある。0.01 などにすると 0.325 のような値が
 * ブラウザに「無効」と判定されるため（感度は細かい小数を入れる）。
 */
function NumberInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
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
      <dt className="font-mono text-[10px] tracking-wider text-dim uppercase">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
