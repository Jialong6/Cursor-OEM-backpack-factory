/**
 * 建表脚本的纯逻辑层
 *
 * 入口只管 IO 与编排,把可测的部分放这里 —— 与 scripts/indexnow/ 同构。
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 解析 .env.local
 *
 * 手写而不是引 dotenv:全项目的脚本都是零依赖的,
 * scripts/translate/lib/gemini.mjs 里已经有一份同样的实现。
 */
export function loadEnvLocal(root) {
  let text;

  try {
    text = readFileSync(resolve(root, '.env.local'), 'utf8');
  } catch {
    return {};
  }

  const env = {};

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');

    if (eq === -1) {
      continue;
    }

    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return env;
}

/**
 * 把 schema.sql 拆成一条条语句
 *
 * Neon 的 HTTP 驱动一次只接受一条语句,所以必须自己拆。
 * 先剥掉整行注释,再按分号切 —— 本文件里没有函数体或字符串里的分号,
 * 这个朴素做法足够;真要写存储过程时再换正经解析器。
 */
export function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

/** 给每条语句取一个可读的名字,用于打日志 */
export function describeStatement(statement) {
  const match = statement.match(
    /CREATE\s+(TABLE|INDEX)(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-z_]+)/i
  );

  return match ? `${match[1].toLowerCase()} ${match[2]}` : statement.slice(0, 40);
}
