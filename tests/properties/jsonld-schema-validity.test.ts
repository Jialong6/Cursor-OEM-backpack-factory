import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 属性测试：JSON-LD Schema 有效性
 *
 * **Feature: backpack-oem-website, Property 10: JSON-LD Schema Validity**
 *
 * 正确性属性：ManufacturingBusiness 和 FAQPage 结构化数据必须包含所有必需字段，
 * 格式符合 Schema.org 规范。
 *
 * 验证需求：7.2 (Organization JSON-LD), 10.5 (FAQPage JSON-LD)
 */

// 支持的语言列表
const supportedLocales = ['en', 'zh', 'ja', 'ko', 'th', 'vi', 'de', 'fr', 'es', 'ar'] as const;
type Locale = (typeof supportedLocales)[number];

// 工厂基本信息常量（供组件和测试共用）
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
 * 验证 ManufacturingBusiness JSON-LD 结构
 */
interface ManufacturingBusinessSchema {
  '@context': string;
  '@type': string;
  '@id'?: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  inLanguage?: string;
  foundingDate: string;
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
    postalCode?: string;
  };
  geo: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  contactPoint: {
    '@type': string;
    telephone: string;
    contactType: string;
    email: string;
    availableLanguage?: string[];
  };
  numberOfEmployees: {
    '@type': string;
    minValue: number;
    maxValue: number;
  };
  hasOfferCatalog?: {
    '@type': string;
    name: string;
    itemListElement: Array<{
      '@type': string;
      name: string;
    }>;
  };
  hasCredential?: string[];
}

/**
 * 验证 FAQPage JSON-LD 结构
 */
interface FAQPageSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

/**
 * 生成 ManufacturingBusiness JSON-LD（模拟组件行为）
 */
function generateManufacturingBusinessSchema(
  locale: Locale,
  description: string
): ManufacturingBusinessSchema {
  return {
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
      ],
    },
    hasCredential: FACTORY_INFO.credentials,
  };
}

/**
 * 生成 FAQPage JSON-LD（模拟组件行为）
 */
function generateFAQPageSchema(
  sections: Array<{ title: string; items: Array<{ q: string; a: string }> }>
): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.flatMap((section) =>
      section.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      }))
    ),
  };
}

/**
 * 验证 URL 格式
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证日期格式（YYYY 或 YYYY-MM-DD）
 */
function isValidDateFormat(date: string): boolean {
  return /^\d{4}(-\d{2}-\d{2})?$/.test(date);
}

/**
 * 验证 ISO 3166-1 alpha-2 国家代码
 */
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * 验证经纬度范围
 */
function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 验证电话号码格式（国际格式）
 */
function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[\d\s\-().]+$/.test(phone);
}

describe('Property 10: JSON-LD Schema Validity', () => {
  describe('ManufacturingBusiness Schema', () => {
    /**
     * 属性测试：必需字段存在性
     */
    it('对于任意语言，ManufacturingBusiness 应该包含所有必需字段', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...supportedLocales),
          fc.string({ minLength: 10, maxLength: 500 }),
          (locale, description) => {
            const schema = generateManufacturingBusinessSchema(locale, description);

            // 验证必需字段存在
            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('ManufacturingBusiness');
            expect(schema.name).toBeDefined();
            expect(schema.url).toBeDefined();
            expect(schema.description).toBeDefined();
            expect(schema.address).toBeDefined();
            expect(schema.contactPoint).toBeDefined();

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 属性测试：URL 格式有效性
     */
    it('所有 URL 字段应该是有效的 URL 格式', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(isValidUrl(schema.url)).toBe(true);
          expect(isValidUrl(schema.logo)).toBe(true);
          if (schema['@id']) {
            expect(isValidUrl(schema['@id'])).toBe(true);
          }

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：日期格式有效性
     */
    it('foundingDate 应该是有效的日期格式', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(isValidDateFormat(schema.foundingDate)).toBe(true);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：PostalAddress 嵌套结构
     */
    it('address 应该是有效的 PostalAddress 结构', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(schema.address['@type']).toBe('PostalAddress');
          expect(schema.address.streetAddress).toBeDefined();
          expect(schema.address.addressLocality).toBeDefined();
          expect(isValidCountryCode(schema.address.addressCountry)).toBe(true);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：GeoCoordinates 嵌套结构
     */
    it('geo 应该是有效的 GeoCoordinates 结构', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(schema.geo['@type']).toBe('GeoCoordinates');
          expect(isValidLatitude(schema.geo.latitude)).toBe(true);
          expect(isValidLongitude(schema.geo.longitude)).toBe(true);

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：ContactPoint 嵌套结构
     */
    it('contactPoint 应该是有效的 ContactPoint 结构', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(schema.contactPoint['@type']).toBe('ContactPoint');
          expect(isValidPhoneNumber(schema.contactPoint.telephone)).toBe(true);
          expect(isValidEmail(schema.contactPoint.email)).toBe(true);
          expect(schema.contactPoint.contactType).toBeDefined();

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：numberOfEmployees 嵌套结构
     */
    it('numberOfEmployees 应该是有效的 QuantitativeValue 结构', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(schema.numberOfEmployees['@type']).toBe('QuantitativeValue');
          expect(schema.numberOfEmployees.minValue).toBeGreaterThan(0);
          expect(schema.numberOfEmployees.maxValue).toBeGreaterThan(
            schema.numberOfEmployees.minValue
          );

          return true;
        }),
        { numRuns: 20 }
      );
    });

    /**
     * 属性测试：inLanguage 与 locale 匹配
     */
    it('inLanguage 应该与传入的 locale 匹配', () => {
      fc.assert(
        fc.property(fc.constantFrom(...supportedLocales), (locale) => {
          const schema = generateManufacturingBusinessSchema(locale, 'Test description');

          expect(schema.inLanguage).toBe(locale);

          return true;
        }),
        { numRuns: 50 }
      );
    });

    /**
     * 单元测试：hasCredential 包含认证信息
     */
    it('hasCredential 应该包含工厂认证信息', () => {
      const schema = generateManufacturingBusinessSchema('en', 'Test description');

      expect(schema.hasCredential).toContain('ISO 9001');
      expect(schema.hasCredential).toContain('OEKO-TEX');
      expect(schema.hasCredential).toContain('GRS');
      expect(schema.hasCredential).toContain('GOTS');
    });

    /**
     * 单元测试：hasOfferCatalog 包含服务信息
     */
    it('hasOfferCatalog 应该包含服务信息', () => {
      const schema = generateManufacturingBusinessSchema('en', 'Test description');

      expect(schema.hasOfferCatalog).toBeDefined();
      expect(schema.hasOfferCatalog?.['@type']).toBe('OfferCatalog');
      expect(schema.hasOfferCatalog?.itemListElement.length).toBeGreaterThan(0);
    });
  });

  describe('FAQPage Schema', () => {
    /**
     * 属性测试：FAQPage 必需字段存在性
     */
    it('FAQPage 应该包含所有必需字段', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              items: fc.array(
                fc.record({
                  q: fc.string({ minLength: 1, maxLength: 500 }),
                  a: fc.string({ minLength: 1, maxLength: 1000 }),
                }),
                { minLength: 1, maxLength: 10 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (sections) => {
            const schema = generateFAQPageSchema(sections);

            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('FAQPage');
            expect(schema.mainEntity).toBeDefined();
            expect(Array.isArray(schema.mainEntity)).toBe(true);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 属性测试：Question 结构正确性
     */
    it('每个 mainEntity 项应该是有效的 Question 结构', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              items: fc.array(
                fc.record({
                  q: fc.string({ minLength: 1, maxLength: 500 }),
                  a: fc.string({ minLength: 1, maxLength: 1000 }),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (sections) => {
            const schema = generateFAQPageSchema(sections);

            for (const question of schema.mainEntity) {
              expect(question['@type']).toBe('Question');
              expect(question.name).toBeDefined();
              expect(question.acceptedAnswer).toBeDefined();
              expect(question.acceptedAnswer['@type']).toBe('Answer');
              expect(question.acceptedAnswer.text).toBeDefined();
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 属性测试：FAQ 数量与输入一致
     */
    it('mainEntity 数量应该等于所有 sections 中 items 的总数', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              items: fc.array(
                fc.record({
                  q: fc.string({ minLength: 1, maxLength: 500 }),
                  a: fc.string({ minLength: 1, maxLength: 1000 }),
                }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (sections) => {
            const schema = generateFAQPageSchema(sections);
            const expectedCount = sections.reduce(
              (sum, section) => sum + section.items.length,
              0
            );

            expect(schema.mainEntity.length).toBe(expectedCount);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * 单元测试：空 sections 应该返回空 mainEntity
     */
    it('空 sections 应该返回空 mainEntity 数组', () => {
      const schema = generateFAQPageSchema([]);

      expect(schema.mainEntity).toEqual([]);
    });

    /**
     * 单元测试：问答内容正确映射
     */
    it('问答内容应该正确映射到 Question 和 Answer', () => {
      const sections = [
        {
          title: 'General',
          items: [
            { q: 'What is your MOQ?', a: 'Our MOQ is 150 pieces.' },
          ],
        },
      ];

      const schema = generateFAQPageSchema(sections);

      expect(schema.mainEntity[0].name).toBe('What is your MOQ?');
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe('Our MOQ is 150 pieces.');
    });
  });

  describe('Schema.org Context', () => {
    /**
     * 单元测试：@context 使用 https
     */
    it('@context 应该使用 HTTPS 协议', () => {
      const manufacturingSchema = generateManufacturingBusinessSchema('en', 'Test');
      const faqSchema = generateFAQPageSchema([]);

      expect(manufacturingSchema['@context']).toBe('https://schema.org');
      expect(faqSchema['@context']).toBe('https://schema.org');
    });

    /**
     * 单元测试：JSON-LD 可序列化
     */
    it('Schema 应该可以正确序列化为 JSON', () => {
      const manufacturingSchema = generateManufacturingBusinessSchema('en', 'Test');
      const faqSchema = generateFAQPageSchema([{ title: 'Test', items: [{ q: 'Q', a: 'A' }] }]);

      expect(() => JSON.stringify(manufacturingSchema)).not.toThrow();
      expect(() => JSON.stringify(faqSchema)).not.toThrow();

      const parsedManufacturing = JSON.parse(JSON.stringify(manufacturingSchema));
      const parsedFaq = JSON.parse(JSON.stringify(faqSchema));

      expect(parsedManufacturing['@type']).toBe('ManufacturingBusiness');
      expect(parsedFaq['@type']).toBe('FAQPage');
    });
  });
});
