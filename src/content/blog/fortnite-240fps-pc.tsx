import Link from 'next/link';
import { CpuCapTable, CpuReach, LowRatio, MinGpu, MinGpuForLow, MinGpuTable } from '@/components/blog/GameData';
import { B, Conclusion, DataTable, H2, Note, P, Term, UL } from '@/components/blog/Prose';
import { ProductSlot } from '@/components/blog/ProductSlot';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事2: フォートナイトで240fpsを目指すPCの選び方（2026-10-13）
 *
 * 検索意図: 240fps を出したい。何を買えば届くか、GPU・CPU・設定・モニターの関係を知りたい。
 * 「必ず240fps出る」とは書かない（推定・誤差±15〜20%）。1% Low の話は当サイト固有の比（Performance の測定）から。
 */

const S = {
  conclusion: { id: 'conclusion', label: '結論：240fpsは「フルHD・Performanceモード」が現実的' },
  gpu: { id: 'gpu', label: '240fpsに必要なGPU（解像度・画質別）' },
  cpu: { id: 'cpu', label: 'CPUは240fpsの上限を超えるか' },
  low: { id: 'low', label: '平均240fpsでもカクつく理由（1% Low）' },
  other: { id: 'other', label: 'モニター・設定・冷却' },
  summary: { id: 'summary', label: 'まとめ' },
};

export const post: BlogPost = {
  meta: {
    slug: 'fortnite-240fps-pc',
    title: 'フォートナイトで240fpsを目指すPCの選び方｜必要なGPU・CPUと設定の目安',
    description:
      'フォートナイトで240fpsを出すには、どのGPUとCPUが必要か。解像度と画質ごとの目安を当サイトの推定値（誤差±15〜20%）で示し、平均240fpsでもカクつく理由（1% Low）や、モニター・設定の注意点を解説します。',
    lead: 'フォートナイトで240fpsを出したい。でも、どのGPUを買えば届くのか、CPUは関係あるのか、設定はどうすればいいのか。この記事では、当サイトの推定値をもとに、240fpsに必要な条件を順番に整理します。',
    category: 'fps',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    status: 'published',
    targetKeyword: 'フォートナイト 240fps PC',
    relatedKeywords: ['フォートナイト 240fps スペック', 'フォートナイト 240fps 出るPC'],
    searchIntent: '240fpsを出すために必要なGPU・CPU・設定・モニターを知り、買うPCを決めたい',
    keyPoints: [
      '240fpsは、フルHD・Performanceモードがいちばん現実的。最高画質での240fpsはかなり重い',
      '平均が240fpsでも、重い場面ではずっと低いfpsになる。カクつきの底（1% Low）も見て選ぶ',
      '240fpsを画面に出し切るには、240Hz以上のモニターが必要',
    ],
    sources: [],
    related: ['fortnite-gaming-pc', 'rtx-5060-fortnite-fps', 'fortnite-system-requirements', 'gaming-pc-memory'],
    relatedPages: ['/tools/fps', '/games/fortnite'],
    productSlots: ['fortnite-240'],
  },
  toc: Object.values(S),
  Body,
};

function Body() {
  return (
    <>
      <Conclusion title="フルHD・Performanceモードなら、240fpsは手の届く目標です">
        <UL>
          <li>
            フルHD・Performanceモードで 240fps に届く最小の GPU は{' '}
            <MinGpu gameId="fortnite" presetId="performance" resolution="1080p" target={240} />
          </li>
          <li>
            同じフルHDでも最高画質（Epic）だと、240fps に届く GPU は{' '}
            <MinGpu gameId="fortnite" presetId="epic" resolution="1080p" target={240} />
          </li>
          <li>
            カクつきの底まで滑らかにしたいなら、平均にかなりの余裕が要ります（下の「1% Low」の節）
          </li>
        </UL>
        <p className="text-sm text-dim">
          CPU に Ryzen 7 9800X3D を組み合わせた場合の当サイトの推定値（誤差±15〜20%）です。この構成で必ず240fpsが出る、という意味ではありません。
        </p>
      </Conclusion>

      <H2 id={S.gpu.id}>{S.gpu.label}</H2>
      <P>
        240fps に必要な GPU は、解像度と画質で大きく変わります。下の表は、新品で買える世代のGPUから「240fps に届く、いちばん手頃なもの」を選んだ目安です。
      </P>
      <MinGpuTable gameId="fortnite" presetId="performance" targets={[240]} />
      <DataTable
        caption="フルHDで240fpsに届く最小のGPU（画質別）"
        head={['画質', 'GPU']}
        rows={[
          ['Performance（競技用）', <MinGpu key="p" gameId="fortnite" presetId="performance" resolution="1080p" target={240} />],
          ['低', <MinGpu key="l" gameId="fortnite" presetId="low" resolution="1080p" target={240} />],
          ['中', <MinGpu key="m" gameId="fortnite" presetId="medium" resolution="1080p" target={240} />],
          ['最高（Epic / Lumen Epic）', <MinGpu key="e" gameId="fortnite" presetId="epic" resolution="1080p" target={240} />],
        ]}
        note="CPU は Ryzen 7 9800X3D の場合の平均fps（推定・誤差±15〜20%）。"
      />
      <P>
        対戦で高fpsを狙うなら、Performanceモードが選びやすい設定です。画質を上げるほど、同じ240fpsに必要なGPUは一気に高くなります。
      </P>

      <H2 id={S.cpu.id}>{S.cpu.label}</H2>
      <P>
        GPU が十分に速いと、CPU が fps の上限を決めます。フォートナイトの Performanceモードは描く負担が軽いので、CPU の上限に当たりやすい設定です。
      </P>
      <P>
        <CpuReach gameId="fortnite" presetId="performance" target={240} />
        。240fps が目標なら、新品で買える世代の CPU で足りる見込みです。CPU の差が大きく出るのは、240fps より上を狙うときです。
      </P>
      <CpuCapTable
        gameId="fortnite"
        presetId="performance"
        target={240}
        only={['core-i5-13400f', 'core-i5-14400f', 'ryzen-5-7500f', 'ryzen-5-7600', 'core-i5-14600k', 'ryzen-5-9600x', 'ryzen-7-7800x3d', 'ryzen-7-9800x3d']}
      />

      <H2 id={S.low.id}>{S.low.label}</H2>
      <P>
        fps の数字は、ふつう「平均」です。でも実際のプレイでは、建築の打ち合いや撃ち合いの重い瞬間に fps が大きく落ちます。この落ち込みの目安が <Term word="1% Low">遅い方から1%のフレームの速さ</Term>です。
      </P>
      <P>
        当サイトが係数に使っている測定では、Performanceモードの 1% Low は平均の <LowRatio gameId="fortnite" presetId="performance" /> でした。平均が高く出やすい一方で、落ち込みも大きい設定です。
      </P>
      <P>
        たとえば、重い場面でも 144fps を割らないようにしたいなら、フルHD・Performanceモードで{' '}
        <MinGpuForLow gameId="fortnite" presetId="performance" resolution="1080p" lowTarget={144} /> になります（推定）。
      </P>
      <Note title="「平均240fps」の数字だけで選ばない">
        <p>
          平均で240fpsに届いても、重い場面ではそれよりずっと低くなります。滑らかさを重視するなら、目標より余裕のある GPU を選ぶか、構成ごとの 1% Low を fps予想で確かめてください。
        </p>
      </Note>

      <ToolCta
        href="/tools/fps?game=fortnite"
        title="自分の構成で、平均fpsと 1% Low を確かめる"
        button="fps予想を開く"
      >
        GPU と CPU を選ぶと、平均fpsと 1% Low、240Hz のモニターを活かせるかの判定が出ます。
      </ToolCta>

      <H2 id={S.other.id}>{S.other.label}</H2>
      <UL>
        <li>
          <B>モニター</B>：240fps を画面に出し切るには、240Hz 以上のモニターが必要です。144Hz のモニターでは、144回までしか画面が変わりません
        </li>
        <li>
          <B>設定</B>：Performanceモードにしたうえで、解像度はフルHDが基本です。WQHD にすると、必要な GPU が上がります（上の表）
        </li>
        <li>
          <B>冷却</B>：GPU や CPU が熱くなりすぎると、自動でクロックを下げて fps が落ちることがあります。ケースの風通しも確認してください
        </li>
        <li>
          <B>メモリ</B>：当サイトはメモリの容量が fps に与える影響を測っていません。容量の選び方は
          <Link href="/blog/gaming-pc-memory" className="text-accent underline">
            メモリは16GBと32GBどっち？
          </Link>
          で説明しています
        </li>
      </UL>
      <ProductSlot slot="fortnite-240" title="フルHD・240fps を目安にした構成のゲーミングPC" />

      <ToolCta
        href="/tools/build?game=fortnite&fps=240"
        title="240fps に届く GPU と CPU の組み合わせを逆引きする"
        button="構成選びを開く"
      >
        解像度と画質を選ぶと、240fps を満たす最小の構成を、コスパ・余裕・安定の3段階で出します。
      </ToolCta>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>240fps は、フルHD・Performanceモードがいちばん現実的</li>
        <li>CPU は、新品で買える世代なら 240fps の上限は超える見込み。それより上を狙うときに差が出る</li>
        <li>平均だけでなく 1% Low も見て、目標より余裕のある構成にする</li>
        <li>240Hz 以上のモニターを用意する</li>
      </UL>
      <P>
        必要な GPU の全体像は
        <Link href="/blog/fortnite-gaming-pc" className="text-accent underline">
          フォートナイトにおすすめのゲーミングPC
        </Link>
        、全モデルの推定fpsは
        <Link href="/games/fortnite" className="text-accent underline">
          フォートナイトの推奨GPUのページ
        </Link>
        にあります。
      </P>
    </>
  );
}
