/**
 * SEO 结构化数据组件
 *
 * 提供 Schema.org JSON-LD 结构化数据组件，用于增强 SEO 和搜索结果展示。
 */

export { default as ManufacturingPlantSchema } from './ManufacturingPlantSchema';
// FACTORY_INFO 从纯数据模块 re-export(而非 'use client' 组件文件),
// 保证 server/client 两侧导入拿到的都是真实对象
export { FACTORY_INFO } from '@/lib/factory-info';
export { default as FAQPageSchema } from './FAQPageSchema';
export type { FAQSection } from './FAQPageSchema';
export { default as GlossarySchema } from './GlossarySchema';
export { default as BlogPostingSchema } from './BlogPostingSchema';
export { default as FactSheetSchema, FACT_SHEET_DATE_MODIFIED } from './FactSheetSchema';
export { default as BreadcrumbSchema } from './BreadcrumbSchema';
export type { BreadcrumbSchemaItem } from './BreadcrumbSchema';
export { default as VirtualTourSchema } from './VirtualTourSchema';
