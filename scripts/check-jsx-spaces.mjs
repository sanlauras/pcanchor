/**
 * JSX の日本語の文に、改行由来の空白が入っていないかを調べる。
 *
 *   node scripts/check-jsx-spaces.mjs         調べるだけ（npm run lint から呼ばれる）
 *   node scripts/check-jsx-spaces.mjs --fix   見つけた継ぎ目を詰めて直す
 *
 * なぜ必要か:
 * JSX では、文字の途中で改行すると、その継ぎ目が空白1つとして表示される。
 * 英語なら単語の区切りになって自然だが、日本語では
 * 「同じ振り向き距離で エイムできる」のような不自然な空白になる。
 * 2026-09-22 のデザインの作り直しのときに、サイト全体で132か所見つかった。
 *
 * 直す対象は、継ぎ目の両側が日本語どうし、またはどちらかが全角の記号（、。（）など）の場合だけ。
 * 英数字どうし（"GPU and CPU"）や、英数字と日本語の間（"RX 9070 XT の"）の空白は、
 * 意図して入れていることが多いので残す。
 *
 * 文字列・コメント・コードには触れない。TypeScript の構文解析で、JSX の文字の部分だけを見ている。
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = process.argv.includes('--fix');

/** 日本語の文字（ひらがな・カタカナ・漢字・全角英数と記号） */
const CJK = /[　-ヿ㐀-鿿＀-￯]/;
/** 全角の記号。これが片側にあれば、相手が英数字でも空白は要らない */
const FULLWIDTH_PUNCT = /[　-〿・！-／：-＠［-｀｛-･]/;

/** 前の文字と次の文字の間の空白を消すべきか */
function shouldJoin(before, after) {
  return (CJK.test(before) && CJK.test(after)) || FULLWIDTH_PUNCT.test(before) || FULLWIDTH_PUNCT.test(after);
}

/**
 * 文字の塊の中の「文字・空白と改行・文字」を探す。
 * JSX は改行を含む空白を空白1つにまとめる（改行だけの行は捨てる）ので、これが表示上の空白になる。
 */
const BREAK = /(\S)([ \t]*(?:\r?\n[ \t]*)+)(?=(\S))/g;

function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) listFiles(path, out);
    else if (path.endsWith('.tsx')) out.push(path);
  }
  return out;
}

const problems = [];
let fixed = 0;

for (const file of listFiles(join(ROOT, 'src'))) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** [開始位置, 終了位置] の空白を消す。後ろから当てるので位置がずれない */
  const edits = [];

  (function visit(node) {
    if (node.kind === ts.SyntaxKind.JsxText) {
      const start = node.getStart(sf);
      const text = src.slice(start, node.end);
      for (const m of text.matchAll(BREAK)) {
        const [, before, gap, after] = m;
        if (!shouldJoin(before, after)) continue;
        const from = start + m.index + before.length;
        edits.push([from, from + gap.length]);
        const { line } = sf.getLineAndCharacterOfPosition(from);
        const context = text.slice(Math.max(0, m.index - 10), m.index + 1).trim();
        problems.push(`${relative(ROOT, file)}:${line + 1}  「…${context}｜${after}…」`);
      }
    }
    ts.forEachChild(node, visit);
  })(sf);

  if (FIX && edits.length > 0) {
    let out = src;
    for (const [from, to] of edits.sort((a, b) => b[0] - a[0])) {
      out = out.slice(0, from) + out.slice(to);
    }
    writeFileSync(file, out);
    fixed += edits.length;
  }
}

if (FIX) {
  console.log(`JSX の日本語の継ぎ目を ${fixed} か所詰めました。`);
} else if (problems.length > 0) {
  console.error(
    'JSX の日本語の文の途中で改行しているため、表示に不要な空白が入ります。\n' +
      '改行をやめて1行にするか、node scripts/check-jsx-spaces.mjs --fix で直してください。\n\n' +
      problems.map((p) => `  ${p}`).join('\n'),
  );
  process.exit(1);
}
