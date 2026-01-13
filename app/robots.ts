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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_not-found'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
