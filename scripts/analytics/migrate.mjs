/**
 * 埋点表结构的建表脚本
 *
 * 用法:
 *   npm run analytics:migrate                 按 schema.sql 建表(可重复跑)
 *   npm run analytics:migrate -- --dry-run    只打印将要执行的语句
 *
 * schema.sql 里全部是 IF NOT EXISTS,所以这个脚本是幂等的,
 * 随时重跑都安全。
 *
 * DATABASE_URL 优先取进程环境,其次取 .env.local —— 后者是
 * `vercel env pull` 之后的本地文件。任何失败路径退出码都是 1,供 CI 感知。
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { neon } from '@neondatabase/serverless';

import { describeStatement, loadEnvLocal, splitStatements } from './lib.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, '..', '..');

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
  });

  const envLocal = loadEnvLocal(PROJECT_ROOT);
  const databaseUrl = process.env.DATABASE_URL || envLocal.DATABASE_URL || '';

  const schema = readFileSync(join(SCRIPT_DIR, 'schema.sql'), 'utf8');
  const statements = splitStatements(schema);

  if (values['dry-run']) {
    console.log(`dry-run: 共 ${statements.length} 条语句,未执行`);
    for (const statement of statements) {
      console.log(`  ${describeStatement(statement)}`);
    }
    return;
  }

  if (!databaseUrl) {
    console.error('DATABASE_URL 未配置。先在 Vercel 上连好 Neon,再跑 vercel env pull');
    process.exitCode = 1;
    return;
  }

  const sql = neon(databaseUrl);

  console.log(`migrate: 共 ${statements.length} 条语句`);

  for (const statement of statements) {
    process.stdout.write(`  ${describeStatement(statement)} ... `);
    await sql.query(statement);
    console.log('ok');
  }

  console.log('done');
}

main().catch((error) => {
  console.error(`建表失败: ${error.message}`);
  process.exitCode = 1;
});
