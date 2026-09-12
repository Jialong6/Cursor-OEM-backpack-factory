/**
 * Unit tests for lib/analytics/form-tracking.ts
 *
 * 「用户开始填表」这个信号看起来简单,实际有三个会误触发的来源:
 * 草稿恢复、Geo-IP 自动填国家、国家联动自动填电话区号 —— 三者都是
 * setValue,都会让 QuoteFormContext 的 watchedValues 在用户没碰键盘时就变。
 *
 * 解法是基线快照 + 只看用户真正会敲的字段。这一层必须钉死,否则
 * form_start 会在页面加载瞬间就触发,整条漏斗的第一环直接失真。
 */
import { describe, it, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  AUTO_FILLED_FIELDS,
  SUBMIT_FAILURE_REASONS,
  USER_TYPED_FIELDS,
  hasUserInput,
} from '../../../lib/analytics/form-tracking';

const EMPTY = Object.freeze({});

describe('USER_TYPED_FIELDS 的范围', () => {
  test('包含用户真正会敲的字段', () => {
    expect(USER_TYPED_FIELDS).toContain('name');
    expect(USER_TYPED_FIELDS).toContain('email');
    expect(USER_TYPED_FIELDS).toContain('message');
  });

  test('排除两个自动填充的字段', () => {
    expect(USER_TYPED_FIELDS).not.toContain('countryRegion');
    expect(USER_TYPED_FIELDS).not.toContain('phoneCountryCode');
    expect(AUTO_FILLED_FIELDS).toEqual(['countryRegion', 'phoneCountryCode']);
  });

  test('排除验证码 token', () => {
    expect(USER_TYPED_FIELDS).not.toContain('turnstileToken');
  });
});

describe('hasUserInput', () => {
  test('空表单没有用户输入', () => {
    expect(hasUserInput(EMPTY, EMPTY)).toBe(false);
  });

  test('敲进一个字段就算开始填表', () => {
    expect(hasUserInput({ name: 'Klaus' }, EMPTY)).toBe(true);
  });

  test('只有空白字符不算', () => {
    expect(hasUserInput({ name: '   ' }, EMPTY)).toBe(false);
    expect(hasUserInput({ name: '' }, EMPTY)).toBe(false);
  });

  test('值与基线相同不算 —— 这是草稿恢复的场景', () => {
    const draft = { name: 'Klaus', email: 'k@example.com' };
    expect(hasUserInput(draft, draft)).toBe(false);
  });

  test('在草稿基础上改了才算', () => {
    const draft = { name: 'Klaus', email: 'k@example.com' };
    expect(hasUserInput({ ...draft, message: 'Need 2000 pcs' }, draft)).toBe(true);
  });

  test('Geo-IP 自动填国家不算开始填表', () => {
    expect(hasUserInput({ countryRegion: 'DE' }, EMPTY)).toBe(false);
  });

  test('国家联动自动填电话区号不算开始填表', () => {
    expect(hasUserInput({ countryRegion: 'DE', phoneCountryCode: '+49' }, EMPTY)).toBe(false);
  });

  test('非字符串值一律忽略,不抛错', () => {
    expect(hasUserInput({ name: 42 }, EMPTY)).toBe(false);
    expect(hasUserInput({ name: null }, EMPTY)).toBe(false);
    expect(hasUserInput({ name: undefined }, EMPTY)).toBe(false);
  });
});

describe('Property: hasUserInput 与基线', () => {
  const userField = fc.constantFrom(...USER_TYPED_FIELDS);
  const nonBlank = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim() !== '');

  it('属性:值完全等于基线时恒为 false', () => {
    fc.assert(
      fc.property(
        fc.dictionary(userField, nonBlank, { maxKeys: 5 }),
        (values) => {
          expect(hasUserInput(values, values)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('属性:把任一用户字段改成不同的非空值,即为 true', () => {
    fc.assert(
      fc.property(
        fc.dictionary(userField, nonBlank, { maxKeys: 4 }),
        userField,
        nonBlank,
        (baseline, field, next) => {
          fc.pre(baseline[field] !== next);

          expect(hasUserInput({ ...baseline, [field]: next }, baseline)).toBe(true);
        }
      ),
      { numRuns: 300 }
    );
  });

  it('属性:只动自动填充字段,永远为 false', () => {
    fc.assert(
      fc.property(
        fc.dictionary(userField, nonBlank, { maxKeys: 4 }),
        fc.constantFrom(...AUTO_FILLED_FIELDS),
        nonBlank,
        (baseline, autoField, value) => {
          expect(hasUserInput({ ...baseline, [autoField]: value }, baseline)).toBe(false);
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('SUBMIT_FAILURE_REASONS', () => {
  test('四条失败路径互相分得开', () => {
    expect(SUBMIT_FAILURE_REASONS).toEqual([
      'validation',
      'upload_failed',
      'server_rejected',
      'network_error',
    ]);
  });
});
