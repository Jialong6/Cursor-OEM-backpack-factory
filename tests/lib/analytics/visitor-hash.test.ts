/**
 * Unit tests for lib/analytics/visitor-hash.ts
 *
 * 访客身份是整个第二期隐私叙事的支点:只存不可逆指纹、不存明文 IP,
 * 而且指纹所用的盐每天换一次,跨天无法关联到同一个人。
 *
 * 隐私政策里已经写了这句话(12 个语言版),所以这一层的行为不是实现细节,
 * 而是对外承诺。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  dailySalt,
  utcDateKey,
  visitorHash,
} from '../../../lib/analytics/visitor-hash';

const SECRET = 'test-secret-value';
const DAY = new Date('2026-09-12T00:00:00Z');

describe('utcDateKey', () => {
  test('按 UTC 取日期,与服务器所在时区无关', () => {
    expect(utcDateKey(new Date('2026-09-12T23:30:00Z'))).toBe('2026-09-12');
    expect(utcDateKey(new Date('2026-09-13T00:30:00Z'))).toBe('2026-09-13');
  });
});

describe('dailySalt', () => {
  test('同一天同一密钥得到同一个盐', () => {
    const a = dailySalt(SECRET, new Date('2026-09-12T01:00:00Z'));
    const b = dailySalt(SECRET, new Date('2026-09-12T22:00:00Z'));

    expect(a).toBe(b);
  });

  test('换一天就换盐', () => {
    const a = dailySalt(SECRET, new Date('2026-09-12T12:00:00Z'));
    const b = dailySalt(SECRET, new Date('2026-09-13T12:00:00Z'));

    expect(a).not.toBe(b);
  });

  test('换密钥就换盐,轮换密钥可以切断全部历史关联', () => {
    expect(dailySalt(SECRET, DAY)).not.toBe(dailySalt('another-secret', DAY));
  });

  test('密钥为空时抛错,绝不静默降级成无盐哈希', () => {
    expect(() => dailySalt('', DAY)).toThrow();
  });
});

describe('visitorHash', () => {
  const salt = dailySalt(SECRET, DAY);
  const ip = '203.0.113.45';
  const ua = 'Mozilla/5.0 (Macintosh) Chrome/120';

  test('同样的输入得到同样的哈希', () => {
    expect(visitorHash(salt, ip, ua)).toBe(visitorHash(salt, ip, ua));
  });

  test('换 IP 或换 UA 都得到不同哈希', () => {
    expect(visitorHash(salt, '198.51.100.7', ua)).not.toBe(visitorHash(salt, ip, ua));
    expect(visitorHash(salt, ip, 'Mozilla/5.0 (iPhone) Safari')).not.toBe(
      visitorHash(salt, ip, ua)
    );
  });

  test('输出是定长十六进制', () => {
    expect(visitorHash(salt, ip, ua)).toMatch(/^[0-9a-f]{64}$/);
  });

  test('IP 缺失时仍能产出稳定哈希,不抛错', () => {
    expect(visitorHash(salt, '', ua)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('Property: 跨日不可关联', () => {
  const ipArb = fc
    .tuple(
      fc.integer({ min: 1, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 1, max: 254 })
    )
    .map((parts) => parts.join('.'));

  it('属性:同一台设备在不同日期必然得到不同的访客标识', () => {
    fc.assert(
      fc.property(
        ipArb,
        fc.string({ maxLength: 60 }),
        fc.integer({ min: 1, max: 400 }),
        (ip, ua, dayOffset) => {
          const first = new Date('2026-01-01T00:00:00Z');
          const later = new Date(first.getTime() + dayOffset * 86_400_000);

          expect(visitorHash(dailySalt(SECRET, first), ip, ua)).not.toBe(
            visitorHash(dailySalt(SECRET, later), ip, ua)
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  it('属性:输出里永远找不到完整的原始 IP', () => {
    fc.assert(
      fc.property(ipArb, fc.string({ maxLength: 60 }), (ip, ua) => {
        expect(visitorHash(dailySalt(SECRET, DAY), ip, ua)).not.toContain(ip);
      }),
      { numRuns: 200 }
    );
  });

  it('属性:同一天内同一输入始终稳定', () => {
    fc.assert(
      fc.property(ipArb, fc.string({ maxLength: 60 }), (ip, ua) => {
        const salt = dailySalt(SECRET, DAY);

        expect(visitorHash(salt, ip, ua)).toBe(visitorHash(salt, ip, ua));
      }),
      { numRuns: 200 }
    );
  });
});
