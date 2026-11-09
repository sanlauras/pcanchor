import Link from 'next/link';
import { MinGpuTable } from '@/components/blog/GameData';
import { OfficialSpecTables } from '@/components/blog/Official';
import { B, Conclusion, H2, H3, Note, P, UL } from '@/components/blog/Prose';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事3: フォートナイトの推奨スペックとPC選び（2026-10-13 公開）
 *
 * 検索意図: フォートナイトの公式の必要・推奨スペックを知り、その読み方（動くことと、快適・高fpsで遊ぶことの違い）を理解したい。
 *
 * **公式の動作環境は、Epic の公式ページで確認してから書く**（記憶や他社の記事の数字は使わない。CLAUDE.md 絶対ルール2）。
 * Epic のページ（fortnite.com・ヘルプ・ストア）は自動の取得を拒否された（403・ロボット確認）ため、
 * ユーザーが撮ってくれた公式ページのスクリーンショット（2026-10-13）を、src/lib/fps/official-requirements.ts に原文どおり写した。
 *
 * 2026-11-09 の整理（ユーザーの指示）: 「おすすめのゲーミングPC」（fortnite-gaming-pc）と、目安の表と結論の箇条書きが重なっていた。
 * この記事は公式の条件の読み方に絞り、fps の目安は 1080p・Performance の表1つだけにした。
 * ほかの解像度・最高画質の目安と、PC の構成・選び方は、おすすめPCの記事へ案内する。
 * 公式の条件の記載そのもの（official-requirements.ts）と出典・確認日は変えていない。
 */

const S = {
  conclusion: { id: 'conclusion', label: '結論：公式の条件は「動くかどうか」の目安' },
  official: { id: 'official', label: 'フォートナイトの公式の必要・推奨スペック' },
  read: { id: 'read', label: '公式の条件の読み方' },
  difference: { id: 'difference', label: '「動く」ことと「高fpsで遊べる」ことの違い' },
  basics: { id: 'basics', label: 'PCスペックの基本的な見方' },
  check: { id: 'check', label: '自分のPCで動くか確かめる方法' },
  summary: { id: 'summary', label: 'まとめ' },
};

const GUIDE = '/blog/fortnite-gaming-pc';

export const post: BlogPost = {
  meta: {
    slug: 'fortnite-system-requirements',
    title: 'フォートナイトの推奨スペックとPC選び｜公式の必要・推奨動作環境の読み方',
    description:
      'フォートナイトの公式の必要・推奨スペック（出典・確認日つき）を載せ、その読み方を解説します。公式の条件で「動く」ことと、144fps・240fpsの高fpsで遊べることの違い、自分のPCで確かめる方法も紹介します。',
    lead: 'フォートナイトの「推奨スペック」を調べると、公式の条件と、高fpsで遊ぶための目安がごちゃ混ぜになりがちです。この記事では、Epic Games が公表している必要・推奨の条件をそのまま載せ、その読み方を整理します。どのゲーミングPCを選べばよいかは、別の記事で詳しく解説しています。',
    category: 'parts',
    publishedAt: '2026-10-13',
    // 2026-11-09: 記事の役割を「公式の条件の読み方」に絞り、本文を書き直した（目安の表を1つにし、選び方はおすすめPCの記事へ）
    updatedAt: '2026-11-09',
    status: 'published',
    targetKeyword: 'フォートナイト 推奨スペック',
    relatedKeywords: ['フォートナイト 必要スペック PC', 'フォートナイト PC スペック'],
    searchIntent: '公式の必要・推奨スペックを知り、その条件が何を意味するのか（動くことと、快適・高fpsで遊べることの違い）を理解したい',
    keyPoints: [
      '公式の必要・推奨スペックは「ゲームが動くかどうか」の目安で、何fps出るかは書かれていない',
      '「最小」は起動できる下限、「推奨」は快適に動かすための条件。高fpsで遊べることは保証していない',
      '自分のPCの GPU と CPU が分かれば、fps予想で何fps出るかを確かめられる',
    ],
    sources: [
      {
        label: 'Epic Games ヘルプ「PC上で『フォートナイト』に最低限必要なシステム要件」',
        url: 'https://www.epicgames.com/help/ja-JP/c-Category_Fortnite/c-Fortnite_TechnicalSupport/what-are-the-minimum-system-requirements-to-play-fortnite-a000084793',
        checkedOn: '2026-10-13',
      },
    ],
    related: ['fortnite-gaming-pc', 'fortnite-240fps-pc', 'gaming-pc-memory'],
    relatedPages: ['/games/fortnite'],
    productSlots: [],
  },
  toc: Object.values(S),
  Body,
};

function Body() {
  return (
    <>
      <Conclusion title="公式の必要・推奨スペックは「動くかどうか」の目安です">
        <UL>
          <li>
            <B>最小システム要件</B>は、ゲームを起動して遊べる下限の条件です
          </li>
          <li>
            <B>推奨システム要件</B>は、快適に動かすための条件です。ただし、何fpsで遊べるかは書かれていません
          </li>
          <li>144fps・240fps のような高fpsで遊びたいなら、公式の条件とは別に、目標のfpsから GPU を考えます</li>
        </UL>
        <p className="text-sm text-dim">
          実際にどのゲーミングPCを選べばよいかは、
          <Link href={GUIDE} className="text-accent underline">
            フォートナイトにおすすめのゲーミングPC
          </Link>
          で、目標fps・解像度・画質ごとに解説しています。
        </p>
      </Conclusion>

      <H2 id={S.official.id}>{S.official.label}</H2>
      <P>
        Epic の公式ヘルプには「最小」と「推奨」の2つのシステム要件があります。公式の記載をそのまま載せます（当サイトの推定ではありません）。
      </P>
      <OfficialSpecTables gameId="fortnite" />

      <H2 id={S.read.id}>{S.read.label}</H2>
      <H3>最小システム要件：起動できる下限</H3>
      <P>
        ビデオカードの欄には、Intel HD 4000 や AMD Radeon Vega 8 のような、CPU に内蔵されたグラフィックスも書かれています。これは「この条件でもゲームが起動して遊べる」という下限で、快適さや fps の高さを示すものではありません。
      </P>
      <H3>推奨システム要件：快適に動かすための条件</H3>
      <P>
        推奨では、ビデオカードに加えて、ビデオメモリ「2GBのVRAM」、メモリ「16GB以上のRAM」、ハードドライブ「NVMe SSD」が挙がっています。最小より一段上の条件で、快適に動かすための目安です。ただし、公式の推奨にも「何fpsで遊べるか」は書かれていません。
      </P>
      <Note title="公式の条件を読むときの注意">
        <p>
          公式の「推奨スペック」は、ゲームを快適に動かすための目安として示されたものです。144fps や 240fps を保証するものではありません。また、公式の条件は Epic が更新することがあるので、買う前に公式ページでも確かめてください（この記事の内容は確認日の時点のものです）。
        </p>
      </Note>

      <H2 id={S.difference.id}>{S.difference.label}</H2>
      <P>
        公式の条件を満たしていればゲームは動きます。一方で、対戦で有利になりやすい 144fps・240fps で遊びたいなら、公式の条件より上の GPU が必要です。どれくらい上かは、目標の fps と、解像度・画質で決まります。
      </P>
      <P>
        参考に、競技で多く使われる <B>フルHD（1080p）・Performanceモード</B>の目安を1つだけ載せます。当サイトの推定値で、公式の情報ではありません。
      </P>
      <MinGpuTable gameId="fortnite" presetId="performance" targets={[144, 240]} resolutions={['1080p']} />
      <P>
        WQHD・4K の場合や最高画質（Epic）の場合の目安、CPU の選び方、実際にどんな構成のゲーミングPCを選べばよいかは、
        <Link href={GUIDE} className="text-accent underline">
          フォートナイトにおすすめのゲーミングPC
        </Link>
        にまとめています。240fps を狙う場合の設定は
        <Link href="/blog/fortnite-240fps-pc" className="text-accent underline">
          240fpsを目指すPCの選び方
        </Link>
        で解説しています。
      </P>

      <H2 id={S.basics.id}>{S.basics.label}</H2>
      <P>公式の条件の項目は、それぞれ次のような意味です。</P>
      <UL>
        <li>
          <B>ビデオカード（GPU）</B>：画面を描く部品で、fps にいちばん効きます。型番の世代と、グレード（例: 60・70・80 の数字）で性能が変わります
        </li>
        <li>
          <B>プロセッサ（CPU）</B>：ゲームの処理を担当します。GPU が十分に速いと、CPU が出せる fps の上限を決めます
        </li>
        <li>
          <B>ビデオメモリ（VRAM）</B>：GPU が使うメモリです。画質や解像度を上げるほど多く使います
        </li>
        <li>
          <B>メモリ（RAM）</B>：PC 全体の作業領域です。容量の考え方は
          <Link href="/blog/gaming-pc-memory" className="text-accent underline">
            メモリは16GBと32GBどっち？
          </Link>
          で説明しています
        </li>
        <li>
          <B>ハードドライブ（ストレージ）</B>：推奨では NVMe SSD が挙がっています
        </li>
      </UL>

      <H2 id={S.check.id}>{S.check.label}</H2>
      <P>まず、自分のPCの GPU と CPU の型番を確かめます。Windows なら次の方法で分かります。</P>
      <UL>
        <li>
          <B>GPU</B>：タスクマネージャー（Ctrl＋Shift＋Esc）の「パフォーマンス」タブで「GPU」を選ぶ
        </li>
        <li>
          <B>CPU</B>：同じ「パフォーマンス」タブで「CPU」を選ぶ
        </li>
      </UL>
      <P>型番が分かったら、公式の条件の表と見比べます。何fps出るかまで知りたいときは、次のツールで調べられます。</P>
      <ToolCta href="/tools/fps?game=fortnite" title="型番が分かったら、フォートナイトで何fps出るか調べる" button="fps予想を開く">
        GPU と CPU を選ぶだけで、推定fpsと 1% Low、どちらが上限を決めているかが分かります。
      </ToolCta>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>公式の必要・推奨スペックは「動くかどうか」の目安として読む</li>
        <li>何fpsで遊べるかは公式の条件には書かれていないので、目標のfpsから別に考える</li>
        <li>買うPCを決めるときは、おすすめPCの記事で目標fps別の GPU・CPU を確かめる</li>
      </UL>
      <P>
        次に読む：
        <Link href={GUIDE} className="text-accent underline">
          フォートナイトにおすすめのゲーミングPC｜目標fps別に必要なGPU・CPUと選び方
        </Link>
      </P>
    </>
  );
}
