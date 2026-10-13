import Link from 'next/link';
import { FpsValue, GpuCpuMatrix, MinGpu, VramCheck } from '@/components/blog/GameData';
import { B, Conclusion, H2, Note, P, UL } from '@/components/blog/Prose';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事4: RTX 5060でフォートナイトは何fps出る？（2026-10-13）
 *
 * 検索意図: RTX 5060 を買う（買った）が、フォートナイトで何fps出るか、240fps に届くかを知りたい。
 * 当サイトは RTX 5060 を実測していない。数字は性能指数（メーカー公式スペックからの計算）と
 * フォートナイトの係数（許諾を得た Boss Benchmarks さんの測定から算出）による推定。そのことを本文に明記する。
 */

const GPU = 'geforce-rtx-5060';
const CPUS = ['core-i5-13400f', 'core-i5-14400f', 'ryzen-5-7500f', 'ryzen-7-7800x3d', 'ryzen-7-9800x3d'];

const S = {
  conclusion: { id: 'conclusion', label: '結論：RTX 5060 の推定fps' },
  table: { id: 'table', label: 'CPU・画質・解像度ごとの推定fps' },
  why: { id: 'why', label: 'GPU だけでは fps が決まらない理由' },
  vram: { id: 'vram', label: 'VRAM 8GB で足りるか' },
  about: { id: 'about', label: 'この数字について（推定の根拠）' },
  summary: { id: 'summary', label: 'まとめ' },
};

export const post: BlogPost = {
  meta: {
    slug: 'rtx-5060-fortnite-fps',
    title: 'RTX 5060でフォートナイトは何fps出る？CPU・画質・解像度別の推定fps',
    description:
      'GeForce RTX 5060でフォートナイトが何fps出るかを、CPU・画質・解像度ごとに当サイトの推定値（誤差±15〜20%）で表にしました。240fpsに届く条件、GPUだけでfpsが決まらない理由、VRAM 8GBで足りるかも解説します。',
    lead: 'RTX 5060 でフォートナイトは何fps出るのか。240fps に届くのか。答えは「組み合わせる CPU と、画質・解像度しだい」です。この記事では、条件ごとの推定fpsを表で示し、数字の見方を説明します。',
    category: 'fps',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    status: 'published',
    targetKeyword: 'RTX 5060 フォートナイト fps',
    relatedKeywords: ['RTX 5060 フォートナイト 240fps'],
    searchIntent: 'RTX 5060 でフォートナイトが何fps出るか、240fpsに届くかを、条件つきで知りたい',
    keyPoints: [
      'RTX 5060 の fps は、組み合わせる CPU と、画質・解像度で大きく変わる',
      'フルHD・Performanceモードなら高い fps が出る見込み。最高画質や高い解像度では大きく下がる',
      '数字は当サイトの推定値（誤差±15〜20%）。RTX 5060 を実際に測ったものではない',
    ],
    sources: [],
    related: ['fortnite-240fps-pc', 'fortnite-gaming-pc'],
    relatedPages: ['/games/fortnite'],
    productSlots: [],
  },
  toc: Object.values(S),
  Body,
};

function Body() {
  return (
    <>
      <Conclusion title="フルHD・Performanceモードなら高fps、画質を上げると大きく下がります">
        <UL>
          <li>
            RTX 5060 ＋ Ryzen 7 9800X3D、フルHD・Performanceモード：
            <FpsValue gameId="fortnite" presetId="performance" resolution="1080p" gpuSlug={GPU} cpuSlug="ryzen-7-9800x3d" />
          </li>
          <li>
            RTX 5060 ＋ Core i5-13400F、フルHD・Performanceモード：
            <FpsValue gameId="fortnite" presetId="performance" resolution="1080p" gpuSlug={GPU} cpuSlug="core-i5-13400f" />
          </li>
          <li>
            RTX 5060 ＋ Ryzen 7 9800X3D、フルHD・最高画質（Epic）：
            <FpsValue gameId="fortnite" presetId="epic" resolution="1080p" gpuSlug={GPU} cpuSlug="ryzen-7-9800x3d" />
          </li>
        </UL>
        <p className="text-sm text-dim">どれも平均fpsの推定値（誤差±15〜20%）です。測ったものではありません。</p>
      </Conclusion>

      <H2 id={S.table.id}>{S.table.label}</H2>
      <P>RTX 5060 に、手頃な価格帯から上位までの CPU を組み合わせたときの推定fpsです。</P>
      <GpuCpuMatrix gameId="fortnite" gpuSlug={GPU} cpuSlugs={CPUS} presetId="performance" />
      <GpuCpuMatrix gameId="fortnite" gpuSlug={GPU} cpuSlugs={CPUS} presetId="epic" />
      <P>
        参考までに、同じ条件（フルHD・Performanceモード・Ryzen 7 9800X3D）で 240fps に届く最小の GPU は{' '}
        <MinGpu gameId="fortnite" presetId="performance" resolution="1080p" target={240} /> です。
      </P>

      <H2 id={S.why.id}>{S.why.label}</H2>
      <P>
        fps は、GPU が出せる値と、CPU が出せる値の<B>低い方</B>で決まります。表の「GPU律速」は GPU が、「CPU律速」は CPU が上限を決めている状態です。
      </P>
      <UL>
        <li>
          <B>GPU律速のとき</B>：CPU を良くしても fps はほとんど変わりません。画質や解像度を下げると伸びます
        </li>
        <li>
          <B>CPU律速のとき</B>：GPU を良くしても fps はほとんど変わりません。CPU を良くすると伸びます
        </li>
      </UL>
      <P>
        RTX 5060 だけでなく、組み合わせる CPU と設定まで決めてはじめて、何fps出るかが決まります。
      </P>

      <ToolCta
        href={`/tools/fps?game=fortnite&gpu=${GPU}`}
        title="RTX 5060 と自分の CPU の組み合わせで、何fps出るか調べる"
        button="fps予想を開く"
      >
        RTX 5060 を選んだ状態で開きます。CPU と画質・解像度を選ぶと、推定fpsと 1% Low、どちらが上限を決めているかが出ます。
      </ToolCta>

      <H2 id={S.vram.id}>{S.vram.label}</H2>
      <P>
        RTX 5060 の VRAM（GPU のメモリ）は8GBです。フォートナイトの最高画質は VRAM を多く使うので、条件によっては足りなくなる見込みです。
      </P>
      <VramCheck gameId="fortnite" gpuSlug={GPU} />
      <P>
        VRAM が足りないと、平均fpsより、カクつき（1% Low）に出やすくなります。高い解像度・最高画質で遊ぶなら、VRAM の多い GPU も候補にしてください。
      </P>

      <H2 id={S.about.id}>{S.about.label}</H2>
      <Note title="当サイトは RTX 5060 を実際に測っていません">
        <p>
          この記事の数字は、GPU の性能指数（メーカー公式のスペックから当サイトが計算した値）と、フォートナイトの係数（許諾を得たうえで、Boss Benchmarks さんの測定から算出した比率）から出した推定値です。誤差は ±15〜20% です。
        </p>
        <p>
          計算の方法は
          <Link href="/methodology" className="text-accent underline">
            算出方法
          </Link>
          にまとめています。RTX 5060 の性能指数やスペックは
          <Link href={`/gpu/${GPU}`} className="text-accent underline">
            RTX 5060 のページ
          </Link>
          にあります。
        </p>
      </Note>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>RTX 5060 の fps は、CPU と画質・解像度で決まる</li>
        <li>フルHD・Performanceモードでは高い fps が出る見込み。最高画質では大きく下がる</li>
        <li>高い解像度・最高画質では、VRAM 8GB が足りなくなる見込みの条件がある</li>
      </UL>
      <P>
        240fps を目標に PC を選ぶなら、
        <Link href="/blog/fortnite-240fps-pc" className="text-accent underline">
          フォートナイトで240fpsを目指すPCの選び方
        </Link>
        も参考にしてください。
      </P>
    </>
  );
}
