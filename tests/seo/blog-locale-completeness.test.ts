/**
 * 博客文章 12 语完整性守卫
 *
 * 约定:每篇 BlogPost 的 contentLoaders 与 title / excerpt / category
 * 必须覆盖 i18n.ts 声明的全部 locale,且每个 locale 的正文可实际加载。
 * 此前该不变量无测试守护 —— 少一种语言只会在运行时静默回退到英文。
 */

import { describe, it, expect } from 'vitest';
import { BLOG_POSTS } from '@/lib/blog-data';
import { locales } from '@/i18n';

describe('博客文章 12 语完整性', () => {
  for (const post of BLOG_POSTS) {
    describe(post.slug, () => {
      it('contentLoaders 覆盖全部 locale', () => {
        for (const locale of locales) {
          expect(
            typeof post.contentLoaders[locale],
            `${post.slug} 缺少 ${locale} 正文加载器`
          ).toBe('function');
        }
      });

      it('title / excerpt / category 覆盖全部 locale 且非空', () => {
        for (const locale of locales) {
          expect(post.title[locale]?.trim(), `${post.slug} title 缺 ${locale}`).toBeTruthy();
          expect(post.excerpt[locale]?.trim(), `${post.slug} excerpt 缺 ${locale}`).toBeTruthy();
          expect(post.category[locale]?.trim(), `${post.slug} category 缺 ${locale}`).toBeTruthy();
        }
      });

      it('每个 locale 的正文可加载、以 H1 开头且有实质内容', async () => {
        for (const locale of locales) {
          const loader = post.contentLoaders[locale];
          if (!loader) continue;
          const mod = await loader();
          const body = mod.default.trim();
          expect(body.startsWith('# '), `${post.slug} ${locale} 正文未以 H1 开头`).toBe(true);
          expect(body.length, `${post.slug} ${locale} 正文过短`).toBeGreaterThan(500);
        }
      });
    });
  }
});
