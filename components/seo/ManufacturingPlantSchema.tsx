'use client';

import { useTranslations, useLocale } from 'next-intl';

/**
 * 工厂基本信息常量
 * 供组件和测试共用
 */
export const FACTORY_INFO = {
  name: 'Better Bags Myanmar Company Limited',
  url: 'https://betterbagsmyanmar.com',
  logo: 'https://betterbagsmyanmar.com/logo.png',
  foundingDate: '2003',
  telephone: '+1-814-880-1463',
  email: 'jay@biteerbags.com',
  address: {
    streetAddress: 'Plot No. 48, Myay Taing Block No.24, Ngwe Pin Lai Industrial Zone',
    addressLocality: 'Yangon',
    addressCountry: 'MM',
    postalCode: '11000',
  },
  geo: {
    latitude: 16.871311,
    longitude: 96.199379,
  },
  numberOfEmployees: {
    minValue: 800,
    maxValue: 1000,
  },
  credentials: ['ISO 9001', 'OEKO-TEX', 'GRS', 'GOTS'],
};

/**
 * ManufacturingPlantSchema 组件属性
 */
interface ManufacturingPlantSchemaProps {
  /**
   * 可选的自定义描述，覆盖从翻译获取的默认描述
   */
  customDescription?: string;
}

/**
 * 制造工厂 JSON-LD 结构化数据组件
 *
 * 生成符合 Schema.org ManufacturingBusiness 规范的 JSON-LD 数据，
 * 用于增强 SEO 和 Google 搜索结果展示。
 *
 * 功能：
 * - 使用 @type: ManufacturingBusiness（Organization 的子类型）
 * - 包含完整的工厂信息：地址、地理坐标、联系方式、员工数量
 * - 包含服务目录和认证信息
 * - 支持多语言描述（通过 useTranslations 获取）
 * - inLanguage 字段自动匹配当前 locale
 *
 * 安全说明：
 * - JSON-LD 内容来自可信来源（FACTORY_INFO 常量和翻译文件）
 * - 不接受用户输入，无 XSS 风险
 *
 * 验证需求：7.2 (Organization JSON-LD)
 *
 * @example
 * ```tsx
 * // 基本用法（使用翻译的描述）
 * <ManufacturingPlantSchema />
 *
 * // 自定义描述
 * <ManufacturingPlantSchema customDescription="Custom description here" />
 * ```
 */
export default function ManufacturingPlantSchema({
  customDescription,
}: ManufacturingPlantSchemaProps) {
  const t = useTranslations('about');
  const locale = useLocale();

  // 获取多语言描述：优先使用自定义描述，否则使用翻译
  const description = customDescription || t('mission.desc');

  // 构建 ManufacturingBusiness JSON-LD 结构
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ManufacturingBusiness',
    '@id': `${FACTORY_INFO.url}/#organization`,
    name: FACTORY_INFO.name,
    url: FACTORY_INFO.url,
    logo: FACTORY_INFO.logo,
    description,
    inLanguage: locale,
    foundingDate: FACTORY_INFO.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: FACTORY_INFO.address.streetAddress,
      addressLocality: FACTORY_INFO.address.addressLocality,
      addressCountry: FACTORY_INFO.address.addressCountry,
      postalCode: FACTORY_INFO.address.postalCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: FACTORY_INFO.geo.latitude,
      longitude: FACTORY_INFO.geo.longitude,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: FACTORY_INFO.telephone,
      contactType: 'Customer Service',
      email: FACTORY_INFO.email,
      availableLanguage: ['en', 'zh', 'ja'],
    },
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: FACTORY_INFO.numberOfEmployees.minValue,
      maxValue: FACTORY_INFO.numberOfEmployees.maxValue,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Backpack Manufacturing Services',
      itemListElement: [
        { '@type': 'Offer', name: 'OEM Manufacturing' },
        { '@type': 'Offer', name: 'ODM Manufacturing' },
        { '@type': 'Offer', name: 'Sample Development' },
        { '@type': 'Offer', name: 'Quality Control' },
        { '@type': 'Offer', name: 'Packaging & Shipping' },
      ],
    },
    hasCredential: FACTORY_INFO.credentials,
  };

  // 安全：JSON.stringify 的输出是安全的 JSON 字符串，
  // 来源是可信的常量和翻译文件，不存在 XSS 风险
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  );
}
