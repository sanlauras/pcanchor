import Link from 'next/link';
import { CpuCapTable, CpuReach, LowRatio, MinGpu, MinGpuTable, PresetGain, VramNeed } from '@/components/blog/GameData';
import { B, Conclusion, H2, H3, Note, OL, P, Term, UL } from '@/components/blog/Prose';
import { ProductSlot } from '@/components/blog/ProductSlot';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事1: フォートナイトにおすすめのゲーミングPC（2026-10-13）
 *
 * 検索意図: フォートナイトを快適に遊べる PC を買いたい。予算・スペックの目安、144fps と 240fps の違い、モニターも要るかを知りたい。
 * 数字はすべて当サイトの計算（GameData の部品）から出す。予算の金額は書かない（価格データを持っていないため。
 * 製品が入ったら、確認日つきの価格が製品の枠に出る）。
 */

const S = {
  conclusion: { id: 'conclusion', label: '結論：目標fps別に必要なGPUとCPU' },
  decide: { id: 'decide', label: '最初に決める3つ（目標fps・解像度・画質）' },
  parts: { id: 'parts', label: 'GPU・CPU・メモリの役割' },
  mode: { id: 'mode', label: 'Performanceモードと最高画質の違い' },
  check: { id: 'check', label: '買う前に確認したいこと' },
  summary: { id: 'summary', label: 'まとめ' },
};

export const post: BlogPost = {
  meta: {
    slug: 'fortnite-gaming-pc',
    title: 'フォートナイトにおすすめのゲーミングPC｜目標fps別に必要なGPU・CPUと選び方',
    description:
      'フォートナイトを144fps・240fpsで遊ぶには、どのGPUとCPUが必要か。解像度と画質ごとの目安を、当サイトの推定値（誤差±15〜20%）で表にまとめました。Performanceモードと最高画質の違い、モニターやVRAMなど買う前の注意点も解説します。',
    lead: 'フォートナイト用にゲーミングPCを買いたいけれど、どのくらいのスペックが必要なのか分からない。そんな人に向けて、目標のfps（144・240）と解像度・画質から、必要なGPUとCPUの目安を表で示します。先に結論を出し、そのあとで理由と注意点を説明します。',
    category: 'game-pc',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    status: 'published',
    targetKeyword: 'フォートナイト おすすめPC',
    relatedKeywords: ['フォートナイト ゲーミングPC おすすめ', 'フォートナイト PC 何fps', 'フォートナイト 240fps PC'],
    searchIntent:
      'フォートナイトを快適に遊べるPCを選びたい。目標fps別に必要なスペック、144fpsと240fpsの違い、モニターなど他に必要なものを知りたい',
    keyPoints: [
      '必要なPCは「目標fps」「解像度」「画質」の3つで決まる。まずこの3つを決める',
      '速いGPUでPerformanceモードにすると、CPUが上限を決めやすい。240fpsより上（360Hzなど）を狙うならCPUも選ぶ',
      '144fps・240fpsを画面に出し切るには、そのHzに対応したモニターも必要',
    ],
    sources: [],
    related: ['fortnite-240fps-pc', 'fortnite-system-requirements', 'rtx-5060-fortnite-fps', 'gaming-pc-memory'],
    relatedPages: ['/tools/fps', '/games/fortnite', '/tools/build'],
    productSlots: ['fortnite-144', 'fortnite-240'],
    featured: true,
  },
  toc: Object.values(S),
  Body,
};

function Body() {
  return (
    <>
      <Conclusion title="目標fpsと解像度で、必要なGPUの目安が決まります">
        <UL>
          <li>
            フルHD（1080p）・Performanceモードで <B>240fps</B> を狙うなら、GPU は{' '}
            <MinGpu gameId="fortnite" presetId="performance" resolution="1080p" target={240} /> 以上が目安
          </li>
          <li>
            フルHD・最高画質（Epic）で <B>144fps</B> を狙うなら、GPU は{' '}
            <MinGpu gameId="fortnite" presetId="epic" resolution="1080p" target={144} /> 以上が目安
          </li>
          <li>新品で買える世代の CPU なら 240fps の上限は超える見込み。それより上（360Hz など）を狙うなら CPU も選ぶ</li>
        </UL>
        <p className="text-sm text-dim">
          どれも CPU に Ryzen 7 9800X3D を組み合わせた場合の当サイトの推定値（誤差±15〜20%）です。測ったものではありません。
        </p>
      </Conclusion>

      <H2 id={S.conclusion.id}>{S.conclusion.label}</H2>
      <P>
        フォートナイトで出るfpsは、GPUだけでなく、解像度と画質で大きく変わります。下の表は、目標のfpsに届く「いちばん手頃なGPU」の目安です。新品で買える世代のGPUから選んでいます。
      </P>
      <MinGpuTable gameId="fortnite" presetId="performance" targets={[144, 240]} />
      <MinGpuTable gameId="fortnite" presetId="epic" targets={[60, 144]} />
      <P>
        表は平均fpsです。GPUを1段上げると余裕ができるので、ぎりぎりの構成は避けた方が安心です。ほかのGPUで何fps出るかは、
        <Link href="/games/fortnite" className="text-accent underline">
          フォートナイトの推奨GPUのページ
        </Link>
        に全モデルの表があります。
      </P>

      <H2 id={S.decide.id}>{S.decide.label}</H2>
      <P>PC を選ぶ前に、次の3つを決めると、必要なスペックがはっきりします。</P>
      <OL>
        <li>
          <B>目標のfps</B>：対戦で有利になりやすい高fps（144・240）を狙うのか、画質を楽しみたいのか
        </li>
        <li>
          <B>解像度</B>：フルHD（1920×1080）か、WQHD（2560×1440）か。解像度が上がるほど、GPU の負担が増えます
        </li>
        <li>
          <B>画質</B>：対戦向けの Performanceモードか、見た目のきれいな高画質か
        </li>
      </OL>
      <P>
        たとえば「フルHD・Performanceモードで240fps」と「WQHD・最高画質で144fps」では、必要なGPUがまったく違います。上の表で、自分の組み合わせの行と列を見てください。
      </P>

      <H2 id={S.parts.id}>{S.parts.label}</H2>
      <H3>GPU（グラフィックボード）</H3>
      <P>
        画面を描く部品で、fps にいちばん効きます。解像度や画質を上げるほど、GPU の差がそのままfpsの差になります。
      </P>
      <H3>CPU</H3>
      <P>
        ゲームの処理を担当する部品です。GPU が十分に速いと、今度は CPU が「これ以上は出せない」という上限を決めます。フォートナイトの Performanceモードは描く負担が軽いので、速い GPU と組み合わせると、フルHDやWQHDでは CPU が上限を決めやすくなります。
      </P>
      <P>
        <CpuReach gameId="fortnite" presetId="performance" target={240} />
        。CPU の差がはっきり出るのは、240fps より上（360Hz のモニターなど）を狙うときです。
      </P>
      <CpuCapTable
        gameId="fortnite"
        presetId="performance"
        target={360}
        only={['core-i5-13400f', 'core-i5-14400f', 'ryzen-5-7500f', 'ryzen-5-7600', 'core-i5-14600k', 'ryzen-5-9600x', 'ryzen-7-7800x3d', 'ryzen-7-9800x3d']}
      />
      <H3>メモリ</H3>
      <P>
        当サイトでは、メモリの容量がfpsにどれだけ影響するかを測っていません。ゲームだけか、配信や録画も一緒にするかで考え方が変わるので、
        <Link href="/blog/gaming-pc-memory" className="text-accent underline">
          メモリは16GBと32GBどっち？
        </Link>
        で詳しく説明しています。
      </P>
      <ProductSlot slot="fortnite-144" title="フルHD・144fps を目安にした構成のゲーミングPC" />

      <H2 id={S.mode.id}>{S.mode.label}</H2>
      <P>
        フォートナイトには、描く負担を軽くする <Term word="Performanceモード">設定の「描画モード」で選べる、軽い描き方</Term>があります。当サイトの計算では、最高画質（Epic）から Performanceモードに切り替えると、GPU 側のfpsはフルHDで <PresetGain gameId="fortnite" from="epic" to="performance" resolution="1080p" /> になります。
      </P>
      <P>
        ただし、平均fpsが高いほど滑らかとは限りません。<Term word="1% Low">いちばん重い瞬間に近いfps。カクつきの目安</Term>
        を見ると、Performanceモードでは平均の <LowRatio gameId="fortnite" presetId="performance" /> まで落ちていました（最高画質は{' '}
        <LowRatio gameId="fortnite" presetId="epic" />
        ）。平均が240fpsでも、重い場面では平均よりずっと低いfpsになることがある、ということです。
      </P>
      <Note title="Performanceモードの数字の見方">
        <p>
          Performanceモードは平均fpsが大きく伸びる一方、1% Low は平均に比べて大きく落ちます。「平均で何fps」だけでなく、カクつきの底も見て選ぶのがおすすめです。構成ごとの 1% Low は、fps予想のツールで出せます。
        </p>
      </Note>

      <ToolCta
        href="/tools/fps?game=fortnite"
        title="自分のPC・買う予定のPCで、フォートナイトが何fps出るか調べる"
        button="fps予想を開く"
      >
        GPUとCPUを選ぶだけで、平均fpsと1% Low、GPUとCPUのどちらが上限を決めているかが分かります。
      </ToolCta>

      <H2 id={S.check.id}>{S.check.label}</H2>
      <UL>
        <li>
          <B>モニターのリフレッシュレート（Hz）</B>：144fps を画面に出し切るには 144Hz 以上、240fps なら 240Hz 以上のモニターが必要です。60Hz のモニターでは、いくらfpsが出ても1秒に60回しか画面が変わりません
        </li>
        <li>
          <B>VRAM（GPU のメモリ）</B>：最高画質（Lumen が有効）は VRAM を多く使います。当サイトの見込みでは、4K・最高画質で{' '}
          <VramNeed gameId="fortnite" presetId="epic" resolution="4k" />、WQHD・最高画質で{' '}
          <VramNeed gameId="fortnite" presetId="epic" resolution="1440p" /> です。高画質で遊ぶなら、VRAM の容量も確認してください
        </li>
        <li>
          <B>価格・在庫・納期・保証</B>：同じ型番でも、時期や販売店で価格と構成が変わります。購入前に販売ページで最新の情報を確かめてください
        </li>
        <li>
          <B>世代</B>：古い世代のGPUは新品で手に入りにくいことがあります。この記事の表は、新品で買える世代から選んでいます
        </li>
      </UL>
      <ProductSlot slot="fortnite-240" title="フルHD・240fps を目安にした構成のゲーミングPC" />

      <ToolCta
        href="/tools/build?game=fortnite&fps=240"
        title="目標のfpsから、届くGPUとCPUの組み合わせを逆引きする"
        button="構成選びを開く"
      >
        ゲーム・解像度・画質と出したいfpsを入れると、それを満たす最小のGPUとCPUが分かります（コスパ・余裕・安定の3段階）。
      </ToolCta>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>まず「目標fps・解像度・画質」を決め、上の表で必要なGPUを確かめる</li>
        <li>Performanceモードで高fpsを狙うなら、CPU の上限も確認する</li>
        <li>出したいfpsに合ったリフレッシュレートのモニターを用意する</li>
        <li>高画質なら VRAM、買う前には価格・在庫・保証も確認する</li>
      </UL>
      <P>
        数字はすべて当サイトの推定値（誤差±15〜20%）です。計算の方法は
        <Link href="/methodology" className="text-accent underline">
          算出方法
        </Link>
        にまとめています。
      </P>
    </>
  );
}
