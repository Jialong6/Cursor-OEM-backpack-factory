import { describe, it, expect } from 'vitest';
import { getLocalExampleNumber } from '@/lib/phone-examples';

/**
 * 验证电话号码示例工具：根据 ISO 国家码返回该国本地号码示例。
 *
 * 用作表单 phoneNumber 字段的动态 placeholder —— 用户选 US 区号后看到 10 位
 * 美国号码示例；选 CN 看到 11 位中国号码示例；无效国家回退 null。
 */
describe('getLocalExampleNumber', () => {
  it('returns a 10-digit number for US', () => {
    const ex = getLocalExampleNumber('US');
    expect(ex).toBeTruthy();
    expect(ex).toMatch(/^\d{10}$/);
  });

  it('returns an 11-digit number for CN', () => {
    const ex = getLocalExampleNumber('CN');
    expect(ex).toBeTruthy();
    expect(ex).toMatch(/^\d{11}$/);
  });

  it('returns a number for JP', () => {
    const ex = getLocalExampleNumber('JP');
    expect(ex).toBeTruthy();
    expect(ex).toMatch(/^\d+$/);
  });

  it('returns a number for DE', () => {
    const ex = getLocalExampleNumber('DE');
    expect(ex).toBeTruthy();
    expect(ex).toMatch(/^\d+$/);
  });

  it('is case-insensitive (accepts "us" or "Us")', () => {
    expect(getLocalExampleNumber('us')).toBe(getLocalExampleNumber('US'));
    expect(getLocalExampleNumber('Us')).toBe(getLocalExampleNumber('US'));
  });

  it('returns null for empty string', () => {
    expect(getLocalExampleNumber('')).toBeNull();
  });

  it('returns null for invalid length', () => {
    expect(getLocalExampleNumber('U')).toBeNull();
    expect(getLocalExampleNumber('USA')).toBeNull();
  });

  it('returns null for unsupported country code', () => {
    expect(getLocalExampleNumber('XX')).toBeNull();
  });

  it('US and CN return different-length numbers', () => {
    const us = getLocalExampleNumber('US')!;
    const cn = getLocalExampleNumber('CN')!;
    expect(us.length).not.toBe(cn.length);
  });
});
