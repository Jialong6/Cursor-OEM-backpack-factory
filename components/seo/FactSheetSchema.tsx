'use client';

import { FACTORY_INFO } from '@/lib/factory-info';

/**
 * Fact Sheet 页面 JSON-LD 的 dateModified(公司事实的最后核实日期)
 *
 * 单独导出为常量,便于测试断言与后续统一维护。
 */
export const FACT_SHEET_DATE_MODIFIED = '2026-07-01';

/**
 * FactSheetSchema 组件属性
 */
interface FactSheetSchemaProps {
  /** 当前语言,用于构建 url 与 inLanguage */
  readonly locale: string;
  /** 可选页面标题,注入 JSON-LD 的 name 字段 */
  readonly name?: string;
  /** 可选页面描述,注入 JSON-LD 的 description 字段 */
  readonly description?: string;
}

/**
 * AboutPage JSON-LD 结构化数据组件(GEO / AI 搜索优化)
 *
 * 为公司事实页生成符合 Schema.org AboutPage 规范的 JSON-LD,
 * 通过 mainEntity 指向全站统一的 Organization 实体(@id 与根布局的
 * ManufacturingPlantSchema 逐字节一致),帮助生成式搜索引擎将本页面
 * 识别为公司数据的权威来源。
 *
 * 设计说明:
 * - 与 BlogPostingSchema 同款:'use client' + 复用 lib/factory-info 常量
 * - url 指向具体语言版本:${FACTORY_INFO.url}/${locale}/fact-sheet
 * - dateModified 使用导出常量 FACT_SHEET_DATE_MODIFIED
 *
 * 安全说明:
 * - JSON-LD 内容来自可信来源(FACTORY_INFO 常量与页面 props)
 * - 所有值通过 JSON.stringify 安全序列化,无 XSS 风险
 * - 此模式与 ManufacturingPlantSchema.tsx / BlogPostingSchema.tsx 保持一致
 */
export default function FactSheetSchema({
  locale,
  name,
  description,
}: FactSheetSchemaProps) {
  const url = `${FACTORY_INFO.url}/${locale}/fact-sheet`;

  // 安全:所有数据来自可信来源(FACTORY_INFO 常量与页面翻译),
  // JSON.stringify 确保输出安全,与 ManufacturingPlantSchema 模式一致
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': url,
    url,
    inLanguage: locale,
    dateModified: FACT_SHEET_DATE_MODIFIED,
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    mainEntity: {
      // 与根布局 ManufacturingPlantSchema 的 Organization @id 逐字节一致,
      // 使 AboutPage 与全站主体实体关联(跨页面实体对齐)
      '@id': `${FACTORY_INFO.url}/#organization`,
    },
  };

  // 与 ManufacturingPlantSchema.tsx 相同的安全 JSON-LD 渲染模式
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}
