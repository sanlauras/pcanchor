import Link from 'next/link';
import { type Cpu, type Gpu, cpus, gpus } from '@/lib/data';
import { VRAM_MB_PER_GB, vramCapacityMb, vramNeedMb } from '@/lib/fps/diagnose';
import { findGame } from '@/lib/fps/games';
import { RESOLUTIONS, type ResolutionId, predict, resolutionFactor } from '@/lib/fps/model';
import { cpuSideFps } from '@/lib/fps/pairing';
import { rankGpusForGame, referenceCpu } from '@/lib/fps/table';
import { isCurrentCpu, isCurrentGenGpu } from '@/lib/generation';
import { DataTable } from './Prose';

/**
 * 記事に埋め込む「当サイトの計算から作る値と表」（2026-10-13）。
 *
 * **記事の fps の数字は、すべてここから出す**（CLAUDE.md「ブログ記事の決まり」）。手で書くと、係数やデータを直したときに
 * 記事だけ古い数字のまま残るうえ、記憶から書いた数字が紛れ込む。計算はツールやゲームページと同じ predict() などを使うので、
 * どのページでも同じ条件なら同じ値になる。表と値には必ず「推定」と条件（CPU・解像度・画質）を添える。
 *
 * 「買う」記事なので、候補は新品で買える世代（src/lib/generation.ts）に絞る。
 */

const EST = '推定・誤差±15〜20%';

function preset(gameId: string, presetId: string) {
  const game = findGame(gameId);
  const p = game.presets.find((x) => x.id === presetId);
  if (!p) throw new Error(`記事の部品: ${game.name} に画質「${presetId}」がありません`);
  return { game, preset: p };
}

function gpuBySlug(slug: string): Gpu {
  const g = gpus.find((x) => x.slug === slug);
  if (!g) throw new Error(`記事の部品: GPU「${slug}」がデータにありません`);
  return g;
}

function cpuBySlug(slug: string): Cpu {
  const c = cpus.find((x) => x.slug === slug);
  if (!c) throw new Error(`記事の部品: CPU「${slug}」がデータにありません`);
  return c;
}

const resLabel = (r: ResolutionId) => RESOLUTIONS.find((x) => x.id === r)!.short;

/** 目標fpsに届く、最も性能指数の低い現行世代の GPU（CPU は基準の Ryzen 7 9800X3D）。届かなければ null */
export function minimumGpu(args: { gameId: string; presetId: string; resolution: ResolutionId; target: number }) {
  const { game } = preset(args.gameId, args.presetId);
  const floor = game.overpredictsBelowIndex;
  const list = rankGpusForGame({
    gpus: gpus.filter(isCurrentGenGpu),
    cpu: referenceCpu(),
    gameId: args.gameId,
    presetId: args.presetId,
    resolution: args.resolution,
  }).filter((r) => r.uncapped >= args.target && (floor === null || r.gpu.perfIndex >= floor));
  return list.length > 0 ? list[list.length - 1]! : null;
}

function GpuLink({ gpu, gameId }: { gpu: Gpu; gameId: string }) {
  return (
    <Link href={`/gpu/${gpu.slug}#${gameId}`} className="font-bold text-accent underline underline-offset-2">
      {gpu.name}
    </Link>
  );
}

/** 本文の中に書く「〇fps に届く最小の GPU は ×× （推定 N fps）」 */
export function MinGpu(props: { gameId: string; presetId: string; resolution: ResolutionId; target: number }) {
  const e = minimumGpu(props);
  if (!e) return <span>現行世代のGPUでは届かない見込み</span>;
  return (
    <span>
      <GpuLink gpu={e.gpu} gameId={props.gameId} />
      <span className="text-dim">（推定 {e.uncapped.toFixed(0)} fps）</span>
    </span>
  );
}

/** 目標fps × 解像度ごとの、届く最小の GPU の表 */
export function MinGpuTable({
  gameId,
  presetId,
  targets,
  resolutions = ['1080p', '1440p', '4k'],
}: {
  gameId: string;
  presetId: string;
  targets: number[];
  resolutions?: ResolutionId[];
}) {
  const { game, preset: p } = preset(gameId, presetId);
  return (
    <DataTable
      caption={`${game.name}（${p.label}）で目標fpsに届く最小のGPU`}
      head={['目標', ...resolutions.map(resLabel)]}
      rows={targets.map((t) => [
        `${t} fps 以上`,
        ...resolutions.map((r) => <MinGpu key={r} gameId={gameId} presetId={presetId} resolution={r} target={t} />),
      ])}
      note={`CPU は Ryzen 7 9800X3D の場合の平均fps（${EST}）。新品で買える世代のGPUから、性能指数のいちばん低いものを出しています。近いモデル同士の順位は誤差に埋もれるので、目安として見てください。`}
    />
  );
}

/** そのCPUで、GPU が十分に速いときに出せる fps の上限（CPU 側の値） */
export function CpuCap({ gameId, presetId, cpuSlug }: { gameId: string; presetId: string; cpuSlug: string }) {
  const { game, preset: p } = preset(gameId, presetId);
  return <span className="font-mono font-semibold">{cpuSideFps(cpuBySlug(cpuSlug), game, p).toFixed(0)} fps</span>;
}

/** 現行世代の CPU ごとの上限の表。target を渡すと、届くかどうかを文字でも示す（色だけで伝えない） */
export function CpuCapTable({
  gameId,
  presetId,
  target,
  only,
}: {
  gameId: string;
  presetId: string;
  target?: number;
  /** 記事で見せる CPU を絞る（slug）。省くと新品で買える世代の全部 */
  only?: string[];
}) {
  const { game, preset: p } = preset(gameId, presetId);
  const list = cpus
    .filter((c) => (only ? only.includes(c.slug) : isCurrentCpu(c)))
    .map((c) => ({ cpu: c, fps: cpuSideFps(c, game, p) }))
    .sort((a, b) => a.fps - b.fps);
  return (
    <DataTable
      caption={`${game.name}（${p.label}）でCPUごとに出せるfpsの上限`}
      head={target ? ['CPU', '上限の目安', `${target}fps に`] : ['CPU', '上限の目安']}
      rows={list.map(({ cpu, fps }) => [
        <Link key="n" href={`/cpu/${cpu.slug}#${gameId}`} className="text-accent underline underline-offset-2">
          {cpu.name}
        </Link>,
        <span key="f" className="font-mono">{fps.toFixed(0)} fps</span>,
        ...(target ? [fps >= target ? '届く' : '届かない'] : []),
      ])}
      note={`GPU が十分に速いときの、CPU 側の上限（${EST}）。当サイトの計算では、CPU 側の値は解像度と画質によらず一定です。${only ? '代表的なCPUだけを並べています。全モデルはゲームのページにあります。' : '新品で買える世代のCPUだけを並べています。'}`}
    />
  );
}

/**
 * 新品で買える世代の CPU が、その目標fpsの上限を超えるか（本文に書く一文。数字は計算から）。
 * 例:「新品で買える世代のCPUは、すべて 240fps を超えます（いちばん低い Core i5-13400F でも 356 fps）」
 */
export function CpuReach({ gameId, presetId, target }: { gameId: string; presetId: string; target: number }) {
  const { game, preset: p } = preset(gameId, presetId);
  const list = cpus.filter(isCurrentCpu).map((c) => ({ cpu: c, fps: cpuSideFps(c, game, p) })).sort((a, b) => a.fps - b.fps);
  const below = list.filter((x) => x.fps < target);
  const low = list[0]!;
  if (below.length === 0) {
    return (
      <span>
        {`当サイトの推定では、新品で買える世代のCPUは、すべて ${target}fps の上限を超えます（いちばん低い ${low.cpu.name} でも `}
        <span className="font-mono font-semibold">{low.fps.toFixed(0)} fps</span>
        {'）'}
      </span>
    );
  }
  return <span>{`当サイトの推定では、新品で買える世代のCPU ${list.length} 個のうち ${below.length} 個が、${target}fps の上限に届きません`}</span>;
}

/** GPU × CPU × 画質 × 解像度の推定fps（本文に書く1つの値。理論値＝ゲーム側の上限を除いた値） */
export function FpsValue(props: { gameId: string; presetId: string; resolution: ResolutionId; gpuSlug: string; cpuSlug: string }) {
  const { game, preset: p } = preset(props.gameId, props.presetId);
  const gpu = gpuBySlug(props.gpuSlug);
  const cpu = cpuBySlug(props.cpuSlug);
  const x = predict({ gpuFps4kHigh: gpu.fpsValorant4kHigh, cpuCeiling: cpu.fpsValorantCeiling, resolution: props.resolution, game, preset: p });
  return <span className="font-mono font-semibold">約 {x.uncapped.toFixed(0)} fps</span>;
}

/**
 * 1% Low（カクつきの目安）を lowTarget 以上に保つための、平均fpsの目安と、それに届く最小の GPU。
 * 平均 × 1% Low の比（その画質で測った幅の下限）が lowTarget を超える平均を求める。CPU は基準の Ryzen 7 9800X3D
 */
export function MinGpuForLow(props: { gameId: string; presetId: string; resolution: ResolutionId; lowTarget: number }) {
  const { preset: p } = preset(props.gameId, props.presetId);
  if (!p.lowRatio) return <span>不明</span>;
  const avg = Math.ceil(props.lowTarget / p.lowRatio.min);
  return (
    <span>
      {'平均 '}
      <span className="font-mono font-semibold">約 {avg} fps</span>
      {' 以上が必要で、それに届く最小の GPU は '}
      <MinGpu gameId={props.gameId} presetId={props.presetId} resolution={props.resolution} target={avg} />
    </span>
  );
}

/** 1% Low（カクつき）が平均の何%か（その画質の測定から求めた比の幅） */
export function LowRatio({ gameId, presetId }: { gameId: string; presetId: string }) {
  const { preset: p } = preset(gameId, presetId);
  if (!p.lowRatio) return <span>不明</span>;
  return (
    <span className="font-mono font-semibold">
      {Math.round(p.lowRatio.min * 100)}〜{Math.round(p.lowRatio.max * 100)}%
    </span>
  );
}

/**
 * 画質 from → to で、GPU 側の fps がおよそ何倍になるか（その解像度での、設定係数×解像度係数の比）。
 * 画質ごとに解像度の効き方が違うので、解像度を必ず指定する（4K の比をフルHD の話に使わない）
 */
export function PresetGain({ gameId, from, to, resolution }: { gameId: string; from: string; to: string; resolution: ResolutionId }) {
  const a = preset(gameId, from).preset;
  const b = preset(gameId, to).preset;
  const ratio = (b.factor * resolutionFactor(resolution, b.k)) / (a.factor * resolutionFactor(resolution, a.k));
  return <span className="font-mono font-semibold">約{ratio.toFixed(1)}倍</span>;
}

/** GPU × CPU × 画質 × 解像度の推定fpsの表（例: RTX 5060 にいろいろな CPU を組み合わせた場合） */
export function GpuCpuMatrix({
  gameId,
  gpuSlug,
  cpuSlugs,
  presetId,
  resolutions = ['1080p', '1440p', '4k'],
}: {
  gameId: string;
  gpuSlug: string;
  cpuSlugs: string[];
  presetId: string;
  resolutions?: ResolutionId[];
}) {
  const { game, preset: p } = preset(gameId, presetId);
  const gpu = gpuBySlug(gpuSlug);
  const BOTTLENECK = { gpu: 'GPU律速', cpu: 'CPU律速', balanced: '拮抗' } as const;
  return (
    <DataTable
      caption={`${gpu.name} × CPU ごとの推定fps（${game.name}・${p.label}）`}
      head={['CPU', ...resolutions.map(resLabel)]}
      rows={cpuSlugs.map((s) => {
        const cpu = cpuBySlug(s);
        return [
          <Link key="n" href={`/cpu/${cpu.slug}#${gameId}`} className="text-accent underline underline-offset-2">
            {cpu.name}
          </Link>,
          ...resolutions.map((r) => {
            const x = predict({ gpuFps4kHigh: gpu.fpsValorant4kHigh, cpuCeiling: cpu.fpsValorantCeiling, resolution: r, game, preset: p });
            return (
              <span key={r}>
                <span className="font-mono font-semibold">{x.uncapped.toFixed(0)}</span>
                <span className="ml-1 text-xs text-dim">（{BOTTLENECK[x.bottleneck]}）</span>
              </span>
            );
          }),
        ];
      })}
      note={`平均fps（${EST}）。「GPU律速」は GPU が、「CPU律速」は CPU が上限を決めている状態です。`}
    />
  );
}

/** その画質・解像度で VRAM をどれくらい使う見込みか（「約 N.N GB」）。見込みが無い画質は「不明」 */
export function VramNeed({ gameId, presetId, resolution }: { gameId: string; presetId: string; resolution: ResolutionId }) {
  const need = vramNeedMb(preset(gameId, presetId).preset, resolution);
  return <span className="font-mono font-semibold">{need === null ? '不明' : `約 ${(need / VRAM_MB_PER_GB).toFixed(1)}GB`}</span>;
}

/** その GPU の VRAM で足りなくなる見込みの条件（ツールの VRAM の注意と同じ見込み）。無ければ「足りる」 */
export function VramCheck({ gameId, gpuSlug }: { gameId: string; gpuSlug: string }) {
  const game = findGame(gameId);
  const gpu = gpuBySlug(gpuSlug);
  const have = vramCapacityMb(gpu);
  const short = game.presets.flatMap((p) =>
    RESOLUTIONS.flatMap((r) => {
      const need = vramNeedMb(p, r.id);
      return need !== null && need > have ? [{ p, r, need }] : [];
    }),
  );
  if (short.length === 0) {
    return <p className="my-4 leading-[1.95]">{`${gpu.name}（VRAM ${gpu.vramGb}GB）は、当サイトの見込みでは ${game.name} のどの画質・解像度でも VRAM が足ります。`}</p>;
  }
  return (
    <DataTable
      caption={`${gpu.name}（VRAM ${gpu.vramGb}GB）で VRAM が足りなくなる見込みの条件（${game.name}）`}
      head={['画質', '解像度', '使う見込み']}
      rows={short.map(({ p, r, need }) => [p.label, r.short, `約 ${(need / VRAM_MB_PER_GB).toFixed(1)}GB`])}
      note="4Kでの測定値を基準に、解像度で概算した見込みです（推定）。VRAM が足りないと、平均fpsより、カクつき（1% Low）に出やすくなります。"
    />
  );
}
