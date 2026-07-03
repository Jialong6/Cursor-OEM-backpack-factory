/**
 * Gemini 交叉审校脚本:以母语审校者视角评估译文的地道度/术语/语域
 * (用于 Claude 主译的语言;缅文主译本身就是 Gemini,则用 backtranslate 自检)
 *
 * 用法:
 *   node scripts/translate/review.mjs --locale de
 *   node scripts/translate/review.mjs --locale fr --namespaces banner,about,faq
 *
 * 输出:docs/i18n/reports/review-{locale}.md(问题条目含建议改法)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { callGeminiJson, ROOT, GEMINI_MODEL } from './lib/gemini.mjs';
import { flatten } from './lib/json-utils.mjs';

const CHUNK_SIZE = 30;

const LANGUAGE_NAMES = {
  zh: 'Simplified Chinese', ja: 'Japanese', de: 'German', nl: 'Dutch', fr: 'French',
  pt: 'Portuguese', es: 'Spanish', 'zh-tw': 'Traditional Chinese (Taiwan)', ru: 'Russian',
  my: 'Burmese', ko: 'Korean',
};

function parseArgs(argv) {
  const args = { namespaces: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--namespaces') args.namespaces = argv[++i].split(',');
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.locale || !LANGUAGE_NAMES[args.locale]) {
    throw new Error(`--locale required, one of: ${Object.keys(LANGUAGE_NAMES).join(', ')}`);
  }
  return args;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildSystem(locale, terminology) {
  const language = LANGUAGE_NAMES[locale];
  return [
    `You are a native ${language} copywriter and localization QA reviewer for B2B manufacturing websites.`,
    'You receive a JSON array of items: { key, source, translation }. "source" is English, "translation" is the localized text.',
    `Review each translation as a native ${language} industry professional would:`,
    '- unnatural or stilted phrasing (reads like machine translation)',
    '- wrong register (should be formal B2B business writing)',
    '- industry terminology errors (bags/backpack manufacturing, OEM/ODM sourcing)',
    '- grammar, spelling, diacritics, punctuation conventions for the target language',
    '- factual drift from the source (numbers, years, claims)',
    'Intentional adaptation of marketing tone is FINE; only flag real quality problems.',
    'Return ONLY JSON: array of { key, severity: "high"|"medium"|"low", issue, suggestion } for problems. Empty array if none.',
    terminology ? `\nTERMINOLOGY SHEET (authoritative):\n${terminology}` : '',
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const base = JSON.parse(readFileSync(resolve(ROOT, 'locales/en.json'), 'utf8'));
  const target = JSON.parse(readFileSync(resolve(ROOT, `locales/${args.locale}.json`), 'utf8'));
  const termPath = resolve(ROOT, 'docs/i18n/terminology.md');
  const terminology = existsSync(termPath) ? readFileSync(termPath, 'utf8') : '';

  const namespaces = args.namespaces ?? Object.keys(target);
  const baseFlat = flatten(base);

  const items = [];
  for (const ns of namespaces) {
    const flat = flatten(target[ns], ns);
    for (const [key, value] of flat) {
      const source = baseFlat.get(key);
      if (typeof value === 'string' && typeof source === 'string' && value.trim().length > 2) {
        items.push({ key, source, translation: value });
      }
    }
  }

  console.log(`review ${args.locale} | model=${GEMINI_MODEL} | ${items.length} strings, ${Math.ceil(items.length / CHUNK_SIZE)} chunks`);
  const system = buildSystem(args.locale, terminology);

  const flagged = [];
  for (const [i, group] of chunk(items, CHUNK_SIZE).entries()) {
    process.stdout.write(`  chunk ${i + 1}: reviewing ${group.length} strings... `);
    const result = await callGeminiJson({ system, user: JSON.stringify(group, null, 2), temperature: 0.1 });
    if (Array.isArray(result)) flagged.push(...result);
    console.log(`${Array.isArray(result) ? result.length : 0} flagged`);
  }

  const reportDir = resolve(ROOT, 'docs/i18n/reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = resolve(reportDir, `review-${args.locale}.md`);

  const order = { high: 0, medium: 1, low: 2 };
  flagged.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  const targetFlatAll = flatten(target);
  const lines = [
    `# Cross-review report: ${args.locale}`,
    '',
    `- Strings reviewed: ${items.length}`,
    `- Flagged: ${flagged.length} (high: ${flagged.filter((f) => f.severity === 'high').length}, medium: ${flagged.filter((f) => f.severity === 'medium').length}, low: ${flagged.filter((f) => f.severity === 'low').length})`,
    `- Model: ${GEMINI_MODEL}`,
    '',
    '## Flagged items',
    '',
  ];
  for (const f of flagged) {
    lines.push(
      `### [${f.severity}] ${f.key}`,
      '',
      `- source: ${baseFlat.get(f.key) ?? ''}`,
      `- translation: ${targetFlatAll.get(f.key) ?? ''}`,
      `- issue: ${f.issue ?? ''}`,
      `- suggestion: ${f.suggestion ?? ''}`,
      ''
    );
  }
  if (flagged.length === 0) lines.push('None.', '');

  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`report: docs/i18n/reports/review-${args.locale}.md (${flagged.length} flagged)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
