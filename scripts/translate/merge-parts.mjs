/**
 * 合并分片翻译结果:locales/.tmp-{locale}/{namespace}.json -> locales/{locale}.json
 *
 * 用法:
 *   node scripts/translate/merge-parts.mjs --locale ko
 *   node scripts/translate/merge-parts.mjs --locale ko --keep-tmp   # 保留分片目录
 *
 * 每个分片文件的内容为 {"<namespace>": <子树>}(由翻译代理产出)。
 * 合并时按 en.json 的顶层键顺序组装;缺失的 namespace 保留目标文件现值
 * (再缺才回退英文基准),合并后做结构校验,失败则不写盘。
 */

import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/gemini.mjs';
import { compareStructure } from './lib/json-utils.mjs';

function parseArgs(argv) {
  const args = { keepTmp: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--keep-tmp') args.keepTmp = true;
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.locale) throw new Error('--locale required');
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const tmpDir = resolve(ROOT, `locales/.tmp-${args.locale}`);
  const targetPath = resolve(ROOT, `locales/${args.locale}.json`);
  const base = JSON.parse(readFileSync(resolve(ROOT, 'locales/en.json'), 'utf8'));
  const existing = existsSync(targetPath) ? JSON.parse(readFileSync(targetPath, 'utf8')) : {};

  if (!existsSync(tmpDir)) throw new Error(`parts dir not found: ${tmpDir}`);

  const parts = {};
  for (const file of readdirSync(tmpDir).filter((f) => f.endsWith('.json'))) {
    const ns = file.replace(/\.json$/, '');
    const parsed = JSON.parse(readFileSync(resolve(tmpDir, file), 'utf8'));
    // 分片既可能是 {ns: subtree} 包裹形式,也可能直接是子树
    parts[ns] = parsed[ns] !== undefined ? parsed[ns] : parsed;
  }

  const merged = {};
  const missing = [];
  for (const ns of Object.keys(base)) {
    if (parts[ns] !== undefined) {
      merged[ns] = parts[ns];
    } else if (existing[ns] !== undefined) {
      merged[ns] = existing[ns];
      missing.push(ns);
    } else {
      merged[ns] = base[ns];
      missing.push(ns);
    }
  }

  const diff = compareStructure(base, merged);
  const problems = [
    ...diff.missingKeys.map((k) => `missing: ${k}`),
    ...diff.extraKeys.map((k) => `extra: ${k}`),
    ...diff.typeMismatches.map((k) => `type: ${k}`),
    ...diff.emptyValues.map((k) => `empty: ${k}`),
    ...diff.placeholderMismatches.map((p) => `placeholder at ${p.key}: expected [${p.expected}] got [${p.actual}]`),
  ];
  if (problems.length > 0) {
    console.error(`merge ABORTED, ${problems.length} structural problems:`);
    for (const p of problems.slice(0, 40)) console.error(`  ${p}`);
    process.exit(1);
  }

  writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`merged ${Object.keys(parts).length} parts into locales/${args.locale}.json`);
  if (missing.length) console.log(`  namespaces without new parts (kept existing/en): ${missing.join(', ')}`);

  if (!args.keepTmp) {
    rmSync(tmpDir, { recursive: true, force: true });
    console.log(`removed ${tmpDir}`);
  }
}

main();
