/**
 * Gemini 批量翻译脚本(按 namespace 分块,结构化 JSON 输出)
 *
 * 用法:
 *   node scripts/translate/translate.mjs --locale my                      # 全部 namespace
 *   node scripts/translate/translate.mjs --locale my --namespaces faq,contact
 *   node scripts/translate/translate.mjs --locale my --source en --force  # 覆盖已有译文
 *
 * 流程:读 locales/{source}.json → 逐 namespace 调 Gemini(注入术语表 +
 * 市场简报)→ 结构/占位符校验(失败自动带错误反馈重试一次)→ 增量合并写回
 * locales/{locale}.json。默认跳过已存在且非英文骨架的 namespace(--force 覆盖)。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { callGeminiJson, ROOT, GEMINI_MODEL } from './lib/gemini.mjs';
import { compareStructure, pickNamespace } from './lib/json-utils.mjs';

const LANGUAGE_NAMES = {
  en: 'English',
  zh: 'Simplified Chinese',
  ja: 'Japanese',
  de: 'German',
  nl: 'Dutch',
  fr: 'French',
  pt: 'Portuguese',
  es: 'Spanish',
  'zh-tw': 'Traditional Chinese (Taiwan)',
  ru: 'Russian',
  my: 'Burmese (Myanmar language, Unicode)',
  ko: 'Korean',
};

function parseArgs(argv) {
  const args = { source: 'en', namespaces: null, force: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--locale') args.locale = argv[++i];
    else if (a === '--source') args.source = argv[++i];
    else if (a === '--namespaces') args.namespaces = argv[++i].split(',');
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  if (!args.locale || !LANGUAGE_NAMES[args.locale]) {
    throw new Error(`--locale required, one of: ${Object.keys(LANGUAGE_NAMES).join(', ')}`);
  }
  return args;
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function buildSystemPrompt(locale, terminology, brief) {
  const language = LANGUAGE_NAMES[locale];
  return [
    `You are a senior localization specialist translating the website of Better Bags Myanmar, an OEM/ODM backpack factory in Yangon, into ${language}.`,
    `The audience is B2B buyers (brand owners, sourcing managers) evaluating a manufacturing partner. This is marketing and product copy, NOT literal translation work:`,
    `- Rewrite naturally in ${language} the way a native industry professional would phrase it. Avoid stiff, word-for-word translation.`,
    `- Adapt marketing copy to what buyers in this market care about, while preserving all factual claims (numbers, years, certifications, capacities) EXACTLY.`,
    `- Keep established B2B industry terms in English where that is the local convention (e.g. OEM, ODM, MOQ, QC) unless the terminology sheet says otherwise.`,
    `- Formal, professional register appropriate for ${language} business writing.`,
    '',
    'STRICT OUTPUT RULES:',
    '1. You receive a JSON object. Return a JSON object with EXACTLY the same structure: same keys, same nesting, same array lengths, same order.',
    '2. Translate ONLY string values. Never translate keys.',
    '3. Preserve ICU placeholders like {count}, {language}, {index}, {name} EXACTLY as-is.',
    '4. Preserve HTML/rich-text tags like <span style="...">, <sup>, <highlight1></highlight1> EXACTLY, translating only the human-readable text between them.',
    '5. Brand names, proper nouns, emails, phone numbers, URLs stay unchanged: Better Bags, Anello, I-pack, Resend, Yangon addresses, etc.',
    '6. Return ONLY the JSON object, no commentary.',
    terminology ? `\nTERMINOLOGY SHEET (authoritative):\n${terminology}` : '',
    brief ? `\nMARKET BRIEF for this locale (write for this buyer mindset):\n${brief}` : '',
  ].join('\n');
}

/** 判断 target 里该 namespace 是否仍是英文骨架(与 source 完全相同) */
function isSkeleton(sourceNs, targetNs) {
  return JSON.stringify(sourceNs) === JSON.stringify(targetNs);
}

async function translateNamespace({ namespace, sourceTree, locale, system }) {
  const payload = JSON.stringify(sourceTree, null, 2);
  let feedback = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const user = feedback
      ? `${payload}\n\nYour previous attempt had these structural problems, fix them and output the full corrected JSON:\n${feedback}`
      : payload;
    const result = await callGeminiJson({ system, user, temperature: attempt === 0 ? 0.3 : 0.1 });
    // 模型可能直接返回子树(无 namespace 包裹),统一包裹后再比
    const wrapped = result[namespace] !== undefined ? result : { [namespace]: result };
    const diff = compareStructure(sourceTree, wrapped);
    const problems = [
      ...diff.missingKeys.map((k) => `missing key: ${k}`),
      ...diff.extraKeys.map((k) => `extra key: ${k}`),
      ...diff.typeMismatches.map((k) => `type mismatch: ${k}`),
      ...diff.emptyValues.map((k) => `empty value: ${k}`),
      ...diff.placeholderMismatches.map((p) => `placeholder mismatch at ${p.key}: expected [${p.expected}] got [${p.actual}]`),
    ];
    if (problems.length === 0) return wrapped[namespace];
    feedback = problems.slice(0, 30).join('\n');
    process.stderr.write(`  [${namespace}] structure check failed (${problems.length} problems), retrying\n`);
  }
  throw new Error(`namespace "${namespace}" failed structure check after 3 attempts:\n${feedback}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const sourcePath = resolve(ROOT, `locales/${args.source}.json`);
  const targetPath = resolve(ROOT, `locales/${args.locale}.json`);

  const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const target = existsSync(targetPath) ? JSON.parse(readFileSync(targetPath, 'utf8')) : {};

  const terminology = readIfExists(resolve(ROOT, 'docs/i18n/terminology.md'));
  const brief = readIfExists(resolve(ROOT, `docs/i18n/market-briefs/${args.locale}.md`));
  const system = buildSystemPrompt(args.locale, terminology, brief);

  const namespaces = args.namespaces ?? Object.keys(source);
  const unknown = namespaces.filter((ns) => !(ns in source));
  if (unknown.length) throw new Error(`unknown namespaces: ${unknown.join(', ')}`);

  console.log(`translate ${args.source} -> ${args.locale} | model=${GEMINI_MODEL} | ${namespaces.length} namespaces`);

  let done = 0;
  for (const ns of namespaces) {
    const sourceTree = pickNamespace(source, ns);
    if (!args.force && target[ns] !== undefined && !isSkeleton(sourceTree[ns], target[ns])) {
      console.log(`  [${ns}] already translated, skip (--force to overwrite)`);
      continue;
    }
    if (args.dryRun) {
      console.log(`  [${ns}] would translate (${JSON.stringify(sourceTree).length} chars)`);
      continue;
    }
    process.stdout.write(`  [${ns}] translating... `);
    const translated = await translateNamespace({ namespace: ns, sourceTree, locale: args.locale, system });
    target[ns] = translated;
    // 每个 namespace 完成即写盘,中断可续跑
    const ordered = {};
    for (const key of Object.keys(source)) {
      if (target[key] !== undefined) ordered[key] = target[key];
    }
    writeFileSync(targetPath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
    done++;
    console.log('ok');
  }
  console.log(`done: ${done} namespaces written to locales/${args.locale}.json`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
