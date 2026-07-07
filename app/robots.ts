/**
 * 生成 robots.txt
 *
 * 功能：
 * - 配置搜索引擎爬虫规则
 * - 指向 sitemap.xml
 * - 允许所有页面被索引（除了 API 和错误页）
 *
 * 验证需求：14.6, 14.7
 */

import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/metadata';

/**
 * AI / 生成式搜索爬虫 UA 列表
 *
 * 显式放行内容页(disallow 仅 /api/),把"不屏蔽 AI 爬虫"从隐式(仅依赖 *
 * 全放行)变为显式声明,利于 GEO(生成式引擎优化)—— 让 ChatGPT Search、
 * Perplexity、Claude、Google AI 等明确知道内容可抓取与引用。
 */
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_not-found'],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
