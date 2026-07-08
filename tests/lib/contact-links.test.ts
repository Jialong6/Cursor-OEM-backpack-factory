/**
 * Unit + property tests for lib/contact-links.ts
 *
 * 背景:旧实现的号码清洗正则 /[\s()-]/g 不去点号与 +,工厂号
 * "+1 814.880.1463" 生成 wa.me/+1814.880.1463(WhatsApp 判无效)。
 * 新实现要求 wa.me 链接的号码部分为纯数字(官方格式)。
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  toWhatsAppNumber,
  buildWhatsAppHref,
  buildMailtoHref,
} from '../../lib/contact-links';

describe('toWhatsAppNumber', () => {
  test('strips plus, dots, spaces, parentheses and hyphens from the real factory number', () => {
    expect(toWhatsAppNumber('+1 814.880.1463')).toBe('18148801463');
  });

  test('strips every non-digit character', () => {
    expect(toWhatsAppNumber('+86 (532) 8856-2277')).toBe('865328856 2277'.replace(/\D/g, ''));
    expect(toWhatsAppNumber('+95 9 9856 70999')).toBe('959985670999');
  });
});

describe('buildWhatsAppHref', () => {
  test('builds a digits-only wa.me link (the previous regex left dots in and broke the link)', () => {
    expect(buildWhatsAppHref('+1 814.880.1463')).toBe(
      'https://wa.me/18148801463'
    );
  });

  test('appends URL-encoded prefill text when provided', () => {
    const href = buildWhatsAppHref('+1 814.880.1463', '您好, tour?');
    expect(href).toBe(
      `https://wa.me/18148801463?text=${encodeURIComponent('您好, tour?')}`
    );
  });

  test('Property: any messy display number yields https://wa.me/<digits only>', () => {
    fc.assert(
      fc.property(
        // 数字 + 常见排版杂字符的任意组合(至少含一位数字)
        fc
          .array(
            fc.constantFrom(
              ...'0123456789'.split(''),
              '+',
              '.',
              ' ',
              '(',
              ')',
              '-'
            ),
            { minLength: 1, maxLength: 24 }
          )
          .map((chars) => chars.join(''))
          .filter((s) => /\d/.test(s)),
        (display) => {
          const href = buildWhatsAppHref(display);
          expect(href).toMatch(/^https:\/\/wa\.me\/\d+$/);
          // 确定性
          expect(buildWhatsAppHref(display)).toBe(href);
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('buildMailtoHref', () => {
  test('plain address when no options given', () => {
    expect(buildMailtoHref('jay@betterbagsmm.com')).toBe(
      'mailto:jay@betterbagsmm.com'
    );
  });

  test('encodes subject and body as query params', () => {
    const href = buildMailtoHref('jay@betterbagsmm.com', {
      subject: '预约线上云看厂',
      body: '您好,我想预约。时间:',
    });
    expect(href).toBe(
      `mailto:jay@betterbagsmm.com?subject=${encodeURIComponent('预约线上云看厂')}&body=${encodeURIComponent('您好,我想预约。时间:')}`
    );
  });

  test('subject-only and body-only both work', () => {
    expect(buildMailtoHref('a@b.co', { subject: 'Hi' })).toBe(
      'mailto:a@b.co?subject=Hi'
    );
    expect(buildMailtoHref('a@b.co', { body: 'Hello there' })).toBe(
      'mailto:a@b.co?body=Hello%20there'
    );
  });
});
