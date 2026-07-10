/**
 * Server 组件导入安全 —— 防止跨 'use client' 边界取常量
 *
 * BreadcrumbSchema 无 'use client' 指令,会在 server 页面
 * (fact-sheet / virtual-factory-tour / blog/[slug])的 RSC 上下文中执行。
 * 若它从 'use client' 模块导入值,拿到的是 client-reference 代理而非
 * 真实对象(FACTORY_INFO.url 求值为 undefined),曾导致线上
 * BreadcrumbList 输出 "item":"undefined/zh",被 GSC 判为
 * 「字段 id 中的网址无效」。
 *
 * 本测试静态检查源码导入关系,锁死该类回归:
 * - FACTORY_INFO 必须住在无指令的纯数据模块 lib/factory-info.ts
 * - BreadcrumbSchema 的一切值导入不得解析到 'use client' 模块
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, resolve } from 'path';

const ROOT = resolve(__dirname, '../..');
const FACTORY_INFO_MODULE = resolve(ROOT, 'lib/factory-info.ts');
const BREADCRUMB_MODULE = resolve(ROOT, 'components/seo/BreadcrumbSchema.tsx');

/**
 * 判断模块源码是否以 'use client' 指令开头
 */
function hasUseClientDirective(filePath: string): boolean {
  const source = readFileSync(filePath, 'utf8');
  return /^\s*['"]use client['"]/.test(source);
}

/**
 * 将 import 说明符解析为项目内源文件绝对路径
 * (npm 包等项目外模块返回 null,不参与检查)
 */
function resolveImportPath(
  specifier: string,
  importerPath: string
): string | null {
  let base: string;
  if (specifier.startsWith('@/')) {
    base = resolve(ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    base = resolve(dirname(importerPath), specifier);
  } else {
    return null;
  }

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

/**
 * 提取源码中的运行时 import 说明符(忽略纯类型导入 import type)
 */
function extractValueImportSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const importRegex =
    /import\s+(type\s+)?(?:[\w*{}\s,]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(source)) !== null) {
    const isTypeOnly = Boolean(match[1]);
    if (!isTypeOnly) {
      specifiers.push(match[2]);
    }
  }
  return specifiers;
}

describe('Server 组件导入安全(FACTORY_INFO 跨边界回归)', () => {
  it('lib/factory-info.ts 应存在且为无 use client 指令的纯数据模块', () => {
    expect(
      existsSync(FACTORY_INFO_MODULE),
      'lib/factory-info.ts 不存在:FACTORY_INFO 应抽取到纯数据模块'
    ).toBe(true);
    expect(
      hasUseClientDirective(FACTORY_INFO_MODULE),
      'lib/factory-info.ts 不得含 use client 指令,否则 server 组件取值仍会拿到代理'
    ).toBe(false);
  });

  it('BreadcrumbSchema(server 组件)的值导入不得指向 use client 模块', () => {
    const source = readFileSync(BREADCRUMB_MODULE, 'utf8');
    expect(
      hasUseClientDirective(BREADCRUMB_MODULE),
      '前提校验:BreadcrumbSchema 应保持 server 组件(无 use client)'
    ).toBe(false);

    const specifiers = extractValueImportSpecifiers(source);
    expect(specifiers.length).toBeGreaterThan(0);

    for (const specifier of specifiers) {
      const target = resolveImportPath(specifier, BREADCRUMB_MODULE);
      if (!target) continue;
      expect(
        hasUseClientDirective(target),
        `BreadcrumbSchema 导入了 use client 模块 ${specifier}:` +
          'server 渲染时该模块导出的值是 client-reference 代理,' +
          '会重现 "undefined/zh" 无效网址问题'
      ).toBe(false);
    }
  });
});
