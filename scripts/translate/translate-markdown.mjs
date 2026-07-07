/**
 * Gemini Markdown 翻译脚本(博客正文用,缅文主译走这里)
 *
 * 用法:
 *   node scripts/translate/translate-markdown.mjs --in <src.md路径或content.ts> --locale my --out <目标路径>
 *   node scripts/translate/translate-markdown.mjs --meta '<JSON>' --locale my   # 翻译元数据 JSON,输出到 stdout
 *
 * - 输入若为 content.{lang}.ts,自动剥离 export default 模板字面量包装;
 *   输出为纯 markdown 文本文件(由调用方再包装成 .ts)
 * - 按 "## " 标题分块逐段翻译(防长输出截断),段间携带术语上下文
 * - 保留 markdown 结构、链接 URL、图片路径、HTML 标签、数字与品牌名
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { callGemini, callGeminiJson, ROOT, GEMINI_MODEL } from './lib/gemini.mjs';

const LANGUAGE_NAMES = {
  de: 'German', nl: 'Dutch', fr: 'French', pt: 'Portuguese', es: 'Spanish',
  'zh-tw': 'Traditional Chinese (Taiwan)', ru: 'Russian',
  my: 'Burmese (Myanmar language, Unicode)', ko: 'Korean',
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--in') args.in = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--meta') args.meta = argv[++i];
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.locale || !LANGUAGE_NAMES[args.locale]) {
    throw new Error(`--locale required, one of: ${Object.keys(LANGUAGE_NAMES).join(', ')}`);
  }
  if (!args.meta && (!args.in || !args.out)) throw new Error('--in and --out required (or --meta)');
  return args;
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function buildSystem(locale, terminology, brief) {
  const language = LANGUAGE_NAMES[locale];
  return [
    `You are a senior localization specialist translating a B2B blog article for Better Bags Myanmar (an OEM/ODM backpack factory in Yangon) into ${language}.`,
    'The article is factory storytelling for potential manufacturing clients. Translate faithfully and idiomatically:',
    '- Preserve ALL markdown structure exactly: heading levels, lists, tables, blockquotes, horizontal rules, bold/italic markers, links and image syntax.',
    '- NEVER translate or alter: URLs, image paths, link targets (e.g. /blog/...), HTML tags like <sup>, brand names (Better Bags, Anello, I-pack, YKK, Pantone), certifications (ISO 9001, OEKO-TEX, GRS, AQL), numbers, dates, times.',
    '- Translate link TEXT and image alt text, keep targets unchanged.',
    '- Do NOT use the backtick character (`) or the sequence ${ anywhere in your output; if the source has inline code, render it with quotation marks instead.',
    '- Formal, professional register for B2B readers; write like a native industry professional, not a literal translator.',
    '- Return ONLY the translated markdown, no commentary, no code fences around the whole output.',
    terminology ? `\nTERMINOLOGY SHEET (authoritative):\n${terminology}` : '',
    brief ? `\nMARKET BRIEF for this locale:\n${brief}` : '',
  ].join('\n');
}

/** 按二级标题分块;首块含主标题与引言 */
function chunkByHeadings(markdown) {
  const lines = markdown.split('\n');
  const chunks = [];
  let current = [];
  for (const line of lines) {
    if (/^## /.test(line) && current.length > 0) {
      chunks.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) chunks.push(current.join('\n'));
  return chunks;
}

/** 剥离 content.ts 的 export default 包装(若是) */
function extractMarkdown(text) {
  const m = text.match(/^(?:\/\/[^\n]*\n)*export default `([\s\S]*)`;\s*$/);
  return m ? m[1] : text;
}

async function main() {
  const args = parseArgs(process.argv);
  const terminology = readIfExists(resolve(ROOT, 'docs/i18n/terminology.md'));
  const brief = readIfExists(resolve(ROOT, `docs/i18n/market-briefs/${args.locale}.md`));
  const system = buildSystem(args.locale, terminology, brief);

  if (args.meta) {
    // 元数据模式:翻译 {title, excerpt, category, tags[]} JSON
    const result = await callGeminiJson({
      system: `${system}\n\nYou receive a JSON object with title/excerpt/category/tags. Translate all string values (and each array item). Return JSON with identical structure only.`,
      user: args.meta,
      temperature: 0.2,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  const source = extractMarkdown(readFileSync(args.in, 'utf8'));
  const chunks = chunkByHeadings(source);
  console.error(`translate-markdown -> ${args.locale} | model=${GEMINI_MODEL} | ${chunks.length} chunks, ${source.length} chars`);

  const out = [];
  for (const [i, chunk] of chunks.entries()) {
    process.stderr.write(`  chunk ${i + 1}/${chunks.length} (${chunk.length} chars)... `);
    let translated = await callGemini({ system, user: chunk, temperature: 0.25 });
    // 防御:剥掉模型偶发包裹的整体代码围栏
    translated = translated.replace(/^\s*```(?:markdown)?\s*\n/, '').replace(/\n```\s*$/, '');
    if (translated.includes('`') || translated.includes('${')) {
      // 模板字面量危险字符,直接替换为安全形式
      translated = translated.replaceAll('${', '\\${').replaceAll('`', "'");
    }
    out.push(translated.trimEnd());
    process.stderr.write('ok\n');
  }

  writeFileSync(args.out, `${out.join('\n\n')}\n`, 'utf8');
  console.error(`written: ${args.out}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
