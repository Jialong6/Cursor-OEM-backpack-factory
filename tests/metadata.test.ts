/**
 * SEO 元数据测试
 *
 * 功能：
 * - 验证 locales JSON 中 metadata namespace 的文案符合 SEO 要求（全语言）
 * - 验证元数据生成函数的 Open Graph / hreflang / canonical 配置
 *
 * 验证需求：14.1, 14.2, 14.3, 14.8
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  generateHomeMetadata,
  generateBlogListMetadata,
  generateBlogDetailMetadata,
  generateGenericMetadata,
  type PageMetadata,
} from '@/lib/metadata';
import { locales } from '@/i18n';

const LOCALES_DIR = path.join(__dirname, '..', 'locales');

interface LocaleMetadata {
  home: PageMetadata;
  blogList: PageMetadata;
  factSheet: PageMetadata;
  virtualTour: PageMetadata;
}

/** 读取每个 locale JSON 的 metadata namespace */
function loadAllMetadata(): Record<string, LocaleMetadata> {
  const result: Record<string, LocaleMetadata> = {};
  for (const locale of locales) {
    const raw = fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf8');
    const parsed = JSON.parse(raw) as { metadata: LocaleMetadata };
    result[locale] = parsed.metadata;
  }
  return result;
}

const allMetadata = loadAllMetadata();
const enHome: PageMetadata = allMetadata.en.home;
const enBlogList: PageMetadata = allMetadata.en.blogList;

describe('SEO 元数据配置', () => {
  /**
   * 需求 14.1: 标题应在 60 字符以内（全语言）
   */
  describe('标题长度验证（需求 14.1）', () => {
    it.each(locales)('%s 首页标题应不超过 60 字符', (locale) => {
      expect(allMetadata[locale].home.title.length).toBeLessThanOrEqual(60);
    });

    it.each(locales)('%s 博客列表页标题应不超过 60 字符', (locale) => {
      expect(allMetadata[locale].blogList.title.length).toBeLessThanOrEqual(60);
    });

    it('博客详情页标题应自动截断超过 60 字符的标题', () => {
      const longTitle = 'This is a very long title that exceeds sixty characters for testing purposes';
      const metadata = generateBlogDetailMetadata('en', 'test-slug', longTitle, 'Description');

      expect(metadata.title).toBeDefined();
      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
    });
  });

  /**
   * 需求 14.2: 描述应在 150 字符以内（全语言）
   */
  describe('描述长度验证（需求 14.2）', () => {
    it.each(locales)('%s 首页描述应不超过 150 字符', (locale) => {
      expect(allMetadata[locale].home.description.length).toBeLessThanOrEqual(150);
    });

    it.each(locales)('%s 博客列表页描述应不超过 150 字符', (locale) => {
      expect(allMetadata[locale].blogList.description.length).toBeLessThanOrEqual(150);
    });

    it('博客详情页描述应自动截断超过 150 字符的描述', () => {
      const longDescription =
        'This is a very long description that exceeds one hundred and fifty characters for testing purposes and should be automatically truncated by the metadata generation function';
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Title', longDescription);

      expect(metadata.description).toBeDefined();
      expect((metadata.description as string).length).toBeLessThanOrEqual(150);
    });
  });

  /**
   * 需求 14.3: Open Graph 元标签配置
   */
  describe('Open Graph 标签验证（需求 14.3）', () => {
    it('首页应包含 Open Graph 标签', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.url).toBeDefined();
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('博客列表页应包含 Open Graph 标签', () => {
      const metadata = generateBlogListMetadata('en', enBlogList);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.url).toBeDefined();
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('博客详情页应包含 Open Graph 标签', () => {
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Test Title', 'Test Description');

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.url).toBeDefined();
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('Open Graph 应包含图片尺寸信息', () => {
      const metadata = generateHomeMetadata('en', enHome);
      const images = metadata.openGraph?.images as any[];

      expect(images).toBeDefined();
      expect(images.length).toBeGreaterThan(0);
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
    });
  });

  /**
   * 需求 14.8: hreflang 标签配置
   */
  describe('hreflang 标签验证（需求 14.8）', () => {
    it('首页应包含 hreflang 标签', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      // 使用 ISO hreflang 代码: en 和 zh-Hans
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('博客列表页应包含 hreflang 标签', () => {
      const metadata = generateBlogListMetadata('en', enBlogList);

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('博客详情页应包含 hreflang 标签', () => {
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Test Title', 'Test Description');

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('hreflang 应包含 x-default 回退', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.alternates?.languages).toHaveProperty('x-default');
    });

    it('hreflang URL 应包含正确的语言路径', () => {
      const metadata = generateHomeMetadata('en', enHome);
      const languages = metadata.alternates?.languages as Record<string, string>;

      expect(languages.en).toContain('/en');
      expect(languages['zh-Hans']).toContain('/zh');
    });
  });

  /**
   * Twitter Card 标签验证
   */
  describe('Twitter Card 标签验证', () => {
    it('首页应包含 Twitter Card 标签', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBeDefined();
      expect(metadata.twitter?.description).toBeDefined();
      expect(metadata.twitter?.images).toBeDefined();
    });

    it('博客详情页应包含 Twitter Card 标签', () => {
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Test Title', 'Test Description');

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });
  });

  /**
   * 语言特定配置验证
   */
  describe('语言特定配置验证', () => {
    it('英文元数据应使用 en_US locale', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.openGraph?.locale).toBe('en_US');
    });

    it('中文元数据应使用 zh_CN locale', () => {
      const metadata = generateHomeMetadata('zh', allMetadata.zh.home);

      expect(metadata.openGraph?.locale).toBe('zh_CN');
    });
  });

  /**
   * Canonical URL 验证
   */
  describe('Canonical URL 验证', () => {
    it('首页应包含 canonical URL', () => {
      const metadata = generateHomeMetadata('en', enHome);

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('/en');
    });

    it('博客列表页应包含 canonical URL', () => {
      const metadata = generateBlogListMetadata('en', enBlogList);

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('/en/blog');
    });

    it('博客详情页应包含 canonical URL', () => {
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Test Title', 'Test Description');

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('/en/blog/test-slug');
    });
  });

  /**
   * 内容质量验证（全语言）
   */
  describe('内容质量验证', () => {
    it.each(locales)('%s 首页标题应包含品牌名称', (locale) => {
      expect(allMetadata[locale].home.title).toContain('Better Bags');
    });

    it('英文/中文标题应包含关键词', () => {
      expect(enHome.title.toLowerCase()).toMatch(/backpack|oem|factory/);
      expect(allMetadata.zh.home.title).toMatch(/背包|OEM|工厂/);
    });

    it.each(locales)('%s 首页描述应具有描述性且不为空', (locale) => {
      expect(allMetadata[locale].home.description.length).toBeGreaterThan(20);
    });
  });

  /**
   * Fact Sheet 页元数据验证(全语言)
   *
   * 需求 14.1/14.2:标题 ≤60、描述 ≤150;GEO 页要求全语言直接达标(非运行时截断)
   */
  describe('Fact Sheet 元数据验证', () => {
    it.each(locales)('%s Fact Sheet 标题应不超过 60 字符', (locale) => {
      expect(allMetadata[locale].factSheet.title.length).toBeLessThanOrEqual(60);
    });

    it.each(locales)('%s Fact Sheet 描述应不超过 150 字符', (locale) => {
      expect(allMetadata[locale].factSheet.description.length).toBeLessThanOrEqual(150);
    });

    it.each(locales)('%s Fact Sheet 描述应具有描述性且不为空', (locale) => {
      expect(allMetadata[locale].factSheet.description.length).toBeGreaterThan(20);
    });

    it.each(locales)('%s Fact Sheet 标题应包含品牌名称', (locale) => {
      expect(allMetadata[locale].factSheet.title).toContain('Better Bags');
    });

    it('generateGenericMetadata 应为 /fact-sheet 生成正确的 canonical', () => {
      const meta = allMetadata.en.factSheet;
      const metadata = generateGenericMetadata(
        'en',
        meta.title,
        meta.description,
        '/fact-sheet'
      );

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('/en/fact-sheet');
      expect(metadata.alternates?.languages).toBeDefined();
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
      expect(metadata.alternates?.languages).toHaveProperty('x-default');
    });
  });

  /**
   * 虚拟看厂落地页元数据验证(全语言)
   *
   * 需求 14.1/14.2:标题 ≤60、描述 ≤150,全语言直接达标(非运行时截断)
   */
  describe('Virtual Tour 元数据验证', () => {
    it.each(locales)('%s Virtual Tour 标题应不超过 60 字符', (locale) => {
      expect(allMetadata[locale].virtualTour.title.length).toBeLessThanOrEqual(60);
    });

    it.each(locales)('%s Virtual Tour 描述应不超过 150 字符', (locale) => {
      expect(allMetadata[locale].virtualTour.description.length).toBeLessThanOrEqual(150);
    });

    it.each(locales)('%s Virtual Tour 描述应具有描述性且不为空', (locale) => {
      expect(allMetadata[locale].virtualTour.description.length).toBeGreaterThan(20);
    });

    it.each(locales)('%s Virtual Tour 标题应包含品牌名称', (locale) => {
      expect(allMetadata[locale].virtualTour.title).toContain('Better Bags');
    });

    it('generateGenericMetadata 应为 /virtual-factory-tour 生成正确的 canonical', () => {
      const meta = allMetadata.en.virtualTour;
      const metadata = generateGenericMetadata(
        'en',
        meta.title,
        meta.description,
        '/virtual-factory-tour'
      );

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain(
        '/en/virtual-factory-tour'
      );
      expect(metadata.alternates?.languages).toBeDefined();
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
      expect(metadata.alternates?.languages).toHaveProperty('x-default');
    });
  });
});
