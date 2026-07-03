/**
 * locale JSON 工具函数:扁平化、结构比对、占位符提取
 *
 * 占位符类别(翻译时必须原样保留):
 * - ICU 变量:{count}、{language}、{index}、{name} 等
 * - HTML 标签:<span ...>、<sup> 等
 * - 富文本标签:<highlight1>...</highlight1>(next-intl rich text)
 */

/** 递归扁平化:{ a: { b: ['x'] } } -> Map('a.b.0' -> 'x') */
export function flatten(obj, prefix = '', out = new Map()) {
  if (obj === null || obj === undefined) return out;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    out.set(prefix, obj);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

/** 提取字符串中的占位符集合(ICU 变量 + HTML/富文本标签名) */
export function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const found = [];
  // ICU 变量 {var}(排除转义 '{')
  for (const m of str.matchAll(/\{(\w+)\}/g)) {
    found.push(`{${m[1]}}`);
  }
  // HTML / 富文本标签(只记录标签名,属性可被翻译如 style 不该变但值内文字不做要求)
  for (const m of str.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) {
    found.push(`<${m[1]}>`);
  }
  return found.sort();
}

/**
 * 结构与占位符比对
 * @returns {{ missingKeys: string[], extraKeys: string[], typeMismatches: string[],
 *             emptyValues: string[], placeholderMismatches: Array<{key, expected, actual}>,
 *             untranslated: string[] }}
 */
export function compareStructure(baseObj, targetObj, { checkUntranslated = false } = {}) {
  const base = flatten(baseObj);
  const target = flatten(targetObj);

  const missingKeys = [];
  const extraKeys = [];
  const typeMismatches = [];
  const emptyValues = [];
  const placeholderMismatches = [];
  const untranslated = [];

  for (const [key, baseVal] of base) {
    if (!target.has(key)) {
      missingKeys.push(key);
      continue;
    }
    const targetVal = target.get(key);
    if (typeof baseVal !== typeof targetVal) {
      typeMismatches.push(key);
      continue;
    }
    if (typeof targetVal === 'string') {
      if (targetVal.trim() === '' && String(baseVal).trim() !== '') {
        emptyValues.push(key);
      }
      const expected = extractPlaceholders(String(baseVal)).join(',');
      const actual = extractPlaceholders(targetVal).join(',');
      if (expected !== actual) {
        placeholderMismatches.push({ key, expected, actual });
      }
      // 未翻译检测:与英文基准完全相同的长文本(短标识如 "OEM"、"FAQ" 属正常保留)
      if (checkUntranslated && targetVal === baseVal && String(baseVal).length > 30) {
        untranslated.push(key);
      }
    }
  }
  for (const key of target.keys()) {
    if (!base.has(key)) extraKeys.push(key);
  }

  return { missingKeys, extraKeys, typeMismatches, emptyValues, placeholderMismatches, untranslated };
}

/** 取对象的一个顶层 namespace 子树 */
export function pickNamespace(obj, namespace) {
  return { [namespace]: obj[namespace] };
}

/** 深合并:把 patch 的 namespace 子树写回 target(返回新对象,不可变) */
export function mergeNamespace(target, namespace, subtree) {
  return { ...target, [namespace]: subtree[namespace] ?? subtree };
}
