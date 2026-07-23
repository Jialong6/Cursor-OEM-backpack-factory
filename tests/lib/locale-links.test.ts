/**
 * lib/locale-links —— 跨语言路径映射纯函数测试
 *
 * 页脚语言区块把当前路径映射到目标语言的等价路径,核心风险是
 * locale 段的前缀截断:/zh 不能误剥 /zh-tw 路径(反之亦然)。
 * LanguageSwitcher 现存的 pathname.replace 写法即有此隐患,
 * 本模块用完整段匹配根治,并以属性测试锁死。
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { stripLocalePrefix, buildLocaleHref } from '@/lib/locale-links';
import { locales, type Locale } from '@/i18n';

const SUB_PATHS = ['', '/blog', '/glossary', '/fact-sheet', '/blog/some-slug'] as const;

describe('stripLocalePrefix', () => {
  it('剥离首页与子路径的完整 locale 段', () => {
    expect(stripLocalePrefix('/en', 'en')).toBe('');
    expect(stripLocalePrefix('/en/blog', 'en')).toBe('/blog');
    expect(stripLocalePrefix('/zh-tw/blog/post', 'zh-tw')).toBe('/blog/post');
  });

  it('zh 不误剥 zh-tw 路径(完整段匹配)', () => {
    expect(stripLocalePrefix('/zh-tw/blog', 'zh')).toBe('/zh-tw/blog');
    expect(stripLocalePrefix('/zh-tw', 'zh')).toBe('/zh-tw');
  });

  it('不匹配的前缀原样返回', () => {
    expect(stripLocalePrefix('/de/blog', 'fr')).toBe('/de/blog');
    expect(stripLocalePrefix('/', 'en')).toBe('/');
  });
});

describe('buildLocaleHref', () => {
  it('属性:任意 locale 对 × 子路径,输出为目标语言等价路径', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...locales),
        fc.constantFrom(...locales),
        fc.constantFrom(...SUB_PATHS),
        (current: Locale, target: Locale, subPath: string) => {
          const href = buildLocaleHref(`/${current}${subPath}`, current, target);
          expect(href).toBe(`/${target}${subPath}`);
          expect(href.startsWith(`/${target}`)).toBe(true);
          expect(href.includes('//')).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('zh-tw 当前页跨语言不被 zh 前缀截断', () => {
    expect(buildLocaleHref('/zh-tw/blog', 'zh-tw', 'de')).toBe('/de/blog');
    expect(buildLocaleHref('/zh/blog', 'zh', 'zh-tw')).toBe('/zh-tw/blog');
  });

  it('首页映射到目标语言首页', () => {
    expect(buildLocaleHref('/en', 'en', 'ja')).toBe('/ja');
  });
});
