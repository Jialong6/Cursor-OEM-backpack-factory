/**
 * app/favicon.ico —— Yandex 诊断「Favicon file not found」修复验证
 *
 * 背景:Yandex 机器人按惯例直接抓 /favicon.ico(此前 404),且偏好
 * 不超过 120x120 的尺寸。app/favicon.ico 是 Next.js app 根级 metadata
 * 文件,自动服务于 /favicon.ico。
 *
 * 验证:
 * - 文件存在且非空
 * - 头 4 字节为 ICO magic(00 00 01 00)
 * - 目录项数 >= 1,且每个目录项宽高均 <= 120(0 表示 256,视为超限)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FAVICON_PATH = join(__dirname, '..', '..', 'app', 'favicon.ico');

function readFavicon(): Buffer {
  return readFileSync(FAVICON_PATH);
}

describe('app/favicon.ico', () => {
  it('文件存在且非空', () => {
    const buffer = readFavicon();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('头 4 字节为 ICO magic(00 00 01 00)', () => {
    const buffer = readFavicon();
    expect(buffer.readUInt16LE(0)).toBe(0); // reserved
    expect(buffer.readUInt16LE(2)).toBe(1); // type: 1 = ICO
  });

  it('目录项数 >= 1,且每个尺寸 <= 120x120(满足 Yandex 偏好)', () => {
    const buffer = readFavicon();
    const count = buffer.readUInt16LE(4);
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      // ICONDIRENTRY: 6 字节头之后每项 16 字节;宽高各 1 字节,0 表示 256
      const offset = 6 + i * 16;
      const width = buffer.readUInt8(offset);
      const height = buffer.readUInt8(offset + 1);
      expect(width, `第 ${i + 1} 项宽度超限`).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(120);
      expect(height, `第 ${i + 1} 项高度超限`).toBeGreaterThan(0);
      expect(height).toBeLessThanOrEqual(120);
    }
  });
});
