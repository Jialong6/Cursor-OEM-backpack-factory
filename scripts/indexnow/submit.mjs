/**
 * IndexNow URL 推送 CLI
 *
 * 用法:
 *   npm run indexnow                    全量推送生产 sitemap 中的 URL
 *   npm run indexnow -- --dry-run       只打印 payload,不发请求
 *   npm run indexnow -- --urls=a,b      定向推送指定 URL(跳过 sitemap 拉取)
 *
 * URL 来源是生产环境的 sitemap.xml(app/sitemap.ts 为唯一事实来源),
 * 因此需在部署完成后运行;GitHub Actions 由 deployment_status 触发,
 * 天然满足该时序。任何失败路径 exit code 为 1,供 CI 感知。
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  DEFAULT_BASE_URL,
  assertUrlsMatchHost,
  buildPayload,
  discoverKey,
  parseSitemapUrls,
  submitUrls,
} from './lib.mjs';

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 拉取生产 sitemap 并解析出全部 URL */
async function fetchSitemapUrls(baseUrl) {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  console.log(`拉取 sitemap: ${sitemapUrl}`);

  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`sitemap 拉取失败: HTTP ${response.status}`);
  }

  return parseSitemapUrls(await response.text());
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      urls: { type: 'string' },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
  const host = new URL(baseUrl).host;

  const { fileName, key } = discoverKey(join(PROJECT_ROOT, 'public'));
  console.log(`IndexNow key 文件: public/${fileName}`);

  const urls = values.urls
    ? values.urls.split(',').map((url) => url.trim()).filter(Boolean)
    : await fetchSitemapUrls(baseUrl);

  if (urls.length === 0) {
    throw new Error('URL 列表为空,无可提交内容');
  }

  assertUrlsMatchHost(urls, host);
  const payload = buildPayload({ baseUrl, key, urls });

  if (values['dry-run']) {
    console.log(JSON.stringify(payload, null, 2));
    console.log(`dry-run: 共 ${urls.length} 个 URL,未发送`);
    return;
  }

  const result = await submitUrls({ payload });
  console.log(`已提交 ${urls.length} 个 URL -> HTTP ${result.status} ${result.label}`);
  console.log(result.hint);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`IndexNow 提交失败: ${error.message}`);
  process.exitCode = 1;
});
