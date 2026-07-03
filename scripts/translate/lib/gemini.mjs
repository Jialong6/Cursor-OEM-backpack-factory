/**
 * Gemini API 客户端(翻译工具链专用,零依赖)
 *
 * - 从 .env.local 读取 GEMINI_API_KEY / GEMINI_MODEL(不依赖 dotenv)
 * - REST v1beta generateContent,支持 JSON 结构化输出
 * - 429/5xx 指数退避重试
 *
 * 仅供 scripts/translate/ 下的本地脚本使用,与网站运行时无关。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

// Node 的全局 fetch 不读 HTTP(S)_PROXY 环境变量(curl 读)。Gemini API 有地区
// 限制,必须经系统代理出网,故显式接上代理;无代理环境则直连。
const PROXY_URL =
  process.env.HTTPS_PROXY || process.env.https_proxy ||
  process.env.HTTP_PROXY || process.env.http_proxy || '';
const dispatcher = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;

/** 手动解析 .env.local(KEY=VALUE 行,忽略注释与空行) */
function loadEnvLocal() {
  const envPath = resolve(ROOT, '.env.local');
  let text;
  try {
    text = readFileSync(envPath, 'utf8');
  } catch {
    return {};
  }
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

const envLocal = loadEnvLocal();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || envLocal.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || envLocal.GEMINI_MODEL || 'gemini-3.1-pro-preview';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 调用 Gemini generateContent
 *
 * @param {object} opts
 * @param {string} opts.system - 系统指令(角色、规则、术语约束)
 * @param {string} opts.user - 用户内容(待翻译/待审校的 JSON 或文本)
 * @param {boolean} [opts.json=false] - 是否要求 JSON 结构化输出
 * @param {number} [opts.temperature=0.3] - 采样温度(翻译任务偏低)
 * @param {number} [opts.maxRetries=5]
 * @returns {Promise<string>} 模型输出文本
 */
export async function callGemini({ system, user, json = false, temperature = 0.3, maxRetries = 5 }) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY missing: set it in .env.local');
  }

  const body = {
    ...(system
      ? { systemInstruction: { parts: [{ text: system }] } }
      : {}),
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 65536,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.min(60_000, 2_000 * 2 ** (attempt - 1));
      process.stderr.write(`  retry ${attempt}/${maxRetries} in ${backoff / 1000}s (${lastError})\n`);
      await sleep(backoff);
    }
    let res;
    try {
      res = await undiciFetch(`${API_BASE}/models/${GEMINI_MODEL}:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        ...(dispatcher ? { dispatcher } : {}),
      });
    } catch (err) {
      lastError = `network error: ${err.message}`;
      continue;
    }

    if (res.status === 429 || res.status >= 500) {
      lastError = `HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 500)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    const finishReason = candidate?.finishReason ?? 'unknown';
    if (!text) {
      lastError = `empty response (finishReason=${finishReason})`;
      continue;
    }
    // 非正常收尾(MAX_TOKENS/SAFETY/RECITATION 等)意味着输出被截断,重试
    if (finishReason !== 'STOP') {
      lastError = `truncated response (finishReason=${finishReason}, thoughts=${data.usageMetadata?.thoughtsTokenCount ?? 0}, out=${data.usageMetadata?.candidatesTokenCount ?? 0})`;
      continue;
    }
    return text;
  }
  throw new Error(`Gemini failed after ${maxRetries} retries: ${lastError}`);
}

/**
 * 从文本中提取第一个括号配平的 JSON 对象
 * (模型偶发在结尾多写一个 } 或附加围栏/注释;字符串内的 {placeholder}
 * 花括号按 JSON 字符串语义跳过,不参与配平)
 */
function extractFirstJson(text) {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * 调用 Gemini 并把输出解析为 JSON,解析失败时自动重试一次
 * @returns {Promise<any>}
 */
export async function callGeminiJson(opts) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callGemini({ ...opts, json: true });
    // 依次尝试:原文 → 去 markdown 围栏 → 深度扫描截取首个配平对象
    const stripped = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    for (const candidate of [text, stripped, extractFirstJson(stripped)]) {
      if (!candidate) continue;
      try {
        return JSON.parse(candidate);
      } catch {
        // try next candidate
      }
    }
    if (attempt === 1) {
      throw new Error(`Gemini returned non-JSON output (${text.length} chars): ...${text.slice(-200)}`);
    }
  }
  throw new Error('unreachable');
}

export { ROOT };
