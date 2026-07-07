/**
 * 博客元数据组装脚本(阶段 8):
 * 把翻译代理产出的 lib/blog-posts/{slug}/.meta.{locale}.json 合并进
 * 该文章的 index.ts(title/excerpt/category/tags 的 LocalizedField),
 * 并按目录中实际存在的 content.{locale}.ts 重建 contentLoaders。
 *
 * index.ts 由本脚本整体重新生成(结构固定),合并后删除 .meta 分片。
 */

import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(import.meta.dirname, '..');
const SLUGS = [
  'factory-tour-one-day-myanmar',
  'danshin-needle-control-myanmar',
  'ipack-third-party-inspection-myanmar',
];
// 输出顺序:基准语在前,其余按站点 locale 顺序
const LOCALE_ORDER = ['ja', 'zh', 'en', 'de', 'nl', 'fr', 'pt', 'es', 'zh-tw', 'ru', 'my', 'ko'];

/** 通过 node 求值(剥掉 TS 注解)读取现有 index.ts 的 post 对象 */
function readExistingPost(indexPath) {
  const src = readFileSync(indexPath, 'utf8')
    .replace(/^import type[^\n]*\n/m, '')
    .replace('const post: BlogPost =', 'const post =')
    .replace(/export default post;\s*$/m,
      'console.log(JSON.stringify({ ...post, contentLoaders: undefined }));');
  return JSON.parse(
    execFileSync('node', ['--input-type=module', '-e', src], { encoding: 'utf8' })
  );
}

/** 把值序列化为 TS 字面量(单层缩进控制,内容走 JSON.stringify 保证转义正确) */
function ts(value, indent) {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : ' '.repeat(indent) + line))
    .join('\n');
}

for (const slug of SLUGS) {
  const dir = resolve(ROOT, `lib/blog-posts/${slug}`);
  const post = readExistingPost(resolve(dir, 'index.ts'));

  // 合并 .meta.{locale}.json
  const metaFiles = readdirSync(dir).filter((f) => /^\.meta\.[a-z-]+\.json$/.test(f));
  for (const file of metaFiles) {
    const locale = file.replace(/^\.meta\./, '').replace(/\.json$/, '');
    const meta = JSON.parse(readFileSync(resolve(dir, file), 'utf8'));
    for (const field of ['title', 'excerpt', 'category', 'tags']) {
      if (meta[field] !== undefined) {
        post[field] = post[field] ?? {};
        post[field][locale] = meta[field];
      }
    }
  }

  // 按 LOCALE_ORDER 重排每个 LocalizedField 的键序
  for (const field of ['title', 'excerpt', 'category', 'tags']) {
    if (!post[field]) continue;
    const ordered = {};
    for (const l of LOCALE_ORDER) {
      if (post[field][l] !== undefined) ordered[l] = post[field][l];
    }
    post[field] = ordered;
  }

  // contentLoaders 按目录实际存在的 content.{locale}.ts 生成
  const contentLocales = LOCALE_ORDER.filter((l) =>
    existsSync(resolve(dir, `content.${l}.ts`))
  );

  const lines = [
    `import type { BlogPost } from '../types';`,
    '',
    'const post: BlogPost = {',
    `  id: ${ts(post.id, 2)},`,
    `  slug: ${ts(post.slug, 2)},`,
    `  title: ${ts(post.title, 2)},`,
    `  excerpt: ${ts(post.excerpt, 2)},`,
    '  // 正文按语言拆分为 content.{locale}.ts,经动态 import 加载;',
    '  // 显式列出(不用模板字符串路径)保证打包器可静态分析',
    '  contentLoaders: {',
    ...contentLocales.map((l) =>
      l === 'zh-tw'
        ? `    'zh-tw': () => import('./content.zh-tw'),`
        : `    ${l}: () => import('./content.${l}'),`
    ),
    '  },',
    `  date: ${ts(post.date, 2)},`,
    `  thumbnail: ${ts(post.thumbnail, 2)},`,
    `  category: ${ts(post.category, 2)},`,
    ...(post.authorId ? [`  authorId: ${ts(post.authorId, 2)},`] : []),
    ...(post.tags ? [`  tags: ${ts(post.tags, 2)},`] : []),
    '};',
    '',
    'export default post;',
    '',
  ];

  writeFileSync(resolve(dir, 'index.ts'), lines.join('\n'), 'utf8');
  for (const file of metaFiles) rmSync(resolve(dir, file));
  console.log(
    `${slug}: meta ${Object.keys(post.title).length} locales, content ${contentLocales.length} locales (${metaFiles.length} parts merged)`
  );
}
console.log('done');
