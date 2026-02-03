/**
 * 多语言字体配置测试
 *
 * Task 16: 配置多语言字体
 * 验证:
 * - 16.1 Noto Sans 字体家族配置正确
 * - 16.2 按语言加载对应字体（CSS 变量映射）
 * - 16.3 字体回退栈完整
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { locales, type Locale } from '@/i18n';
import {
  getLocaleFontConfig,
  getFontStack,
  getRequiredCSSVariables,
  FONT_FALLBACK_STACK,
  FONT_CSS_VARIABLES,
} from '@/lib/font-config';

/**
 * 需要 CJK 字体的语言列表
 */
const CJK_LOCALES: readonly Locale[] = ['zh', 'zh-tw', 'ja'] as const;

/**
 * 使用西里尔字母的语言
 */
const CYRILLIC_LOCALES: readonly Locale[] = ['ru'] as const;

/**
 * 使用拉丁字母的语言
 */
const LATIN_LOCALES: readonly Locale[] = ['en', 'de', 'nl', 'fr', 'pt', 'es'] as const;

describe('Task 16: 多语言字体配置', () => {
  describe('16.1 Noto Sans 字体家族配置', () => {
    it('应该为每个支持的 locale 提供字体配置', () => {
      for (const locale of locales) {
        const config = getLocaleFontConfig(locale);
        expect(config).toBeDefined();
        expect(config.primary).toBeDefined();
        expect(config.primary.length).toBeGreaterThan(0);
      }
    });

    it('应该包含 Noto Sans 基础字体', () => {
      for (const locale of locales) {
        const config = getLocaleFontConfig(locale);
        const hasPrimaryFont = config.primary.some(
          (name: string) => name.toLowerCase().includes('noto')
        );
        expect(hasPrimaryFont, `locale "${locale}" should have a Noto Sans font`).toBe(true);
      }
    });

    it('CJK 语言应该有专用 CJK 字体', () => {
      const cjkFontMap: Record<string, string> = {
        zh: 'sc',
        'zh-tw': 'tc',
        ja: 'jp',
      };

      for (const locale of CJK_LOCALES) {
        const config = getLocaleFontConfig(locale);
        const expectedSuffix = cjkFontMap[locale];
        const hasCJKFont = config.primary.some((name: string) =>
          name.toLowerCase().includes(expectedSuffix)
        );
        expect(
          hasCJKFont,
          `locale "${locale}" should have a CJK font containing "${expectedSuffix}"`
        ).toBe(true);
      }
    });

    it('拉丁语言应该使用基础 Noto Sans', () => {
      for (const locale of LATIN_LOCALES) {
        const config = getLocaleFontConfig(locale);
        expect(config.primary).toContain('Noto Sans');
      }
    });

    it('俄语应该使用基础 Noto Sans（含西里尔子集）', () => {
      const config = getLocaleFontConfig('ru');
      expect(config.primary).toContain('Noto Sans');
    });
  });

  describe('16.2 按语言加载字体（CSS 变量映射）', () => {
    it('应该定义所有必需的 CSS 变量名称', () => {
      expect(FONT_CSS_VARIABLES.base).toBe('--font-noto-sans');
      expect(FONT_CSS_VARIABLES.sc).toBe('--font-noto-sans-sc');
      expect(FONT_CSS_VARIABLES.tc).toBe('--font-noto-sans-tc');
      expect(FONT_CSS_VARIABLES.jp).toBe('--font-noto-sans-jp');
    });

    it('每个 locale 应该返回正确的 CSS 变量列表', () => {
      for (const locale of locales) {
        const vars = getRequiredCSSVariables(locale);
        expect(vars).toBeDefined();
        expect(vars.length).toBeGreaterThan(0);
        // 所有 locale 都需要基础字体
        expect(vars).toContain(FONT_CSS_VARIABLES.base);
      }
    });

    it('CJK 语言应该需要额外的 CJK CSS 变量', () => {
      const zhVars = getRequiredCSSVariables('zh');
      expect(zhVars).toContain(FONT_CSS_VARIABLES.sc);

      const zhTwVars = getRequiredCSSVariables('zh-tw');
      expect(zhTwVars).toContain(FONT_CSS_VARIABLES.tc);

      const jaVars = getRequiredCSSVariables('ja');
      expect(jaVars).toContain(FONT_CSS_VARIABLES.jp);
    });

    it('拉丁语言只需要基础 CSS 变量', () => {
      for (const locale of LATIN_LOCALES) {
        const vars = getRequiredCSSVariables(locale);
        expect(vars.length).toBe(1);
        expect(vars[0]).toBe(FONT_CSS_VARIABLES.base);
      }
    });

    it('CJK 语言需要比拉丁语言更多的 CSS 变量', () => {
      const enVars = getRequiredCSSVariables('en');
      for (const locale of CJK_LOCALES) {
        const cjkVars = getRequiredCSSVariables(locale);
        expect(cjkVars.length).toBeGreaterThan(enVars.length);
      }
    });

    it('属性测试: 任意 locale 的 CSS 变量都应以 --font- 开头', () => {
      const localeArb = fc.constantFrom(...locales);

      fc.assert(
        fc.property(localeArb, (locale) => {
          const vars = getRequiredCSSVariables(locale);
          for (const v of vars) {
            expect(v).toMatch(/^--font-/);
          }
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('16.3 字体回退栈', () => {
    it('应该定义全局字体回退栈', () => {
      expect(FONT_FALLBACK_STACK).toBeDefined();
      expect(Array.isArray(FONT_FALLBACK_STACK)).toBe(true);
      expect(FONT_FALLBACK_STACK.length).toBeGreaterThan(0);
    });

    it('回退栈应该包含 system-ui 和 sans-serif', () => {
      expect(FONT_FALLBACK_STACK).toContain('system-ui');
      expect(FONT_FALLBACK_STACK).toContain('sans-serif');
    });

    it('每个 locale 的字体配置应该包含回退字体', () => {
      for (const locale of locales) {
        const config = getLocaleFontConfig(locale);
        expect(config.fallback).toBeDefined();
        expect(config.fallback.length).toBeGreaterThan(0);
      }
    });

    it('getFontStack 应该返回 primary + fallback 的完整字体栈', () => {
      for (const locale of locales) {
        const stack = getFontStack(locale);
        const config = getLocaleFontConfig(locale);
        expect(stack.length).toBe(config.primary.length + config.fallback.length);
        // primary 应该在前
        for (let i = 0; i < config.primary.length; i++) {
          expect(stack[i]).toBe(config.primary[i]);
        }
      }
    });

    it('CJK 语言回退栈应该包含系统 CJK 字体', () => {
      const systemCJKFonts = [
        'PingFang SC',
        'PingFang TC',
        'Hiragino Sans',
        'Microsoft YaHei',
        'MS Gothic',
        'SimHei',
      ];

      for (const locale of CJK_LOCALES) {
        const config = getLocaleFontConfig(locale);
        const hasSystemCJK = config.fallback.some((font: string) =>
          systemCJKFonts.some((cjk) => font.includes(cjk))
        );
        expect(
          hasSystemCJK,
          `locale "${locale}" fallback should include system CJK fonts`
        ).toBe(true);
      }
    });

    it('西里尔语言回退栈应该包含回退字体', () => {
      for (const locale of CYRILLIC_LOCALES) {
        const config = getLocaleFontConfig(locale);
        expect(config.fallback.length).toBeGreaterThan(0);
      }
    });

    it('属性测试: 任意 locale 的回退栈都应该以通用字体族结尾', () => {
      const localeArb = fc.constantFrom(...locales);

      fc.assert(
        fc.property(localeArb, (locale) => {
          const config = getLocaleFontConfig(locale);
          const lastFallback = config.fallback[config.fallback.length - 1];
          const genericFamilies = ['sans-serif', 'serif', 'monospace', 'system-ui'];
          expect(
            genericFamilies.includes(lastFallback),
            `locale "${locale}" fallback should end with a generic font family, got "${lastFallback}"`
          ).toBe(true);
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('属性测试: 任意 locale 的字体配置不应有重复条目', () => {
      const localeArb = fc.constantFrom(...locales);

      fc.assert(
        fc.property(localeArb, (locale) => {
          const config = getLocaleFontConfig(locale);
          const allFonts = [...config.primary, ...config.fallback];
          const uniqueFonts = new Set(allFonts);
          expect(uniqueFonts.size).toBe(allFonts.length);
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});
