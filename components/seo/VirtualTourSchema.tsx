'use client';

import { FACTORY_INFO } from './ManufacturingPlantSchema';

/**
 * VirtualTourSchema 组件属性
 */
interface VirtualTourSchemaProps {
  /** 当前语言,用于构建 url 与 inLanguage */
  readonly locale: string;
  /** 页面标题,注入 JSON-LD 的 name 字段 */
  readonly name: string;
  /** 页面简介,注入 JSON-LD 的 description 字段 */
  readonly description: string;
}

/**
 * 虚拟看厂预约页 Service JSON-LD 结构化数据组件
 *
 * 将"线上虚拟看厂"标注为公司提供的免费服务(Schema.org Service),
 * provider 通过 @id 指向全站统一的 Organization 实体(与根布局的
 * ManufacturingPlantSchema 逐字节一致),帮助搜索引擎与 AI 引擎将
 * 本页识别为预约虚拟看厂的权威入口。
 *
 * 设计说明:
 * - 与 FactSheetSchema 同款:'use client' + 复用 FACTORY_INFO 常量
 * - 不用 Event 类型:tour 无固定日程,由访客在 Cal.com 日历自选时段
 * - hoursAvailable 声明可约时段 Mon-Sat 07:30-17:00(缅甸时间,
 *   时区语境由 provider 的工厂地址提供)
 *
 * 安全说明:
 * - JSON-LD 内容来自可信来源(FACTORY_INFO 常量与页面翻译)
 * - 所有值通过 JSON.stringify 安全序列化,无 XSS 风险
 */
export default function VirtualTourSchema({
  locale,
  name,
  description,
}: VirtualTourSchemaProps) {
  const url = `${FACTORY_INFO.url}/${locale}/virtual-factory-tour`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url,
    url,
    inLanguage: locale,
    name,
    description,
    // 服务名保留英文:跨语言实体对齐(与 ManufacturingPlantSchema 的
    // hasOfferCatalog 同一约定)
    serviceType: 'Virtual Factory Tour',
    isAccessibleForFree: true,
    provider: {
      // 与根布局 ManufacturingPlantSchema 的 Organization @id 逐字节一致
      '@id': `${FACTORY_INFO.url}/#organization`,
    },
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      opens: '07:30',
      closes: '17:00',
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
