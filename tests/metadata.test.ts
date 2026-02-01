/**
 * SEO 元数据测试
 *
 * 功能：
 * - 验证元数据配置正确性
 * - 确保标题和描述符合 SEO 要求
 * - 检查 Open Graph 标签配置
 *
 * 验证需求：14.1, 14.2, 14.3, 14.8
 */

import { describe, it, expect } from 'vitest';
import {
  generateHomeMetadata,
  generateBlogListMetadata,
  generateBlogDetailMetadata,
  homeMetadata,
  blogListMetadata,
} from '@/lib/metadata';

describe('SEO 元数据配置', () => {
  /**
   * 需求 14.1: 标题应在 60 字符以内
   */
  describe('标题长度验证（需求 14.1）', () => {
    it('首页英文标题应不超过 60 字符', () => {
      expect(homeMetadata.en.title.length).toBeLessThanOrEqual(60);
    });

    it('首页中文标题应不超过 60 字符', () => {
      expect(homeMetadata.zh.title.length).toBeLessThanOrEqual(60);
    });

    it('博客列表页英文标题应不超过 60 字符', () => {
      expect(blogListMetadata.en.title.length).toBeLessThanOrEqual(60);
    });

    it('博客列表页中文标题应不超过 60 字符', () => {
      expect(blogListMetadata.zh.title.length).toBeLessThanOrEqual(60);
    });

    it('博客详情页标题应自动截断超过 60 字符的标题', () => {
      const longTitle = 'This is a very long title that exceeds sixty characters for testing purposes';
      const metadata = generateBlogDetailMetadata('en', 'test-slug', longTitle, 'Description');

      expect(metadata.title).toBeDefined();
      expect((metadata.title as string).length).toBeLessThanOrEqual(60);
    });
  });

  /**
   * 需求 14.2: 描述应在 150 字符以内
   */
  describe('描述长度验证（需求 14.2）', () => {
    it('首页英文描述应不超过 150 字符', () => {
      expect(homeMetadata.en.description.length).toBeLessThanOrEqual(150);
    });

    it('首页中文描述应不超过 150 字符', () => {
      expect(homeMetadata.zh.description.length).toBeLessThanOrEqual(150);
    });

    it('博客列表页英文描述应不超过 150 字符', () => {
      expect(blogListMetadata.en.description.length).toBeLessThanOrEqual(150);
    });

    it('博客列表页中文描述应不超过 150 字符', () => {
      expect(blogListMetadata.zh.description.length).toBeLessThanOrEqual(150);
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
      const metadata = generateHomeMetadata('en');

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.url).toBeDefined();
      expect(metadata.openGraph?.images).toBeDefined();
    });

    it('博客列表页应包含 Open Graph 标签', () => {
      const metadata = generateBlogListMetadata('en');

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
      const metadata = generateHomeMetadata('en');
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
      const metadata = generateHomeMetadata('en');

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      // 使用 ISO hreflang 代码: en 和 zh-Hans
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('博客列表页应包含 hreflang 标签', () => {
      const metadata = generateBlogListMetadata('en');

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      // 使用 ISO hreflang 代码: en 和 zh-Hans
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('博客详情页应包含 hreflang 标签', () => {
      const metadata = generateBlogDetailMetadata('en', 'test-slug', 'Test Title', 'Test Description');

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.languages).toBeDefined();
      // 使用 ISO hreflang 代码: en 和 zh-Hans
      expect(metadata.alternates?.languages?.en).toBeDefined();
      expect(metadata.alternates?.languages?.['zh-Hans']).toBeDefined();
    });

    it('hreflang 应包含 x-default 回退', () => {
      const metadata = generateHomeMetadata('en');

      expect(metadata.alternates?.languages).toHaveProperty('x-default');
    });

    it('hreflang URL 应包含正确的语言路径', () => {
      const metadata = generateHomeMetadata('en');
      const languages = metadata.alternates?.languages as Record<string, string>;

      // 使用 ISO hreflang 代码
      expect(languages.en).toContain('/en');
      expect(languages['zh-Hans']).toContain('/zh');
    });
  });

  /**
   * Twitter Card 标签验证
   */
  describe('Twitter Card 标签验证', () => {
    it('首页应包含 Twitter Card 标签', () => {
      const metadata = generateHomeMetadata('en');

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
      const metadata = generateHomeMetadata('en');

      expect(metadata.openGraph?.locale).toBe('en_US');
    });

    it('中文元数据应使用 zh_CN locale', () => {
      const metadata = generateHomeMetadata('zh');

      expect(metadata.openGraph?.locale).toBe('zh_CN');
    });
  });

  /**
   * Canonical URL 验证
   */
  describe('Canonical URL 验证', () => {
    it('首页应包含 canonical URL', () => {
      const metadata = generateHomeMetadata('en');

      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('/en');
    });

    it('博客列表页应包含 canonical URL', () => {
      const metadata = generateBlogListMetadata('en');

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
   * 内容质量验证
   */
  describe('内容质量验证', () => {
    it('标题应包含品牌名称', () => {
      expect(homeMetadata.en.title).toContain('Better Bags');
      expect(homeMetadata.zh.title).toContain('Better Bags');
    });

    it('标题应包含关键词', () => {
      expect(homeMetadata.en.title.toLowerCase()).toMatch(/backpack|oem|factory/);
      expect(homeMetadata.zh.title).toMatch(/背包|OEM|工厂/);
    });

    it('描述应具有描述性且不为空', () => {
      expect(homeMetadata.en.description.length).toBeGreaterThan(50);
      expect(homeMetadata.zh.description.length).toBeGreaterThan(20);
    });
  });
});
