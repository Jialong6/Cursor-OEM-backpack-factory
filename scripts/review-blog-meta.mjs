/**
 * 一次性脚本:博客 3 篇 x 12 语的 title/excerpt 交叉终审
 * (评审跨语言一致性:事实、数字、品牌名、语义对齐;输出报告)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { callGeminiJson, ROOT, GEMINI_MODEL } from './translate/lib/gemini.mjs';

const SLUGS = [
  'factory-tour-one-day-myanmar',
  'danshin-needle-control-myanmar',
  'ipack-third-party-inspection-myanmar',
];

function readPost(slug) {
  const src = readFileSync(resolve(ROOT, `lib/blog-posts/${slug}/index.ts`), 'utf8')
    .replace(/^import type[^\n]*\n/m, '')
    .replace('const post: BlogPost =', 'const post =')
    .replace(/export default post;\s*$/m,
      'console.log(JSON.stringify({ slug: post.slug, title: post.title, excerpt: post.excerpt }));');
  return JSON.parse(execFileSync('node', ['--input-type=module', '-e', src], { encoding: 'utf8' }));
}

const posts = SLUGS.map(readPost);

const SYSTEM = [
  'You are a multilingual localization QA lead. You receive blog post titles and excerpts in 12 languages (ja is the original; zh/en are reference translations).',
  'For each post, check every non-ja language against ja/en:',
  '- factual drift: numbers, times, claims changed or invented',
  '- brand names (Better Bags Myanmar, I-pack, Anello) altered or translated',
  '- meaning divergence in the title promise or excerpt summary',
  'Ignore stylistic adaptation. Return ONLY JSON: array of { slug, locale, field, severity: "high"|"medium"|"low", issue } for real problems. Empty array if none.',
].join('\n');

const result = await callGeminiJson({
  system: SYSTEM,
  user: JSON.stringify(posts, null, 2),
  temperature: 0.1,
});

const flagged = Array.isArray(result) ? result : [];
const lines = [
  '# Blog meta cross-language review (3 posts x 12 locales)',
  '',
  `- Model: ${GEMINI_MODEL}`,
  `- Flagged: ${flagged.length}`,
  '',
  ...flagged.flatMap((f) => [
    `### [${f.severity}] ${f.slug} / ${f.locale} / ${f.field}`,
    '',
    `- issue: ${f.issue}`,
    '',
  ]),
  ...(flagged.length === 0 ? ['None.', ''] : []),
];
writeFileSync(resolve(ROOT, 'docs/i18n/reports/review-blog-meta.md'), `${lines.join('\n')}\n`, 'utf8');
console.log(`flagged: ${flagged.length} -> docs/i18n/reports/review-blog-meta.md`);
