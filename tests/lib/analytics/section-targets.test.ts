/**
 * Unit tests for lib/analytics/section-targets.ts
 *
 * 板块观测靠一个选择器扫 DOM,而不是硬编码 id 列表 —— 后者每加一个页面
 * 都要改常量,而且看厂页的 4 个 tour-* id 根本不挂在 <section> 上,
 * 而是挂在 <h2> 上、<section> 只有 aria-labelledby。
 *
 * blog / glossary / fact-sheet 一个 <section> 都没有,所以还需要一条
 * 兜底:一个都没匹配到时观测 main 本身,博客文章至少拿到阅读时长。
 */
import { describe, test, expect, beforeEach } from 'vitest';
import {
  MAX_TRACKED_SECTIONS,
  PAGE_FALLBACK_KEY,
  SECTION_SELECTOR,
  collectSections,
  sectionKey,
} from '../../../lib/analytics/section-targets';

function setBody(html: string): void {
  document.body.innerHTML = html;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('SECTION_SELECTOR', () => {
  test('同时覆盖三种标记方式', () => {
    expect(SECTION_SELECTOR).toContain('[data-analytics-section]');
    expect(SECTION_SELECTOR).toContain('section[id]');
    expect(SECTION_SELECTOR).toContain('section[aria-labelledby]');
  });
});

describe('sectionKey 的优先级', () => {
  test('data-analytics-section 优先级最高', () => {
    setBody('<section id="about" data-analytics-section="custom"></section>');
    const el = document.querySelector('section') as Element;
    expect(sectionKey(el)).toBe('custom');
  });

  test('其次用 id', () => {
    setBody('<section id="features"></section>');
    expect(sectionKey(document.querySelector('section') as Element)).toBe('features');
  });

  test('最后用 aria-labelledby —— 看厂页就是这个形态', () => {
    setBody('<section aria-labelledby="tour-booking"><h2 id="tour-booking">x</h2></section>');
    expect(sectionKey(document.querySelector('section') as Element)).toBe('tour-booking');
  });

  test('三者都没有时返回空串', () => {
    setBody('<section></section>');
    expect(sectionKey(document.querySelector('section') as Element)).toBe('');
  });
});

describe('collectSections', () => {
  test('扫出首页的全部板块', () => {
    setBody(
      ['banner', 'costAdvantage', 'whatSetsUsApart', 'marketPositioning', 'about',
       'features', 'services', 'testimonials', 'faq', 'contact', 'blog']
        .map((id) => `<section id="${id}"></section>`)
        .join('')
    );

    const targets = collectSections(document);

    expect(targets).toHaveLength(11);
    expect(targets.map((t) => t.key)).toContain('costAdvantage');
    expect(targets.map((t) => t.key)).toContain('testimonials');
  });

  test('扫出看厂页那种 aria-labelledby 形态', () => {
    setBody(
      ['tour-what-you-see', 'tour-how-it-works', 'tour-booking', 'tour-details']
        .map((id) => `<section aria-labelledby="${id}"><h2 id="${id}">x</h2></section>`)
        .join('')
    );

    expect(collectSections(document).map((t) => t.key)).toEqual([
      'tour-what-you-see',
      'tour-how-it-works',
      'tour-booking',
      'tour-details',
    ]);
  });

  test('同一个 key 只保留第一个元素', () => {
    setBody('<section id="about"></section><section data-analytics-section="about"></section>');
    expect(collectSections(document)).toHaveLength(1);
  });

  test('跳过没有可用 key 的 section', () => {
    setBody('<section></section><section id="faq"></section>');
    expect(collectSections(document).map((t) => t.key)).toEqual(['faq']);
  });

  test('数量超上限时截断,保护主线程', () => {
    setBody(
      Array.from({ length: MAX_TRACKED_SECTIONS + 10 }, (_, i) => `<section id="s${i}"></section>`).join('')
    );
    expect(collectSections(document)).toHaveLength(MAX_TRACKED_SECTIONS);
  });
});

describe('兜底:没有任何 section 的页面', () => {
  test('退回观测 main#main-content,key 用 _page', () => {
    setBody('<main id="main-content"><article><h1>Blog post</h1></article></main>');

    const targets = collectSections(document);

    expect(targets).toHaveLength(1);
    expect(targets[0].key).toBe(PAGE_FALLBACK_KEY);
    expect(targets[0].element.tagName.toLowerCase()).toBe('main');
  });

  test('连 main 都没有时返回空数组,不抛错', () => {
    setBody('<div>nothing</div>');
    expect(collectSections(document)).toEqual([]);
  });

  test('容忍 null 与 undefined', () => {
    expect(collectSections(null)).toEqual([]);
    expect(collectSections(undefined)).toEqual([]);
  });
});
