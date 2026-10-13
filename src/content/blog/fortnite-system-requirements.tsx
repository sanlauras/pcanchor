import Link from 'next/link';
import { MinGpu, MinGpuTable } from '@/components/blog/GameData';
import { OfficialSpecTables } from '@/components/blog/Official';
import { B, Conclusion, H2, Note, P, UL } from '@/components/blog/Prose';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事3: フォートナイトの推奨スペックとPC選び（2026-10-13）
 *
 * 検索意図: フォートナイトの必要・推奨スペックを知りたい。自分のPCで動くか、どれくらいのPCを買えばいいか判断したい。
 *
 * **公式の動作環境は、Epic の公式ページで確認してから書く**（記憶や他社の記事の数字は使わない。CLAUDE.md 絶対ルール2）。
 * Epic のページ（fortnite.com・ヘルプ・ストア）は自動の取得を拒否された（403・ロボット確認）ため、
 * ユーザーが撮ってくれた公式ページのスクリーンショット（2026-10-13）を、src/lib/fps/official-requirements.ts に原文どおり写した。
 */

const S = {
  conclusion: { id: 'conclusion', label: '結論：公式の推奨スペックと、高fpsの目安は別物' },
  official: { id: 'official', label: 'フォートナイトの公式の必要・推奨スペック' },
  highfps: { id: 'highfps', label: '144fps・240fpsで遊ぶための目安' },
  check: { id: 'check', label: '自分のPCで動くか確かめる方法' },
  summary: { id: 'summary', label: 'まとめ' },
};

export const post: BlogPost = {
  meta: {
    slug: 'fortnite-system-requirements',
    title: 'フォートナイトの推奨スペックとPC選び｜公式の条件と、高fpsで遊ぶための目安',
    description:
      'フォートナイトの公式の必要・推奨スペック（出典つき）と、144fps・240fpsで快適に遊ぶための GPU の目安（当サイトの推定値・誤差±15〜20%）を分けて解説します。自分のPCで動くかを確かめる方法も紹介します。',
    lead: 'フォートナイトの「推奨スペック」を調べると、公式の条件と、高fpsで遊ぶための目安がごちゃ混ぜになりがちです。この記事では、公式が示す条件と、144fps・240fpsを狙うときの目安を分けて整理します。',
    category: 'parts',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    status: 'published',
    targetKeyword: 'フォートナイト 推奨スペック',
    relatedKeywords: ['フォートナイト 必要スペック PC', 'フォートナイト PC スペック'],
    searchIntent: '公式の必要・推奨スペックを知り、自分のPCで動くか、どの程度のPCを買えばよいか判断したい',
    keyPoints: [
      '公式の推奨スペックは「動かすための条件」で、高fpsを保証するものではない',
      '144fps・240fpsを狙うなら、公式の推奨より上の GPU が要る',
      '自分のPCのGPUとCPUが分かれば、fps予想で何fps出るかを確かめられる',
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
      <Conclusion title="公式の推奨は「動かすための条件」。高fpsはもっと上の GPU が要ります">
        <UL>
          <li>公式の必要・推奨スペックは、ゲームを動かすための最低限の目安です</li>
          <li>
            フルHD・Performanceモードで 144fps を狙うなら、GPU は{' '}
            <MinGpu gameId="fortnite" presetId="performance" resolution="1080p" target={144} /> 以上が目安
          </li>
          <li>
            フルHD・Performanceモードで 240fps なら{' '}
            <MinGpu gameId="fortnite" presetId="performance" resolution="1080p" target={240} /> 以上が目安
          </li>
        </UL>
        <p className="text-sm text-dim">GPU の目安は CPU に Ryzen 7 9800X3D を組み合わせた場合の当サイトの推定値（誤差±15〜20%）です。</p>
      </Conclusion>

      <H2 id={S.official.id}>{S.official.label}</H2>
      <P>
        Epic の公式ヘルプには「最小」と「推奨」の2つのシステム要件があります。公式の記載をそのまま載せます。
      </P>
      <OfficialSpecTables gameId="fortnite" />
      <Note title="公式の条件の読み方">
        <p>
          公式の「推奨スペック」は、ゲームを快適に動かすための目安として示されたものです。何fpsで遊べるかまでは書かれていないことが多く、144fps や 240fps を保証するものではありません。
        </p>
      </Note>

      <H2 id={S.highfps.id}>{S.highfps.label}</H2>
      <P>
        高fpsで遊ぶための GPU の目安を、当サイトの推定値でまとめました。新品で買える世代の GPU から、目標の fps に届く、いちばん手頃なものを選んでいます。
      </P>
      <MinGpuTable gameId="fortnite" presetId="performance" targets={[144, 240]} />
      <MinGpuTable gameId="fortnite" presetId="epic" targets={[60, 144]} />
      <P>
        くわしい選び方は
        <Link href="/blog/fortnite-gaming-pc" className="text-accent underline">
          フォートナイトにおすすめのゲーミングPC
        </Link>
        で解説しています。
      </P>

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
      <ToolCta href="/tools/fps?game=fortnite" title="型番が分かったら、フォートナイトで何fps出るか調べる" button="fps予想を開く">
        GPU と CPU を選ぶだけで、推定fpsと 1% Low、どちらが上限を決めているかが分かります。
      </ToolCta>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>公式の推奨スペックは「動かすための条件」として見る</li>
        <li>144fps・240fps を狙うなら、公式の推奨より上の GPU を選ぶ</li>
        <li>自分の PC の型番を確かめ、fps予想で何fps出るかを見る</li>
      </UL>
    </>
  );
}
