import Link from 'next/link';
import { OfficialValue } from '@/components/blog/Official';
import { B, Conclusion, DataTable, H2, Note, P, Term, UL } from '@/components/blog/Prose';
import { ToolCta } from '@/components/blog/ToolCta';
import type { BlogPost } from './types';

/*
 * 記事5: ゲーミングPCのメモリは16GBと32GBのどちらがいい？（2026-10-13）
 *
 * 検索意図: メモリを16GBにするか32GBにするか迷っている。ゲームだけなら、配信や録画もするなら、どちらが合理的かを知りたい。
 *
 * **当サイトはメモリ容量が fps に与える影響を測っていない**ので、「〇%速くなる」のような数字は書かない。
 * 判断の軸（何を同時に動かすか）と、自分のPCで確かめる方法を中心にする。
 * フォートナイトの公式の推奨メモリは、記事3と同じデータ（ユーザーが撮った Epic の公式ページのスクリーンショット）から出す。
 */

const S = {
  conclusion: { id: 'conclusion', label: '結論：使い方で決める' },
  game: { id: 'game', label: 'ゲームだけを遊ぶ場合' },
  multi: { id: 'multi', label: '配信・録画・ブラウザも同時に使う場合' },
  check: { id: 'check', label: '自分のPCでメモリが足りているか確かめる' },
  buy: { id: 'buy', label: '買うときの注意' },
  summary: { id: 'summary', label: 'まとめ' },
};

export const post: BlogPost = {
  meta: {
    slug: 'gaming-pc-memory',
    title: 'ゲーミングPCのメモリは16GBと32GBどっち？ゲームだけか、配信もするかで決める',
    description:
      'ゲーミングPCのメモリを16GBにするか32GBにするかを、ゲームだけを遊ぶ場合と、配信・録画・ブラウザも同時に使う場合に分けて解説します。自分のPCでメモリが足りているかを確かめる方法と、買うときの注意も紹介します。',
    lead: 'ゲーミングPCを選ぶとき、メモリを16GBにするか32GBにするかで迷う人は多いはずです。答えは「何を同時に動かすか」で変わります。この記事では、使い方ごとの考え方と、自分のPCで足りているかを確かめる方法を説明します。',
    category: 'parts',
    publishedAt: '2026-10-13',
    updatedAt: '2026-10-13',
    status: 'published',
    targetKeyword: 'ゲーミングPC メモリ 16GB 32GB',
    relatedKeywords: ['フォートナイト メモリ 何GB', 'ゲーミングPC メモリ おすすめ'],
    searchIntent: '16GBと32GBのどちらが自分の使い方に合うかを、無駄な出費をせずに判断したい',
    keyPoints: [
      'メモリの容量は、fps を上げる部品ではなく「同時に動かすものが入りきるか」を決める部品',
      'ゲームだけなら、ゲームの公式の推奨を満たしていれば足りることが多い',
      '配信・録画・ブラウザを同時に使うなら、余裕のある容量を考える。実際の使用量はタスクマネージャーで確かめられる',
    ],
    sources: [
      {
        label: 'Epic Games ヘルプ「PC上で『フォートナイト』に最低限必要なシステム要件」',
        url: 'https://www.epicgames.com/help/ja-JP/c-Category_Fortnite/c-Fortnite_TechnicalSupport/what-are-the-minimum-system-requirements-to-play-fortnite-a000084793',
        checkedOn: '2026-10-13',
      },
      {
        label: 'Microsoft「Windows 11 の仕様とシステム要件」',
        url: 'https://www.microsoft.com/ja-jp/windows/windows-11-specifications',
        checkedOn: '2026-10-13',
      },
    ],
    related: ['fortnite-gaming-pc', 'fortnite-system-requirements'],
    relatedPages: ['/games/fortnite'],
    productSlots: [],
  },
  toc: Object.values(S),
  Body,
};

function Body() {
  return (
    <>
      <Conclusion title="ゲームだけなら公式の推奨を基準に、同時に色々使うなら余裕を持たせる">
        <UL>
          <li>メモリは、足りていれば fps はほとんど変わらない部品。足りないと、読み込みの遅れやカクつきの原因になります</li>
          <li>
            ゲームだけを遊ぶなら、ゲームの公式の推奨メモリを満たすことを基準にする（フォートナイトの推奨は
            <OfficialValue gameId="fortnite" tier="推奨システム要件" item="メモリ" />）
          </li>
          <li>配信・録画・ブラウザなどを同時に使うなら、その分の余裕を考えて容量を決める</li>
        </UL>
      </Conclusion>

      <P>
        <Term word="メモリ（RAM）">作業中のデータを一時的に置いておく場所</Term>
        は、置き場所が足りているうちは、増やしても fps はほとんど変わりません。足りなくなると、データを遅い保存先（SSD）とやりとりするため、読み込みの遅れやカクつきが起きやすくなります。つまり、大事なのは「同時に動かすものが入りきるか」です。
      </P>
      <Note title="当サイトの数字について">
        <p>
          当サイトは、メモリの容量が fps にどれだけ影響するかを測っていません。そのため、この記事では「16GBと32GBで何%違う」といった数字は書いていません。
        </p>
      </Note>

      <H2 id={S.game.id}>{S.game.label}</H2>
      <P>
        ゲームだけを遊ぶなら、まず遊ぶゲームの公式の推奨メモリを確かめます。Windows 11 そのものの最低条件は 4GB です（Microsoft の公式の要件）が、ゲームはそれより多くを使います。
      </P>
      <P>
        フォートナイトの場合、Epic の公式の推奨システム要件ではメモリが<OfficialValue gameId="fortnite" tier="推奨システム要件" item="メモリ" />、最小システム要件では<OfficialValue gameId="fortnite" tier="最小システム要件" item="メモリ" />です。ゲームだけを遊ぶなら、まずは推奨を満たすことが基準になります。
      </P>

      <H2 id={S.multi.id}>{S.multi.label}</H2>
      <P>
        ゲームと同時に、配信ソフト、録画、ボイスチャット、たくさんのタブを開いたブラウザなどを動かすと、そのぶんメモリを使います。どれだけ使うかは、使うソフトや設定で大きく変わります。
      </P>
      <DataTable
        caption="使い方ごとの考え方"
        head={['使い方', '考え方']}
        rows={[
          ['ゲームだけ', 'ゲームの公式の推奨メモリを満たしていれば、まずはそれで足りることが多い'],
          ['ゲーム＋ボイスチャット・少しのブラウザ', '推奨ぎりぎりだと余裕が少ない。実際の使用量を見て判断する'],
          ['ゲーム＋配信・録画・多くのタブ', '同時に動かすソフトの分、余裕のある容量を考える'],
        ]}
        note="実際に必要な容量は、使うソフトと設定で変わります。次の節の方法で、自分の使い方での使用量を確かめるのが確実です。"
      />

      <H2 id={S.check.id}>{S.check.label}</H2>
      <P>Windows では、いつもの遊び方をしている最中に、次の方法でメモリの使用量を見られます。</P>
      <UL>
        <li>タスクマネージャー（Ctrl＋Shift＋Esc）を開き、「パフォーマンス」タブの「メモリ」を選ぶ</li>
        <li>ゲームと、いつも一緒に使うソフト（配信・ブラウザなど）を動かした状態で、使用量が容量に近づいていないかを見る</li>
      </UL>
      <P>
        使用量がいつも容量に近いなら、増やすと読み込みの遅れやカクつきが減る可能性があります。逆に十分な余裕があるなら、増やしても体感はあまり変わりません。
      </P>

      <H2 id={S.buy.id}>{S.buy.label}</H2>
      <UL>
        <li>
          <B>2枚組か</B>：同じ容量でも、1枚より2枚組の方が速く動く構成が一般的です。BTO の構成表で枚数を確認してください
        </li>
        <li>
          <B>あとから増やせるか</B>：空きスロットがあれば、あとで増設できます。マザーボードのスロット数と対応する最大容量を確認してください
        </li>
        <li>
          <B>ほかの部品との優先順位</B>：fps を上げたいなら、メモリより GPU にお金をかける方が効きます。必要な GPU の目安は
          <Link href="/blog/fortnite-gaming-pc" className="text-accent underline">
            フォートナイトにおすすめのゲーミングPC
          </Link>
          にまとめています
        </li>
      </UL>

      <ToolCta href="/tools/fps?game=fortnite" title="GPU と CPU で何fps出るかを確かめる" button="fps予想を開く">
        メモリは fps の計算には使っていません。fps を左右する GPU と CPU の組み合わせで、推定fpsを確かめられます。
      </ToolCta>

      <H2 id={S.summary.id}>{S.summary.label}</H2>
      <UL>
        <li>メモリは「同時に動かすものが入りきるか」で決める</li>
        <li>ゲームだけなら公式の推奨を基準に、配信や録画もするなら余裕を持たせる</li>
        <li>迷ったら、タスクマネージャーで実際の使用量を確かめる</li>
      </UL>
    </>
  );
}
