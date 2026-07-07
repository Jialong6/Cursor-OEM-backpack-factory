/**
 * locale JSON 结构校验(独立于测试套件,可单独快速跑)
 *
 * 用法:
 *   node scripts/translate/validate-structure.mjs                 # 校验全部 locale
 *   node scripts/translate/validate-structure.mjs --locale my     # 只校验一个
 *   node scripts/translate/validate-structure.mjs --locale de --untranslated
 *     (--untranslated: 额外列出与英文基准完全相同的长文本 = 疑似未翻译)
 *
 * 基准:locales/en.json。校验项:键集合一致、类型一致、叶子非空、
 * ICU 占位符与 HTML/富文本标签保留。
 */

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/gemini.mjs';
import { compareStructure } from './lib/json-utils.mjs';

function parseArgs(argv) {
  const args = { locale: null, untranslated: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--untranslated') args.untranslated = true;
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const localesDir = resolve(ROOT, 'locales');
  const base = JSON.parse(readFileSync(resolve(localesDir, 'en.json'), 'utf8'));

  const files = args.locale
    ? [`${args.locale}.json`]
    : readdirSync(localesDir).filter((f) => f.endsWith('.json') && f !== 'en.json');

  let failed = false;
  for (const file of files) {
    const locale = file.replace(/\.json$/, '');
    let target;
    try {
      target = JSON.parse(readFileSync(resolve(localesDir, file), 'utf8'));
    } catch (err) {
      console.log(`[${locale}] INVALID JSON: ${err.message}`);
      failed = true;
      continue;
    }
    const diff = compareStructure(base, target, { checkUntranslated: args.untranslated });
    const problems =
      diff.missingKeys.length + diff.extraKeys.length + diff.typeMismatches.length +
      diff.emptyValues.length + diff.placeholderMismatches.length;

    if (problems === 0) {
      const suffix = args.untranslated && diff.untranslated.length
        ? ` | ${diff.untranslated.length} suspected untranslated`
        : '';
      console.log(`[${locale}] OK${suffix}`);
    } else {
      failed = true;
      console.log(`[${locale}] FAILED (${problems} problems)`);
      for (const k of diff.missingKeys) console.log(`  missing: ${k}`);
      for (const k of diff.extraKeys) console.log(`  extra: ${k}`);
      for (const k of diff.typeMismatches) console.log(`  type mismatch: ${k}`);
      for (const k of diff.emptyValues) console.log(`  empty: ${k}`);
      for (const p of diff.placeholderMismatches) {
        console.log(`  placeholder at ${p.key}: expected [${p.expected}] got [${p.actual}]`);
      }
    }
    if (args.untranslated && diff.untranslated.length) {
      for (const k of diff.untranslated.slice(0, 50)) console.log(`  untranslated? ${k}`);
      if (diff.untranslated.length > 50) console.log(`  ... and ${diff.untranslated.length - 50} more`);
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
