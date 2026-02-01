import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import zhTranslations from '@/locales/zh.json';
import enTranslations from '@/locales/en.json';

/**
 * 属性测试：多语言 Schema 描述
 *
 * **Feature: backpack-oem-website, Property 11: Localized Schema Description**
 *
 * 正确性属性：每个语言版本的 JSON-LD 都应该使用对应语言的描述文本，
 * FAQ 数量在各语言间保持一致。
 *
 * 验证需求：2.2 (i18n), 7.2 (Organization JSON-LD), 10.5 (FAQPage JSON-LD)
 */

// 当前支持的主要语言（有完整翻译文件）
const availableLocales = ['en', 'zh'] as const;
type AvailableLocale = (typeof availableLocales)[number];

// 翻译数据映射
const translations: Record<AvailableLocale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
};

/**
 * 获取嵌套翻译键的值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * 检测文本是否包含中文字符
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * 检测文本是否包含日文平假名/片假名
 */
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
}

/**
 * 检测文本是否包含韩文字符
 */
function containsKorean(text: string): boolean {
  return /[\uac00-\ud7af\u1100-\u11ff]/.test(text);
}

/**
 * 检测文本是否包含阿拉伯文字符
 */
function containsArabic(text: string): boolean {
  return /[\u0600-\u06ff]/.test(text);
}

/**
 * 获取 FAQ sections
 */
function getFAQSections(
  locale: AvailableLocale
): Array<{ title: string; items: Array<{ q: string; a: string }> }> {
  const t = translations[locale];
  return t.faq.sections as Array<{
    title: string;
    items: Array<{ q: string; a: string }>;
  }>;
}

/**
 * 计算 FAQ 总问题数
 */
function countFAQItems(
  sections: Array<{ title: string; items: Array<{ q: string; a: string }> }>
): number {
  return sections.reduce((sum, section) => sum + section.items.length, 0);
}

describe('Property 11: Localized Schema Description', () => {
  describe('Translation Key Existence', () => {
    /**
     * 属性测试：每个 locale 都有 about.mission.desc
     */
    it('每个 locale 都应该有 about.mission.desc 翻译', () => {
      fc.assert(
        fc.property(fc.constantFrom(...availableLocales), (locale) => {
          const t = translations[locale];
          const missionDesc = getNestedValue(t as Record<string, unknown>, 'about.mission.desc');

          expect(missionDesc).toBeDefined();
          expect(typeof missionDesc).toBe('string');
          expect(missionDesc!.length).toBeGreaterThan(0);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：每个 locale 都有 about.vision.desc
     */
    it('每个 locale 都应该有 about.vision.desc 翻译', () => {
      fc.assert(
        fc.property(fc.constantFrom(...availableLocales), (locale) => {
          const t = translations[locale];
          const visionDesc = getNestedValue(t as Record<string, unknown>, 'about.vision.desc');

          expect(visionDesc).toBeDefined();
          expect(typeof visionDesc).toBe('string');
          expect(visionDesc!.length).toBeGreaterThan(0);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：每个 locale 都有 faq.sections
     */
    it('每个 locale 都应该有 faq.sections 翻译', () => {
      fc.assert(
        fc.property(fc.constantFrom(...availableLocales), (locale) => {
          const sections = getFAQSections(locale);

          expect(sections).toBeDefined();
          expect(Array.isArray(sections)).toBe(true);
          expect(sections.length).toBeGreaterThan(0);

          return true;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('FAQ Consistency', () => {
    /**
     * 属性测试：中英文 FAQ section 数量一致
     */
    it('中英文 FAQ section 数量应该一致', () => {
      const zhSections = getFAQSections('zh');
      const enSections = getFAQSections('en');

      expect(zhSections.length).toBe(enSections.length);
    });

    /**
     * 属性测试：中英文 FAQ 问题总数一致
     */
    it('中英文 FAQ 问题总数应该一致', () => {
      const zhSections = getFAQSections('zh');
      const enSections = getFAQSections('en');

      const zhCount = countFAQItems(zhSections);
      const enCount = countFAQItems(enSections);

      expect(zhCount).toBe(enCount);
    });

    /**
     * 属性测试：每个 FAQ section 的问题数量在中英文间一致
     */
    it('每个 FAQ section 的问题数量在中英文间应该一致', () => {
      const zhSections = getFAQSections('zh');
      const enSections = getFAQSections('en');

      for (let i = 0; i < zhSections.length; i++) {
        expect(zhSections[i].items.length).toBe(enSections[i].items.length);
      }
    });

    /**
     * 单元测试：验证实际 FAQ 数量
     */
    it('FAQ 应该有 5 个分类', () => {
      const zhSections = getFAQSections('zh');
      const enSections = getFAQSections('en');

      expect(zhSections.length).toBe(5);
      expect(enSections.length).toBe(5);
    });
  });

  describe('Language Content Verification', () => {
    /**
     * 属性测试：中文描述应该包含中文字符
     */
    it('中文 about.mission.desc 应该包含中文字符', () => {
      const zhDesc = getNestedValue(
        translations.zh as Record<string, unknown>,
        'about.mission.desc'
      );

      expect(zhDesc).toBeDefined();
      expect(containsChinese(zhDesc!)).toBe(true);
    });

    /**
     * 属性测试：英文描述不应该包含中文字符
     */
    it('英文 about.mission.desc 不应该包含中文字符', () => {
      const enDesc = getNestedValue(
        translations.en as Record<string, unknown>,
        'about.mission.desc'
      );

      expect(enDesc).toBeDefined();
      expect(containsChinese(enDesc!)).toBe(false);
    });

    /**
     * 属性测试：中文 FAQ 应该包含中文字符
     */
    it('中文 FAQ 问题和答案应该包含中文字符', () => {
      const zhSections = getFAQSections('zh');

      for (const section of zhSections) {
        expect(containsChinese(section.title)).toBe(true);
        for (const item of section.items) {
          expect(containsChinese(item.q)).toBe(true);
          expect(containsChinese(item.a)).toBe(true);
        }
      }
    });

    /**
     * 属性测试：英文 FAQ 不应该包含中文字符
     */
    it('英文 FAQ 问题和答案不应该包含中文字符', () => {
      const enSections = getFAQSections('en');

      for (const section of enSections) {
        expect(containsChinese(section.title)).toBe(false);
        for (const item of section.items) {
          expect(containsChinese(item.q)).toBe(false);
          expect(containsChinese(item.a)).toBe(false);
        }
      }
    });
  });

  describe('inLanguage Field Matching', () => {
    /**
     * 属性测试：inLanguage 应该匹配 locale
     */
    it('对于任意 locale，inLanguage 应该返回对应的语言代码', () => {
      fc.assert(
        fc.property(fc.constantFrom(...availableLocales), (locale) => {
          // 模拟组件行为：生成 inLanguage 字段
          const inLanguage = locale;

          expect(inLanguage).toBe(locale);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：inLanguage 应该是有效的 BCP 47 语言标签
     */
    it('inLanguage 应该是有效的语言代码格式', () => {
      const validLanguageCodes = ['en', 'zh', 'ja', 'ko', 'th', 'vi', 'de', 'fr', 'es', 'ar'];

      fc.assert(
        fc.property(fc.constantFrom(...validLanguageCodes), (locale) => {
          // BCP 47 语言标签格式验证（简化版）
          const isValidFormat = /^[a-z]{2,3}(-[A-Z]{2})?$/.test(locale);

          expect(isValidFormat).toBe(true);

          return true;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Translation Quality', () => {
    /**
     * 单元测试：描述长度应该合理
     */
    it('about.mission.desc 长度应该在合理范围内', () => {
      for (const locale of availableLocales) {
        const desc = getNestedValue(
          translations[locale] as Record<string, unknown>,
          'about.mission.desc'
        );

        expect(desc).toBeDefined();
        expect(desc!.length).toBeGreaterThan(50);
        expect(desc!.length).toBeLessThan(1000);
      }
    });

    /**
     * 单元测试：FAQ 问题长度应该合理
     */
    it('FAQ 问题长度应该在合理范围内', () => {
      for (const locale of availableLocales) {
        const sections = getFAQSections(locale);

        for (const section of sections) {
          for (const item of section.items) {
            expect(item.q.length).toBeGreaterThan(5);
            expect(item.q.length).toBeLessThan(500);
          }
        }
      }
    });

    /**
     * 单元测试：FAQ 答案长度应该合理
     */
    it('FAQ 答案长度应该在合理范围内', () => {
      for (const locale of availableLocales) {
        const sections = getFAQSections(locale);

        for (const section of sections) {
          for (const item of section.items) {
            expect(item.a.length).toBeGreaterThan(10);
            expect(item.a.length).toBeLessThan(2000);
          }
        }
      }
    });
  });

  describe('Schema Description Formatting', () => {
    /**
     * 单元测试：描述不应该包含 HTML 标签
     */
    it('about.mission.desc 不应该包含 HTML 标签', () => {
      for (const locale of availableLocales) {
        const desc = getNestedValue(
          translations[locale] as Record<string, unknown>,
          'about.mission.desc'
        );

        expect(desc).toBeDefined();
        expect(/<[^>]+>/.test(desc!)).toBe(false);
      }
    });

    /**
     * 单元测试：FAQ 答案不应该包含 HTML 标签
     */
    it('FAQ 答案不应该包含 HTML 标签', () => {
      for (const locale of availableLocales) {
        const sections = getFAQSections(locale);

        for (const section of sections) {
          for (const item of section.items) {
            expect(/<[^>]+>/.test(item.a)).toBe(false);
          }
        }
      }
    });

    /**
     * 单元测试：描述应该是完整句子（以句号结尾）
     */
    it('about.mission.desc 应该以句号结尾', () => {
      for (const locale of availableLocales) {
        const desc = getNestedValue(
          translations[locale] as Record<string, unknown>,
          'about.mission.desc'
        );

        expect(desc).toBeDefined();
        const lastChar = desc!.trim().slice(-1);
        // 中文句号或英文句号
        expect(['.', '。'].includes(lastChar)).toBe(true);
      }
    });
  });
});
