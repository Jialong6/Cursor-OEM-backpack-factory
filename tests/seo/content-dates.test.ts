/**
 * lib/content-dates —— 静态页面内容日期常量验证
 *
 * 验证:
 * - 四个日期常量均为 YYYY-MM-DD 格式、可解析、不在未来
 * - components/seo 的 FACT_SHEET_DATE_MODIFIED re-export 与纯模块同值
 *   (常量本体必须住在 lib/ 纯模块,server 侧 sitemap 才能安全导入;
 *   跨 'use client' 边界取值是 server-safe-imports.test.ts 记载的事故模式)
 */

import { describe, it, expect } from 'vitest';
import {
  HOME_DATE_MODIFIED,
  GLOSSARY_DATE_MODIFIED,
  FACT_SHEET_DATE_MODIFIED,
  VIRTUAL_TOUR_DATE_MODIFIED,
} from '@/lib/content-dates';
import { FACT_SHEET_DATE_MODIFIED as REEXPORTED_FACT_SHEET_DATE } from '@/components/seo';

const ALL_DATE_CONSTANTS: Record<string, string> = {
  HOME_DATE_MODIFIED,
  GLOSSARY_DATE_MODIFIED,
  FACT_SHEET_DATE_MODIFIED,
  VIRTUAL_TOUR_DATE_MODIFIED,
};

describe('lib/content-dates 日期常量', () => {
  it('每个常量均为 YYYY-MM-DD 格式', () => {
    for (const [name, value] of Object.entries(ALL_DATE_CONSTANTS)) {
      expect(value, `${name} 格式错误`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('每个常量均可解析为合法日期且不在未来', () => {
    for (const [name, value] of Object.entries(ALL_DATE_CONSTANTS)) {
      const parsed = new Date(value);
      expect(Number.isNaN(parsed.getTime()), `${name} 不可解析`).toBe(false);
      expect(parsed.getTime(), `${name} 是未来日期`).toBeLessThanOrEqual(Date.now());
    }
  });

  it('components/seo re-export 的 FACT_SHEET_DATE_MODIFIED 与纯模块同值', () => {
    expect(REEXPORTED_FACT_SHEET_DATE).toBe(FACT_SHEET_DATE_MODIFIED);
  });

  it('FACT_SHEET_DATE_MODIFIED 保持既有值 2026-07-01(公司事实最后核实日)', () => {
    expect(FACT_SHEET_DATE_MODIFIED).toBe('2026-07-01');
  });
});
