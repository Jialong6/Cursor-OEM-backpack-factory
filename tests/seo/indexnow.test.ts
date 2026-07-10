/**
 * IndexNow 推送工具验证
 *
 * IndexNow 协议(indexnow.org):
 * - key 文件必须在 https://host/{key}.txt 公开可访问,内容即 key 本身
 * - 批量提交:POST https://api.indexnow.org/indexnow,JSON 含 host/key/keyLocation/urlList
 * - 一次提交即共享给 Bing / Naver / Yandex / Seznam
 *
 * 本测试验证 scripts/indexnow/lib.mjs:
 * - public/ 下恰好存在一个合法 key 文件(文件名格式 + 内容一致)
 * - sitemap XML 解析只提取 loc(不混入 hreflang alternates 的 href)
 * - payload 构造与 host 校验符合协议要求
 * - HTTP 状态码语义映射(202 = key 验证 pending 属正常)
 */

import { describe, it, expect, vi } from 'vitest';
import { join } from 'path';
import { BASE_URL } from '@/lib/metadata';
import {
  INDEXNOW_ENDPOINT,
  DEFAULT_BASE_URL,
  findKeyEntry,
  discoverKey,
  parseSitemapUrls,
  assertUrlsMatchHost,
  buildPayload,
  interpretStatus,
  submitUrls,
} from '../../scripts/indexnow/lib.mjs';

const PUBLIC_DIR = join(process.cwd(), 'public');

/** Next.js 15 由 app/sitemap.ts 生成的真实 sitemap 格式(含 hreflang alternates) */
const NEXTJS_SITEMAP_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url>
<loc>https://betterbagsmm.com/en</loc>
<xhtml:link rel="alternate" hreflang="en" href="https://betterbagsmm.com/en" />
<xhtml:link rel="alternate" hreflang="zh-Hans" href="https://betterbagsmm.com/zh" />
<xhtml:link rel="alternate" hreflang="zh-Hant" href="https://betterbagsmm.com/zh-tw" />
<lastmod>2026-07-10T00:00:00.000Z</lastmod>
<changefreq>weekly</changefreq>
<priority>1</priority>
</url>
<url>
<loc>https://betterbagsmm.com/en/blog</loc>
<xhtml:link rel="alternate" hreflang="en" href="https://betterbagsmm.com/en/blog" />
<lastmod>2026-07-10T00:00:00.000Z</lastmod>
<changefreq>daily</changefreq>
<priority>0.9</priority>
</url>
</urlset>`;

describe('IndexNow key 文件守护(真实 public/)', () => {
  it('public/ 下应恰好发现一个合法 key 文件', () => {
    expect(() => discoverKey(PUBLIC_DIR)).not.toThrow();
  });

  it('key 应符合 IndexNow 格式(8-128 位,a-zA-Z0-9 与连字符)', () => {
    const { key } = discoverKey(PUBLIC_DIR);
    expect(key).toMatch(/^[A-Za-z0-9-]{8,128}$/);
  });

  it('key 文件内容应与文件名一致(搜索引擎的验证方式)', () => {
    const { key, fileName } = discoverKey(PUBLIC_DIR);
    expect(fileName).toBe(`${key}.txt`);
  });
});

describe('findKeyEntry 纯函数', () => {
  const validKey = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('空列表应抛错', () => {
    expect(() => findKeyEntry([])).toThrow(/key/i);
  });

  it('只有 llms.txt 时应抛错,不误认', () => {
    const entries = [{ name: 'llms.txt', content: '# Better Bags Myanmar\n> OEM factory' }];
    expect(() => findKeyEntry(entries)).toThrow(/key/i);
  });

  it('文件名合法但内容与文件名不符时不应识别为 key', () => {
    const entries = [{ name: `${validKey}.txt`, content: 'something-else' }];
    expect(() => findKeyEntry(entries)).toThrow(/key/i);
  });

  it('恰好一个合法 entry 时应返回 key 与文件名', () => {
    const entries = [
      { name: 'llms.txt', content: '# Better Bags Myanmar' },
      { name: `${validKey}.txt`, content: `${validKey}\n` },
    ];
    expect(findKeyEntry(entries)).toEqual({ key: validKey, fileName: `${validKey}.txt` });
  });

  it('两个合法 entry 时应抛错(歧义)', () => {
    const otherKey = 'ffeeddccbbaa99887766554433221100';
    const entries = [
      { name: `${validKey}.txt`, content: validKey },
      { name: `${otherKey}.txt`, content: otherKey },
    ];
    expect(() => findKeyEntry(entries)).toThrow(/key/i);
  });
});

describe('parseSitemapUrls', () => {
  it('空字符串应返回空数组', () => {
    expect(parseSitemapUrls('')).toEqual([]);
  });

  it('应提取单条 loc', () => {
    const xml = '<urlset><url><loc>https://betterbagsmm.com/en</loc></url></urlset>';
    expect(parseSitemapUrls(xml)).toEqual(['https://betterbagsmm.com/en']);
  });

  it('应按文档顺序提取多条 loc', () => {
    const xml = `<urlset>
      <url><loc>https://betterbagsmm.com/en</loc></url>
      <url><loc>https://betterbagsmm.com/zh</loc></url>
      <url><loc>https://betterbagsmm.com/en/blog</loc></url>
    </urlset>`;
    expect(parseSitemapUrls(xml)).toEqual([
      'https://betterbagsmm.com/en',
      'https://betterbagsmm.com/zh',
      'https://betterbagsmm.com/en/blog',
    ]);
  });

  it('Next.js 真实格式:只提取 loc,不混入 alternates 的 href', () => {
    const urls = parseSitemapUrls(NEXTJS_SITEMAP_FIXTURE);
    expect(urls).toEqual([
      'https://betterbagsmm.com/en',
      'https://betterbagsmm.com/en/blog',
    ]);
  });

  it('应解码 XML 实体(&amp; &lt; &gt; &quot; &apos;)', () => {
    const xml = '<url><loc>https://betterbagsmm.com/en?a=1&amp;b=2</loc></url>';
    expect(parseSitemapUrls(xml)).toEqual(['https://betterbagsmm.com/en?a=1&b=2']);
  });

  it('应 trim loc 内的前后空白', () => {
    const xml = '<url><loc>\n  https://betterbagsmm.com/en\n</loc></url>';
    expect(parseSitemapUrls(xml)).toEqual(['https://betterbagsmm.com/en']);
  });

  it('应去重', () => {
    const xml = `<urlset>
      <url><loc>https://betterbagsmm.com/en</loc></url>
      <url><loc>https://betterbagsmm.com/en</loc></url>
    </urlset>`;
    expect(parseSitemapUrls(xml)).toEqual(['https://betterbagsmm.com/en']);
  });
});

describe('buildPayload', () => {
  const key = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const urls = ['https://betterbagsmm.com/en', 'https://betterbagsmm.com/zh'];

  it('应构造协议要求的四字段(host 为裸域名)', () => {
    const payload = buildPayload({ baseUrl: 'https://betterbagsmm.com', key, urls });
    expect(payload).toEqual({
      host: 'betterbagsmm.com',
      key,
      keyLocation: `https://betterbagsmm.com/${key}.txt`,
      urlList: urls,
    });
  });
});

describe('assertUrlsMatchHost', () => {
  it('全部同 host 时不应抛错', () => {
    const urls = ['https://betterbagsmm.com/en', 'https://betterbagsmm.com/zh/blog'];
    expect(() => assertUrlsMatchHost(urls, 'betterbagsmm.com')).not.toThrow();
  });

  it('混入异 host 时应抛错且信息包含违规 URL', () => {
    const urls = ['https://betterbagsmm.com/en', 'https://evil.example.com/x'];
    expect(() => assertUrlsMatchHost(urls, 'betterbagsmm.com')).toThrow(/evil\.example\.com/);
  });

  it('非法 URL 字符串应抛错', () => {
    expect(() => assertUrlsMatchHost(['not-a-url'], 'betterbagsmm.com')).toThrow();
  });
});

describe('interpretStatus', () => {
  it('200 应为成功', () => {
    expect(interpretStatus(200).ok).toBe(true);
  });

  it('202 应为成功且标注 key 验证 pending', () => {
    const result = interpretStatus(202);
    expect(result.ok).toBe(true);
    expect(result.label).toMatch(/pending/i);
  });

  it('403 应为失败且提示与 key 有关', () => {
    const result = interpretStatus(403);
    expect(result.ok).toBe(false);
    expect(result.hint).toMatch(/key/i);
  });

  it('422 应为失败且提示与 host 有关', () => {
    const result = interpretStatus(422);
    expect(result.ok).toBe(false);
    expect(result.hint).toMatch(/host/i);
  });

  it.each([400, 429, 500])('%i 应为失败', (status) => {
    expect(interpretStatus(status).ok).toBe(false);
  });
});

describe('submitUrls(注入 fake fetch)', () => {
  const payload = {
    host: 'betterbagsmm.com',
    key: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    keyLocation: 'https://betterbagsmm.com/a1b2c3d4e5f60718293a4b5c6d7e8f90.txt',
    urlList: ['https://betterbagsmm.com/en'],
  };

  it('应向端点 POST JSON(UTF-8),body 与 payload 一致', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await submitUrls({ payload, fetchImpl: fakeFetch });

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fakeFetch.mock.calls[0];
    expect(endpoint).toBe(INDEXNOW_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('202 响应应返回 ok=true', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const result = await submitUrls({ payload, fetchImpl: fakeFetch });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(202);
  });

  it('403 响应应返回 ok=false', async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    const result = await submitUrls({ payload, fetchImpl: fakeFetch });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });
});

describe('防漂移一致性', () => {
  it('DEFAULT_BASE_URL 应与 lib/metadata 的 BASE_URL 默认值一致', () => {
    expect(DEFAULT_BASE_URL).toBe(BASE_URL);
  });
});
