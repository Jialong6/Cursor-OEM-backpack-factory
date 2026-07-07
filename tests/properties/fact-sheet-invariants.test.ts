/**
 * Fact Sheet 翻译不变量测试
 *
 * 遍历 12 语 locale JSON(fs 直读,与 hub-spoke-links 同风格),校验:
 * - factSheet namespace 存在,title/intro/lastUpdated 非空
 * - facts 数组长度与 en 一致(19),每项恰好 {label, value} 且均非空
 *   (现有 parity 测试把数组当叶子,不校验数组内部,此测试补上这个缺口)
 * - facts 拼接后的 values 必须含固定 token(联系方式、行业缩写、年份、数字)
 * - lastUpdated 含 2026
 * - footer.links 有 href === '/fact-sheet' 的项
 *
 * 事实是跨语言不变量:电话/邮箱/域名/AQL 2.5/OEM 等即使本地化也不得漂移。
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { locales } from '../../i18n';

const LOCALES_DIR = path.join(process.cwd(), 'locales');

interface FactItem {
  label: string;
  value: string;
}

function loadTranslationFile(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function getFactSheet(locale: string): Record<string, unknown> {
  const translations = loadTranslationFile(locale);
  return translations.factSheet as Record<string, unknown>;
}

function getFacts(locale: string): FactItem[] {
  const factSheet = getFactSheet(locale);
  return factSheet.facts as FactItem[];
}

/** 拼接一个 locale 所有 fact 的 value,便于做 token 存在性断言 */
function joinFactValues(locale: string): string {
  return getFacts(locale)
    .map((f) => f.value)
    .join(' | ');
}

// en 是事实数量的唯一来源(19 行)
const EN_FACTS_LENGTH = getFacts('en').length;

describe('Fact Sheet 翻译不变量', () => {
  describe('结构完整性', () => {
    it.each(locales)('%s: factSheet 存在且 title/intro/lastUpdated 非空', (locale) => {
      const factSheet = getFactSheet(locale);
      expect(factSheet, `${locale}: factSheet namespace 缺失`).toBeDefined();

      expect(typeof factSheet.title).toBe('string');
      expect((factSheet.title as string).trim().length).toBeGreaterThan(0);

      expect(typeof factSheet.intro).toBe('string');
      expect((factSheet.intro as string).trim().length).toBeGreaterThan(0);

      expect(typeof factSheet.lastUpdated).toBe('string');
      expect((factSheet.lastUpdated as string).trim().length).toBeGreaterThan(0);
    });

    it('en 的 facts 长度应为 19', () => {
      expect(EN_FACTS_LENGTH).toBe(19);
    });

    it.each(locales)('%s: facts 长度与 en 一致', (locale) => {
      const facts = getFacts(locale);
      expect(Array.isArray(facts), `${locale}: facts 不是数组`).toBe(true);
      expect(facts.length).toBe(EN_FACTS_LENGTH);
    });

    it.each(locales)('%s: 每个 fact 恰好 {label, value} 且均非空', (locale) => {
      const facts = getFacts(locale);
      for (let i = 0; i < facts.length; i++) {
        const fact = facts[i];
        const keys = Object.keys(fact).sort();
        expect(keys, `${locale}: facts[${i}] 键应恰为 [label, value]`).toEqual([
          'label',
          'value',
        ]);
        expect(
          typeof fact.label === 'string' && fact.label.trim().length > 0,
          `${locale}: facts[${i}].label 应为非空字符串`
        ).toBe(true);
        expect(
          typeof fact.value === 'string' && fact.value.trim().length > 0,
          `${locale}: facts[${i}].value 应为非空字符串`
        ).toBe(true);
      }
    });
  });

  describe('联系方式 token 跨语言不漂移', () => {
    // 这些 token 即使在本地化译文里也必须原样保留
    const CONTACT_TOKENS = [
      'jay@betterbagsmm.com',
      'betterbagsmm.com',
      '+1 814.880.1463',
      '+86 130 6139 1463',
      '+86 (532) 8856-2277',
      '+86 152 5320 6760',
      '+95 9 9856 70999',
    ];

    it.each(locales)('%s: facts values 含全部联系方式 token', (locale) => {
      const joined = joinFactValues(locale);
      for (const token of CONTACT_TOKENS) {
        expect(joined, `${locale}: 缺少联系方式 token "${token}"`).toContain(token);
      }
    });
  });

  describe('行业缩写与标准 token 跨语言不漂移', () => {
    // AQL 2.5 必须用点号(de/ru 也不例外),行业缩写保留拉丁字母
    const STANDARD_TOKENS = ['AQL 2.5', 'IPQC', 'FQC', 'OEM', 'ODM', 'FOB'];

    it.each(locales)('%s: facts values 含全部行业标准 token', (locale) => {
      const joined = joinFactValues(locale);
      for (const token of STANDARD_TOKENS) {
        expect(joined, `${locale}: 缺少行业 token "${token}"`).toContain(token);
      }
    });
  });

  describe('年份与数字事实跨语言不漂移', () => {
    it.each(locales)('%s: facts values 含年份 2003 与 2023', (locale) => {
      const joined = joinFactValues(locale);
      expect(joined, `${locale}: 缺少 2003`).toContain('2003');
      expect(joined, `${locale}: 缺少 2023`).toContain('2023');
    });

    // 数字分隔符宽容:允许 逗号/点号/普通空格/无分隔(de 用点号、ru 用空格、其余用逗号)
    it.each(locales)('%s: facts values 含产能 50000、MOQ 1500、员工 600', (locale) => {
      const joined = joinFactValues(locale);
      expect(joined, `${locale}: 缺少产能 50,000`).toMatch(/50[.,   ]?000/);
      expect(joined, `${locale}: 缺少 MOQ 1,500`).toMatch(/1[.,   ]?500/);
      expect(joined, `${locale}: 缺少员工 600`).toMatch(/600/);
    });
  });

  describe('lastUpdated 含年份', () => {
    it.each(locales)('%s: lastUpdated 含 2026', (locale) => {
      const factSheet = getFactSheet(locale);
      expect(factSheet.lastUpdated as string).toContain('2026');
    });
  });

  describe('footer 链接接入', () => {
    it.each(locales)('%s: footer.links 含 href === "/fact-sheet" 的项', (locale) => {
      const translations = loadTranslationFile(locale);
      const footer = translations.footer as Record<string, unknown>;
      const links = footer.links as Array<{ name: string; href: string }>;

      const factSheetLink = links.find((link) => link.href === '/fact-sheet');
      expect(factSheetLink, `${locale}: footer 缺少 Fact Sheet 链接`).toBeDefined();
      expect(factSheetLink?.name.trim().length).toBeGreaterThan(0);
    });
  });
});
