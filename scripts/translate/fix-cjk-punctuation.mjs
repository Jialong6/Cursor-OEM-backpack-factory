/**
 * CJK 标点全形化:把 locale JSON 字符串值中与中文相邻的半角标点改为全形
 *
 * 用法:node scripts/translate/fix-cjk-punctuation.mjs --locale zh-tw [--dry-run]
 *
 * 规则(保守,只动确定安全的):
 * - , ; ! ? : 任一侧紧邻 CJK 字符 → ，；！？：
 *   (千分位 1,500 与 "JPG, PNG" 等拉丁上下文两侧均非 CJK,不动)
 * - 成对括号 ( ... ):当括号前字符为 CJK,或括号内内容含 CJK → （...）
 * - ICU 占位符 {xxx} 与 HTML 标签内部不处理
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/gemini.mjs';

const CJK = /[一-鿿㐀-䶿豈-﫿]/;

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--locale') args.locale = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.locale) throw new Error('--locale required');
  return args;
}

/** 找出字符串中不应处理的区间:{占位符} 与 <标签> */
function protectedRanges(str) {
  const ranges = [];
  for (const m of str.matchAll(/\{\w+\}|<[^>]*>/g)) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function inProtected(ranges, i) {
  return ranges.some(([s, e]) => i >= s && i < e);
}

const PUNCT_MAP = { ',': '，', ';': '；', '!': '！', '?': '？', ':': '：' };

function fixString(str) {
  const ranges = protectedRanges(str);
  const chars = [...str];

  // 第一遍:逗号/分号/叹号/问号/冒号
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!(ch in PUNCT_MAP) || inProtected(ranges, i)) continue;
    const prev = chars[i - 1] ?? '';
    const next = chars[i + 1] ?? '';
    if (CJK.test(prev) || CJK.test(next)) {
      chars[i] = PUNCT_MAP[ch];
    }
  }

  // 第二遍:成对括号
  let result = chars.join('');
  result = result.replace(/\(([^()]*)\)/g, (match, inner, offset) => {
    if (inProtected(protectedRanges(result), offset)) return match;
    const prev = result[offset - 1] ?? '';
    if (CJK.test(prev) || CJK.test(inner)) {
      return `（${inner}）`;
    }
    return match;
  });

  return result;
}

function walk(node, apply) {
  if (typeof node === 'string') return apply(node);
  if (Array.isArray(node)) return node.map((n) => walk(n, apply));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, apply);
    return out;
  }
  return node;
}

function main() {
  const args = parseArgs(process.argv);
  const path = resolve(ROOT, `locales/${args.locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));

  let changed = 0;
  const fixed = walk(data, (s) => {
    const out = fixString(s);
    if (out !== s) changed++;
    return out;
  });

  console.log(`${args.locale}: ${changed} strings changed`);
  if (!args.dryRun) {
    writeFileSync(path, `${JSON.stringify(fixed, null, 2)}\n`, 'utf8');
    console.log(`written to locales/${args.locale}.json`);
  }
}

main();
