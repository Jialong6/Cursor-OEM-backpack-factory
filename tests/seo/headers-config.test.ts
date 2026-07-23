/**
 * lib/headers —— next.config headers 规则验证
 *
 * 背景(GSC「已抓取-尚未编入索引」出现 /_next/static/css/*.css):
 * 构建产物不应进搜索索引,但 robots.txt 不能 Disallow /_next/
 * (Google 渲染页面需要抓 CSS/JS),正确做法是 X-Robots-Tag: noindex 响应头。
 *
 * 验证:
 * - 规则形状:source 仅限 /_next/static(不含 /_next/image,否则损害图片收录)、
 *   headers 恰为 X-Robots-Tag: noindex、不含 Cache-Control
 *   (Next 对 immutable 哈希资源会忽略自定义 Cache-Control,防误加造成假象)
 * - 用 Next 真实匹配器(getPathMatch)锁死匹配行为:
 *   静态资源路径命中;页面路径、/_next/image、sitemap/robots/favicon 不命中
 * - 交叉守护:robots.txt 通配规则不得 disallow /_next(挡渲染资源)
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
// Next 内部 API(15.x 路径稳定);若升级 Next 后挪位,退化为字符串断言即可
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { staticAssetsNoindexRule, buildHeaders } from '@/lib/headers';
import robots from '@/app/robots';
import { locales, type Locale } from '@/i18n';

describe('/_next/static X-Robots-Tag 规则形状', () => {
  it('buildHeaders 恰 1 条规则(范围最小化,防误伤其他路径)', () => {
    const rules = buildHeaders();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toBe(staticAssetsNoindexRule);
  });

  it('source 仅匹配 /_next/static,headers 恰为 X-Robots-Tag: noindex', () => {
    expect(staticAssetsNoindexRule.source).toBe('/_next/static/:path*');
    expect(staticAssetsNoindexRule.headers).toEqual([
      { key: 'X-Robots-Tag', value: 'noindex' },
    ]);
  });

  it('规则不含 Cache-Control(immutable 哈希资源上会被 Next 忽略,禁止依赖)', () => {
    for (const rule of buildHeaders()) {
      for (const header of rule.headers) {
        expect(header.key.toLowerCase()).not.toBe('cache-control');
      }
    }
  });
});

describe('/_next/static 匹配行为(Next 真实匹配器)', () => {
  const matcher = getPathMatch(staticAssetsNoindexRule.source);

  it('属性:任意哈希文件名的 css/chunks/media 路径均命中', () => {
    fc.assert(
      fc.property(
        fc.string({
          unit: fc.constantFrom(...'0123456789abcdef'),
          minLength: 16,
          maxLength: 16,
        }),
        fc.constantFrom(
          (hash: string) => `css/${hash}.css`,
          (hash: string) => `chunks/${hash}.js`,
          (hash: string) => `media/${hash}.woff2`
        ),
        (hash, buildPath) => {
          expect(matcher(`/_next/static/${buildPath(hash)}`)).not.toBe(false);
        }
      ),
      { numRuns: 60 }
    );
  });

  // GSC 报告里的 CSS URL 带 ?dpl= 部署参数;headers 匹配基于 pathname,
  // query 天然不参与,此处仅以裸 pathname 说明该形态已被覆盖
  it('GSC 报告形态的 CSS pathname 命中', () => {
    expect(matcher('/_next/static/css/9d747922d2db8611.css')).not.toBe(false);
  });

  it('属性:任意 locale 的页面路径不命中', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom('', '/blog', '/glossary', '/fact-sheet', '/blog/some-post'),
        (locale: Locale, subPath: string) => {
          expect(matcher(`/${locale}${subPath}`)).toBe(false);
        }
      ),
      { numRuns: 60 }
    );
  });

  it('/_next/image 与站点根文件不命中(图片收录与站点文件不受影响)', () => {
    expect(matcher('/_next/image')).toBe(false);
    expect(matcher('/_next/image/foo.png')).toBe(false);
    expect(matcher('/favicon.ico')).toBe(false);
    expect(matcher('/sitemap.xml')).toBe(false);
    expect(matcher('/robots.txt')).toBe(false);
  });
});

describe('与 robots.txt 的分工守护', () => {
  it('robots 通配规则不得 disallow /_next(渲染资源必须可抓,noindex 靠响应头)', () => {
    const { rules } = robots();
    const ruleList = Array.isArray(rules) ? rules : [rules];
    for (const rule of ruleList) {
      const disallow = rule.disallow ?? [];
      const disallowList = Array.isArray(disallow) ? disallow : [disallow];
      for (const entry of disallowList) {
        expect(
          entry.startsWith('/_next'),
          `robots disallow ${entry} 会阻断渲染资源抓取`
        ).toBe(false);
      }
    }
  });
});
