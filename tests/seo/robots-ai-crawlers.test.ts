/**
 * robots.txt —— AI 爬虫显式放行验证
 *
 * 把"不屏蔽 AI 爬虫"从隐式(仅 * 全放行)变为显式:
 * - 7 个 AI UA 各有 allow '/' 的规则(OAI-SearchBot / GPTBot / ChatGPT-User /
 *   ClaudeBot / Claude-SearchBot / PerplexityBot / Google-Extended)
 * - 原 * 规则仍在,disallow 含 /api/ 与 /_not-found
 * - sitemap 与 host 仍存在
 */

import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import { BASE_URL } from '@/lib/metadata';

const AI_CRAWLERS = [
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
];

const result = robots();
// rules 可能是单对象或数组;统一成数组便于遍历
const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

/** 判断某规则的 userAgent 是否覆盖指定 UA(userAgent 可为字符串或数组) */
function ruleCoversAgent(
  rule: { userAgent?: string | string[] },
  agent: string
): boolean {
  const ua = rule.userAgent;
  if (Array.isArray(ua)) {
    return ua.includes(agent);
  }
  return ua === agent;
}

/** 将 allow 归一化为数组 */
function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

describe('robots.txt AI 爬虫规则', () => {
  it.each(AI_CRAWLERS)('%s 应有 allow "/" 的规则', (agent) => {
    const rule = rules.find((r) => ruleCoversAgent(r, agent));
    expect(rule, `缺少 ${agent} 的规则`).toBeDefined();
    expect(toArray(rule!.allow)).toContain('/');
  });

  it('通配 * 规则仍存在,disallow 含 /api/ 与 /_not-found', () => {
    const wildcard = rules.find((r) => r.userAgent === '*');
    expect(wildcard, '缺少通配 * 规则').toBeDefined();

    const disallow = toArray(wildcard!.disallow);
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/_not-found');
  });

  it('sitemap 与 host 仍存在', () => {
    expect(result.sitemap).toBe(`${BASE_URL}/sitemap.xml`);
    expect(result.host).toBe(BASE_URL);
  });
});
