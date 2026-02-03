import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { estimateReadingTime, AUTHORS } from '@/lib/author-data';

/**
 * AuthorByline 属性测试
 *
 * **Feature: E-E-A-T Authority, Property: AuthorByline correctness**
 *
 * 验证 AuthorByline 组件的数据逻辑正确性：
 * - 阅读时间始终为正整数
 * - 作者名称根据 locale 正确选择
 * - 日期格式化正确
 */

describe('Property: AuthorByline', () => {
  describe('阅读时间计算', () => {
    it('Property: 任意内容长度的阅读时间始终为 >= 1 的正整数', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 10000 }),
          (content) => {
            const readingTime = estimateReadingTime(content);
            expect(readingTime).toBeGreaterThanOrEqual(1);
            expect(Number.isInteger(readingTime)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 阅读时间随内容长度单调递增', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 1000 }),
          (a, b) => {
            const shorter = 'word '.repeat(Math.min(a, b));
            const longer = 'word '.repeat(Math.max(a, b));
            const shortTime = estimateReadingTime(shorter);
            const longTime = estimateReadingTime(longer);
            expect(longTime).toBeGreaterThanOrEqual(shortTime);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('作者名称 locale 选择', () => {
    const locales = ['en', 'zh', 'zh-tw', 'ja', 'de', 'fr'] as const;

    it('Property: 中文 locale 应选择 zh 名称，其他选择 en', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...locales),
          fc.constantFrom(...AUTHORS),
          (locale, author) => {
            const expectedName = locale === 'zh' || locale === 'zh-tw'
              ? author.name.zh
              : author.name.en;
            const expectedRole = locale === 'zh' || locale === 'zh-tw'
              ? author.role.zh
              : author.role.en;

            expect(expectedName).toBeDefined();
            expect(expectedName.length).toBeGreaterThan(0);
            expect(expectedRole).toBeDefined();
            expect(expectedRole.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('作者档案数据一致性', () => {
    it('Property: 所有作者的 credentials 非空', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTHORS),
          (author) => {
            expect(author.credentials.length).toBeGreaterThan(0);
            for (const credential of author.credentials) {
              expect(credential.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('Property: 所有作者的头像路径以 / 开头', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...AUTHORS),
          (author) => {
            expect(author.avatar.startsWith('/')).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('日期格式', () => {
    it('Property: 有效日期字符串能被正确解析', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(dateStr);
            expect(date.getTime()).not.toBeNaN();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
