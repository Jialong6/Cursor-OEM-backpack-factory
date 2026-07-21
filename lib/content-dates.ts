/**
 * 静态页面内容的真实最后修改日期(YYYY-MM-DD)
 *
 * 用途:app/sitemap.ts 的 lastmod 与页面 JSON-LD 的 dateModified 共用,
 * 取代 new Date() —— 后者使每次部署全站 lastmod 刷新为构建时刻,
 * 与内容是否真实变更无关,损耗 Google 抓取信任。
 *
 * 必须保持纯数据模块(无 'use client'、无组件依赖),server 侧
 * sitemap 才能安全导入;跨 'use client' 边界取值曾导致
 * BreadcrumbList 输出 "undefined/zh" 线上事故(见 tests/seo/server-safe-imports.test.ts)。
 *
 * 维护规则:页面内容(文案/区块/数据)有实质修改时,手工更新对应常量。
 * 初始值依据 git log 中最后一次实质内容提交:
 * - HOME:         2026-07-08 Contact 区 Google Maps 嵌入 + WhatsApp 链接修复
 * - GLOSSARY:     2026-07-08 页面增补 dateModified/Breadcrumb(词条数据本体 2026-02-04)
 * - FACT_SHEET:   2026-07-01 公司事实最后核实日(原 FactSheetSchema 常量迁入)
 * - VIRTUAL_TOUR: 2026-07-08 落地页上线及链接修复
 */

export const HOME_DATE_MODIFIED = '2026-07-08';

export const GLOSSARY_DATE_MODIFIED = '2026-07-08';

export const FACT_SHEET_DATE_MODIFIED = '2026-07-01';

export const VIRTUAL_TOUR_DATE_MODIFIED = '2026-07-08';
