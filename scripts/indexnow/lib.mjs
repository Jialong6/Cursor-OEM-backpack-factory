/**
 * IndexNow 推送核心逻辑(纯函数层)
 *
 * IndexNow 协议(indexnow.org):向 api.indexnow.org 批量提交 URL,
 * Bing / Naver / Yandex / Seznam 共享收到。key 是公开的所有权令牌,
 * 必须能在 https://host/{key}.txt 访问到,内容即 key 本身。
 *
 * 设计约定:
 * - public/{key}.txt 是 key 的唯一事实来源,通过双重守卫自动发现
 *   (文件名格式 + 内容与文件名一致),不引入 env 变量避免漂移
 * - 网络请求经 fetchImpl 注入,便于测试;本文件仅依赖 node 内置模块
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/** 与 lib/metadata.ts 的 BASE_URL 默认值保持一致(有测试锁死) */
export const DEFAULT_BASE_URL = 'https://betterbagsmm.com';

/** IndexNow key 文件名格式:8-128 位,a-zA-Z0-9 与连字符 */
export const KEY_FILE_PATTERN = /^[A-Za-z0-9-]{8,128}\.txt$/;

/**
 * 从文件条目列表中找出唯一的 IndexNow key
 *
 * 双重守卫:文件名匹配 KEY_FILE_PATTERN,且内容 trim 后与文件名
 * (去掉 .txt)一致——这正是搜索引擎验证 key 的方式。
 * llms.txt 等其他 .txt 文件天然被排除。
 *
 * @param {Array<{ name: string, content: string }>} entries
 * @returns {{ key: string, fileName: string }}
 */
export function findKeyEntry(entries) {
  const candidates = entries.filter((entry) => {
    if (!KEY_FILE_PATTERN.test(entry.name)) {
      return false;
    }
    const key = entry.name.slice(0, -'.txt'.length);
    return entry.content.trim() === key;
  });

  if (candidates.length === 0) {
    throw new Error(
      '未找到合法的 IndexNow key 文件(要求 public/{key}.txt 且内容与文件名一致)'
    );
  }

  if (candidates.length > 1) {
    const names = candidates.map((candidate) => candidate.name).join(', ');
    throw new Error(`发现多个 IndexNow key 文件,存在歧义: ${names}`);
  }

  const { name } = candidates[0];
  return { key: name.slice(0, -'.txt'.length), fileName: name };
}

/**
 * 扫描 public/ 目录,自动发现 IndexNow key 文件
 *
 * @param {string} publicDir public 目录绝对路径
 * @returns {{ key: string, fileName: string }}
 */
export function discoverKey(publicDir) {
  const entries = readdirSync(publicDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.txt'))
    .map((dirent) => ({
      name: dirent.name,
      content: readFileSync(join(publicDir, dirent.name), 'utf-8'),
    }));

  return findKeyEntry(entries);
}

/** 最小 XML 实体解码(&amp; 必须最后,避免二次解码) */
function decodeXmlEntities(text) {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

/**
 * 从 sitemap XML 中提取全部 loc(去重、保序)
 *
 * 该 XML 由 Next.js 从 app/sitemap.ts 机器生成,格式固定:
 * 无 CDATA、无注释、无嵌套 loc;hreflang alternates 的 URL 在
 * xhtml:link 的 href 属性里,不会被 loc 正则误抓。
 *
 * @param {string} xml sitemap.xml 原文
 * @returns {string[]}
 */
export function parseSitemapUrls(xml) {
  const urls = [];
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = decodeXmlEntities(match[1]).trim();
    if (url.length > 0) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

/**
 * 校验每个 URL 的 host 与预期一致(IndexNow 422 的前置防线)
 *
 * @param {string[]} urls
 * @param {string} expectedHost 裸域名,如 betterbagsmm.com
 */
export function assertUrlsMatchHost(urls, expectedHost) {
  const mismatched = urls.filter((url) => {
    try {
      return new URL(url).host !== expectedHost;
    } catch {
      return true;
    }
  });

  if (mismatched.length > 0) {
    throw new Error(
      `以下 URL 与 host ${expectedHost} 不匹配,IndexNow 会拒绝(422): ${mismatched.join(', ')}`
    );
  }
}

/**
 * 构造 IndexNow 批量提交 payload
 *
 * @param {{ baseUrl: string, key: string, urls: string[] }} params
 * @returns {{ host: string, key: string, keyLocation: string, urlList: string[] }}
 */
export function buildPayload({ baseUrl, key, urls }) {
  return {
    host: new URL(baseUrl).host,
    key,
    keyLocation: `${baseUrl}/${key}.txt`,
    urlList: [...urls],
  };
}

const STATUS_MEANINGS = {
  200: {
    ok: true,
    label: 'OK',
    hint: '提交成功',
  },
  202: {
    ok: true,
    label: 'Accepted (key validation pending)',
    hint: '已接收,搜索引擎稍后抓取 key 文件完成验证,首次提交出现 202 属正常',
  },
  400: {
    ok: false,
    label: 'Bad Request',
    hint: 'payload 格式错误,检查提交的 JSON 结构',
  },
  403: {
    ok: false,
    label: 'Forbidden',
    hint: 'key 无效: 引擎取不到 {key}.txt 或内容不符,可 curl https://<host>/<key>.txt 自查',
  },
  422: {
    ok: false,
    label: 'Unprocessable Entity',
    hint: 'urlList 与 host 不匹配,或 keyLocation 跨域',
  },
  429: {
    ok: false,
    label: 'Too Many Requests',
    hint: '被判定为 spam,等待后重试,勿人工连发;下次部署会全量补推',
  },
};

/**
 * 将 IndexNow 响应码映射为可读语义
 *
 * @param {number} status HTTP 状态码
 * @returns {{ ok: boolean, label: string, hint: string }}
 */
export function interpretStatus(status) {
  return (
    STATUS_MEANINGS[status] ?? {
      ok: false,
      label: `Unexpected status ${status}`,
      hint: '网络或服务端异常,可稍后手动重跑(npm run indexnow 或 workflow_dispatch)',
    }
  );
}

/**
 * 向 IndexNow 端点批量提交 URL
 *
 * 提交一次即共享给所有参与引擎,无需多端点分发。
 * 失败不在此层重试:全量推送模式下,下一次部署天然自愈。
 *
 * @param {{ payload: object, endpoint?: string, fetchImpl?: typeof fetch }} params
 * @returns {Promise<{ status: number, ok: boolean, label: string, hint: string }>}
 */
export async function submitUrls({
  payload,
  endpoint = INDEXNOW_ENDPOINT,
  fetchImpl = globalThis.fetch,
}) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const { ok, label, hint } = interpretStatus(response.status);
  return { status: response.status, ok, label, hint };
}
