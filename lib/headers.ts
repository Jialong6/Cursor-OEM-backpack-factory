/**
 * next.config headers 规则(纯数据模块,可单测)
 *
 * GSC「已抓取-尚未编入索引」出现 /_next/static/css/*.css:构建产物不应进
 * 搜索索引,但 robots.txt 不能 Disallow /_next/(Google 渲染页面需要抓
 * CSS/JS),正确做法是 X-Robots-Tag: noindex 响应头——不挡抓取、只挡收录。
 *
 * 范围仅限 /_next/static;不含 /_next/image(否则损害 Google 图片收录)。
 * Cache-Control 不在此设置:Next 对 immutable 哈希资源会忽略自定义值。
 *
 * 注意:本模块被 next.config.ts 以相对路径引用,不能依赖 '@/' 别名,
 * 也不能引入任何 'use client' 模块。
 */
import type { NextConfig } from 'next';

type HeaderRule = Awaited<ReturnType<NonNullable<NextConfig['headers']>>>[number];

export const staticAssetsNoindexRule: HeaderRule = {
  source: '/_next/static/:path*',
  headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
};

/** next.config headers() 的唯一入口 */
export function buildHeaders(): HeaderRule[] {
  return [staticAssetsNoindexRule];
}
