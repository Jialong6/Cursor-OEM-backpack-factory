/**
 * Unit tests for lib/analytics/link-classifier.ts
 *
 * 外链转化靠一个 document 级委托监听器采集,而不是去改六个组件 ——
 * lib/contact-links.ts 是会被服务端组件 import 的纯字符串模块,不能塞 track()。
 *
 * 两条硬约束:
 * 1. 站内锚点与同源链接必须返回 null。否则 CostAdvantage / FAQ 的
 *    <a href="#contact"> 会被委托监听器和 useAnchorScroll 各记一次,
 *    cta_click 直接翻倍。
 * 2. 返回值里永远不含 href 的任何用户信息。电话号码、邮箱地址一个字符
 *    都不能进库 —— 180 天保留期的合规叙事才说得清楚。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  OUTBOUND_EVENT_NAMES,
  classifyLink,
} from '../../../lib/analytics/link-classifier';

describe('classifyLink 识别的四类外链', () => {
  test.each([
    'https://wa.me/18148801463',
    'https://wa.me/18148801463?text=Hello',
    'https://api.whatsapp.com/send?phone=18148801463',
  ])('%s 是 WhatsApp', (href) => {
    expect(classifyLink(href)).toBe('whatsapp_click');
  });

  test.each([
    'mailto:jay@betterbagsmm.com',
    'mailto:jay@betterbagsmm.com?subject=Quote',
    'MAILTO:JAY@BETTERBAGSMM.COM',
  ])('%s 是邮件', (href) => {
    expect(classifyLink(href)).toBe('email_click');
  });

  test.each(['tel:+8613061391463', 'tel:+959985670999'])('%s 是电话', (href) => {
    expect(classifyLink(href)).toBe('phone_click');
  });

  test.each([
    'https://www.google.com/maps/search/?api=1&query=Better+Bags+Myanmar',
    'https://maps.google.com/?q=Yangon',
    'https://goo.gl/maps/abc123',
  ])('%s 是地图', (href) => {
    expect(classifyLink(href)).toBe('map_click');
  });
});

describe('必须返回 null 的情况', () => {
  test.each([
    '#contact',
    '#contact-form',
    '#',
    '/en/blog',
    '/en/privacy',
    'en/blog',
    '',
  ])('站内链接 %s 不算外链转化', (href) => {
    expect(classifyLink(href)).toBeNull();
  });

  test('未识别的外站链接不算转化', () => {
    expect(classifyLink('https://example.com/page')).toBeNull();
    expect(classifyLink('https://cal.com/jayli')).toBeNull();
  });

  test('容忍 null 与 undefined', () => {
    expect(classifyLink(null)).toBeNull();
    expect(classifyLink(undefined)).toBeNull();
  });

  test('前后空格不影响判定', () => {
    expect(classifyLink('  tel:+8613061391463  ')).toBe('phone_click');
  });
});

describe('Property: classifyLink 的健壮性与隐私', () => {
  it('属性:任意字符串都不抛错,且返回值只可能是已知事件名或 null', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (href) => {
        const result = classifyLink(href);

        if (result !== null) {
          expect(OUTBOUND_EVENT_NAMES).toContain(result);
        }
      }),
      { numRuns: 500 }
    );
  });

  it('属性:返回值里绝不出现 href 的任何片段', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('tel:', 'mailto:', 'https://wa.me/'),
        fc.string({ minLength: 4, maxLength: 40 }).filter((s) => s.trim().length >= 4),
        (scheme, secret) => {
          const result = classifyLink(`${scheme}${secret}`);

          if (result === null) {
            return;
          }

          // 返回的是一个固定事件名,和输入里的号码/地址没有任何关系
          expect(result).not.toContain(secret.trim());
          expect(OUTBOUND_EVENT_NAMES).toContain(result);
        }
      ),
      { numRuns: 300 }
    );
  });
});
