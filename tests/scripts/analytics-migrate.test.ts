/**
 * scripts/analytics/lib.mjs —— 建表脚本的纯逻辑
 *
 * 顺带守住 schema.sql 本身的两条约定:全部 IF NOT EXISTS(所以脚本可以
 * 随时重跑),以及不存明文 IP(这是对访客的公开承诺,写在 12 个语言版的
 * 隐私政策里)。
 */
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error -- 纯 JS 脚本模块,无类型声明
import { describeStatement, splitStatements } from '../../scripts/analytics/lib.mjs';

const SCHEMA = readFileSync(
  join(process.cwd(), 'scripts/analytics/schema.sql'),
  'utf8'
);

describe('splitStatements', () => {
  test('剥掉整行注释', () => {
    const statements = splitStatements('-- 说明\nCREATE TABLE a (id int);');

    expect(statements).toHaveLength(1);
    expect(statements[0]).not.toContain('说明');
  });

  test('按分号拆成多条', () => {
    expect(splitStatements('CREATE TABLE a (id int);\nCREATE TABLE b (id int);')).toHaveLength(2);
  });

  test('忽略空白片段', () => {
    expect(splitStatements(';;\n\n;')).toEqual([]);
  });
});

describe('describeStatement', () => {
  test('认出建表', () => {
    expect(describeStatement('CREATE TABLE IF NOT EXISTS page_views (id text)')).toBe(
      'table page_views'
    );
  });

  test('认出建索引', () => {
    expect(describeStatement('CREATE INDEX IF NOT EXISTS events_name_idx ON events (name)')).toBe(
      'index events_name_idx'
    );
  });
});

describe('schema.sql 的约定', () => {
  const statements = splitStatements(SCHEMA) as string[];

  test('四张表都在', () => {
    const names = statements.map(describeStatement);

    expect(names).toContain('table page_views');
    expect(names).toContain('table events');
    expect(names).toContain('table section_dwell');
    expect(names).toContain('table ingested_batches');
  });

  test('每条建表与建索引都带 IF NOT EXISTS,脚本才能随时重跑', () => {
    for (const statement of statements) {
      if (/^CREATE\s+(TABLE|INDEX)/i.test(statement)) {
        expect(statement).toMatch(/IF NOT EXISTS/i);
      }
    }
  });

  test('没有任何存明文 IP 的列', () => {
    const lowered = SCHEMA.toLowerCase();

    expect(lowered).not.toMatch(/^\s*ip\s+/m);
    expect(lowered).not.toContain('ip_address');
    expect(lowered).not.toContain('client_ip');
  });

  test('访客标识列是定长哈希', () => {
    expect(SCHEMA).toMatch(/visitor_hash\s+char\(64\)/);
  });

  test('板块停留是独立表,带复合主键,增量才合并得起来', () => {
    expect(SCHEMA).toMatch(/PRIMARY KEY \(page_view_id, section_id\)/);
  });
});
