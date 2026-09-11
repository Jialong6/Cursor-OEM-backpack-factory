/**
 * 在 locales/*.json 中做「最小 diff」的键插入
 *
 * 直接 JSON.parse + stringify 会把文件里原有的紧凑单行对象重排成多行,
 * 在 12 个语言文件上制造上千行无意义的格式变更。本脚本改为文本插入,
 * 只动被插入的那几行,插入后再解析一次做校验。
 *
 * 用法:node scripts/i18n-insert.mjs <locale.json> <payload.json>
 * payload 形如 { "topLevel": {...}, "into": { "metadata": {...} } }
 */
import { readFileSync, writeFileSync } from 'node:fs';

const INDENT = '  ';

/** 把值序列化成指定缩进层级的 JSON 片段 */
function render(value, depth) {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : INDENT.repeat(depth) + line))
    .join('\n');
}

/** 在顶层对象末尾追加若干命名空间 */
function appendTopLevel(text, entries) {
  const closing = text.lastIndexOf('}');

  if (closing === -1) {
    throw new Error('not a JSON object');
  }

  const head = text.slice(0, closing).replace(/\s*$/, '');
  const tail = text.slice(closing);
  const rendered = Object.entries(entries)
    .map(([key, value]) => `${INDENT}${JSON.stringify(key)}: ${render(value, 1)}`)
    .join(',\n');

  return `${head},\n${rendered}\n${tail}`;
}

/**
 * 在某个顶层命名空间开头插入若干键
 *
 * 锚点必须带上换行:否则 `  "privacy": {` 会当成 `    "privacy": {`
 * 的子串命中,把键插进同名的嵌套对象里(metadata.privacy 就踩过这个坑)。
 */
function insertInto(text, namespace, entries) {
  const anchor = `\n${INDENT}${JSON.stringify(namespace)}: {`;
  const at = text.indexOf(anchor);

  if (at === -1) {
    throw new Error(`top-level namespace not found: ${namespace}`);
  }

  if (text.indexOf(anchor, at + 1) !== -1) {
    throw new Error(`ambiguous namespace anchor: ${namespace}`);
  }

  const insertAt = at + anchor.length;
  const rendered = Object.entries(entries)
    .map(([key, value]) => `${INDENT.repeat(2)}${JSON.stringify(key)}: ${render(value, 2)}`)
    .join(',\n');

  return `${text.slice(0, insertAt)}\n${rendered},${text.slice(insertAt)}`;
}

function countKeys(value) {
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countKeys(item), 0);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce(
      (sum, key) => sum + 1 + countKeys(value[key]),
      0
    );
  }

  return 0;
}

const [, , localePath, payloadPath] = process.argv;

if (!localePath || !payloadPath) {
  console.error('usage: node scripts/i18n-insert.mjs <locale.json> <payload.json>');
  process.exit(1);
}

const original = readFileSync(localePath, 'utf8');
const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
const before = JSON.parse(original);

let text = original;

for (const [namespace, entries] of Object.entries(payload.into ?? {})) {
  text = insertInto(text, namespace, entries);
}

if (payload.topLevel) {
  text = appendTopLevel(text, payload.topLevel);
}

// 校验:必须仍是合法 JSON,且原有键一个都没丢
const after = JSON.parse(text);

for (const key of Object.keys(before)) {
  if (!(key in after)) {
    throw new Error(`lost namespace during insert: ${key}`);
  }
}

if (countKeys(after) <= countKeys(before)) {
  throw new Error('insert did not add any keys');
}

writeFileSync(localePath, text);
console.log(
  `${localePath}: ${countKeys(before)} -> ${countKeys(after)} keys`
);
