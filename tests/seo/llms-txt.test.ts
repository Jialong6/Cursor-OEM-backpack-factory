/**
 * llms.txt —— GEO(生成式引擎优化)站点导读验证
 *
 * llms.txt 规范(llmstxt.org):
 * - H1 标题(站点名)开头
 * - blockquote(>)一句话摘要
 * - H2 分区 + Markdown 链接列表,指向最有引用价值的页面
 *
 * 本测试验证 public/llms.txt:
 * - 文件存在且结构符合规范
 * - 指向核心可引用页面(fact-sheet / glossary / blog)
 * - 包含关键公司事实(MOQ / 月产能),AI 无需二跳即可引用
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BASE_URL } from '@/lib/metadata';

const LLMS_TXT_PATH = join(process.cwd(), 'public', 'llms.txt');

function readLlmsTxt(): string {
  return readFileSync(LLMS_TXT_PATH, 'utf-8');
}

describe('llms.txt GEO 站点导读', () => {
  it('public/llms.txt 应存在', () => {
    expect(existsSync(LLMS_TXT_PATH), 'public/llms.txt 不存在').toBe(true);
  });

  it('应以 H1 站点名开头,并含 blockquote 摘要', () => {
    const content = readLlmsTxt();
    const lines = content.split('\n');

    expect(lines[0]).toMatch(/^# Better Bags Myanmar/);
    expect(content).toMatch(/^> .+/m);
  });

  it('应链接到核心可引用页面(fact-sheet / glossary / blog)', () => {
    const content = readLlmsTxt();

    expect(content).toContain(`${BASE_URL}/en/fact-sheet`);
    expect(content).toContain(`${BASE_URL}/en/glossary`);
    expect(content).toContain(`${BASE_URL}/en/blog`);
    expect(content).toContain(`${BASE_URL}/en`);
  });

  it('应包含关键公司事实(MOQ 与月产能),AI 可直接引用', () => {
    const content = readLlmsTxt();

    expect(content).toContain('1,500');
    expect(content).toContain('50,000');
    expect(content).toMatch(/OEM/);
    expect(content).toMatch(/Yangon|Myanmar/);
  });

  it('应说明 12 语言支持(hreflang 提示)', () => {
    const content = readLlmsTxt();
    expect(content).toMatch(/12 languages/i);
  });
});
