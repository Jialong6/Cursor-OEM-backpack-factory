/**
 * 回译自检脚本:目标语 → 英文回译 → 与英文基准语义比对,标记漂移
 *
 * 用法:
 *   node scripts/translate/backtranslate.mjs --locale my                    # 全量
 *   node scripts/translate/backtranslate.mjs --locale de --namespaces banner,faq
 *
 * 输出:docs/i18n/reports/backtranslation-{locale}.md
 * (漂移条目排前,含 严重度/原文/回译/说明,供人工复核修正)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { callGeminiJson, ROOT, GEMINI_MODEL } from './lib/gemini.mjs';
import { flatten } from './lib/json-utils.mjs';

// 分块不宜过大:大输出更易触发模型提前收笔/截断
// (含多段长文时 25 仍会截断,降到 12)
const CHUNK_SIZE = 12;

function parseArgs(argv) {
  const args = { namespaces: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--namespaces') args.namespaces = argv[++i].split(',');
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.locale) throw new Error('--locale required');
  return args;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const BACKTRANSLATE_SYSTEM = [
  'You are a professional translator. You receive a JSON object mapping keys to strings in a non-English language.',
  'Back-translate each string into plain English as literally as possible while staying grammatical.',
  'Do NOT embellish or fix the content. The goal is to reveal what the text actually says.',
  'Keep placeholders like {count} and tags like <span> as-is.',
  'Return a JSON object with the SAME keys, values = English back-translations. Return ONLY JSON.',
].join('\n');

const JUDGE_SYSTEM = [
  'You are a localization QA reviewer. You receive a JSON array of items: { key, source, backTranslation }.',
  '"source" is the original English copy; "backTranslation" is an English back-translation of the localized text.',
  'Flag items where the back-translation reveals a MEANING problem: factual drift (numbers, years, claims changed),',
  'omitted or invented information, reversed meaning, or wrong terminology.',
  'Do NOT flag mere stylistic rephrasing, register changes, or naturalization: marketing copy is intentionally adapted.',
  'Return ONLY JSON: an array of { key, severity: "high"|"medium"|"low", note } for flagged items. Empty array if none.',
].join('\n');

async function main() {
  const args = parseArgs(process.argv);
  const base = JSON.parse(readFileSync(resolve(ROOT, 'locales/en.json'), 'utf8'));
  const target = JSON.parse(readFileSync(resolve(ROOT, `locales/${args.locale}.json`), 'utf8'));

  const namespaces = args.namespaces ?? Object.keys(target);
  const baseFlat = flatten(base);

  // 收集待回译的 (key, 译文) 对:仅字符串且长度 > 2(跳过 "OEM" 类短标识)
  const pairs = [];
  for (const ns of namespaces) {
    const flat = flatten(target[ns], ns);
    for (const [key, value] of flat) {
      if (typeof value === 'string' && value.trim().length > 2) {
        pairs.push([key, value]);
      }
    }
  }
  console.log(`backtranslate ${args.locale} | model=${GEMINI_MODEL} | ${pairs.length} strings, ${Math.ceil(pairs.length / CHUNK_SIZE)} chunks`);

  // 第一遍:回译(失败块对半重试,仍失败则跳过并记录,不让单块拖垮全量)
  const backMap = new Map();
  const skipped = [];

  async function backtranslateGroup(group) {
    const payload = Object.fromEntries(group);
    const result = await callGeminiJson({ system: BACKTRANSLATE_SYSTEM, user: JSON.stringify(payload, null, 2), temperature: 0.1 });
    for (const [key, value] of Object.entries(result)) backMap.set(key, String(value));
  }

  for (const [i, group] of chunk(pairs, CHUNK_SIZE).entries()) {
    process.stdout.write(`  chunk ${i + 1}: back-translating ${group.length} strings... `);
    try {
      await backtranslateGroup(group);
      console.log('ok');
    } catch {
      process.stdout.write('failed, splitting... ');
      const half = Math.ceil(group.length / 2);
      for (const sub of [group.slice(0, half), group.slice(half)]) {
        if (sub.length === 0) continue;
        try {
          await backtranslateGroup(sub);
        } catch {
          skipped.push(...sub.map(([key]) => key));
        }
      }
      console.log(`done (skipped so far: ${skipped.length})`);
    }
  }
  if (skipped.length) {
    console.log(`  WARNING: ${skipped.length} strings unchecked after retries: ${skipped.slice(0, 10).join(', ')}${skipped.length > 10 ? ' ...' : ''}`);
  }

  // 第二遍:语义漂移评审(同样容错)
  const judgeItems = pairs
    .filter(([key]) => backMap.has(key) && baseFlat.has(key))
    .map(([key]) => ({ key, source: String(baseFlat.get(key)), backTranslation: backMap.get(key) }));

  const flagged = [];
  for (const [i, group] of chunk(judgeItems, CHUNK_SIZE).entries()) {
    process.stdout.write(`  chunk ${i + 1}: judging ${group.length} pairs... `);
    try {
      const result = await callGeminiJson({ system: JUDGE_SYSTEM, user: JSON.stringify(group, null, 2), temperature: 0.1 });
      if (Array.isArray(result)) flagged.push(...result);
      console.log(`${Array.isArray(result) ? result.length : 0} flagged`);
    } catch {
      skipped.push(...group.map((item) => item.key));
      console.log('judge failed, skipped');
    }
  }

  // 报告
  const reportDir = resolve(ROOT, 'docs/i18n/reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = resolve(reportDir, `backtranslation-${args.locale}.md`);

  const order = { high: 0, medium: 1, low: 2 };
  flagged.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  const lines = [
    `# Back-translation report: ${args.locale}`,
    '',
    `- Strings checked: ${pairs.length - skipped.length} / ${pairs.length}`,
    `- Flagged: ${flagged.length} (high: ${flagged.filter((f) => f.severity === 'high').length}, medium: ${flagged.filter((f) => f.severity === 'medium').length}, low: ${flagged.filter((f) => f.severity === 'low').length})`,
    `- Model: ${GEMINI_MODEL}`,
    ...(skipped.length
      ? ['', `## Unchecked (Gemini truncation, retries exhausted)`, '', ...skipped.map((k) => `- ${k}`)]
      : []),
    '',
    '## Flagged items',
    '',
  ];
  for (const f of flagged) {
    lines.push(
      `### [${f.severity}] ${f.key}`,
      '',
      `- source: ${baseFlat.get(f.key) ?? ''}`,
      `- target: ${new Map(pairs).get(f.key) ?? ''}`,
      `- back: ${backMap.get(f.key) ?? ''}`,
      `- note: ${f.note ?? ''}`,
      ''
    );
  }
  if (flagged.length === 0) lines.push('None.', '');

  writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`report: docs/i18n/reports/backtranslation-${args.locale}.md (${flagged.length} flagged)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
