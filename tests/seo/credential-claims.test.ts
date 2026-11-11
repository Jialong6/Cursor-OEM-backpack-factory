/**
 * 对外的资质声明必须有凭据
 *
 * 2026-11 发现:`FACTORY_INFO.credentials` 里写着 ISO 9001 / OEKO-TEX /
 * GRS / GOTS 四项,被两个 JSON-LD 组件当成 `hasCredential` 输出 ——
 * `ManufacturingPlantSchema` 挂在根布局,**每个页面、十二种语言都在输出**。
 * 而这四项工厂并不持有(已向用户确认)。
 *
 * 更说明问题的是方向:页面上**故意不展示**它们
 * (`components/content/TrustSignals.tsx` 写着「拿到正式资质证书前，不展示」),
 * 唯独机器可读的那一份在声称 —— 而那恰恰是搜索引擎会当成事实采信、
 * 也会按虚假声明处罚的一份。
 *
 * 所以这个测试的断言方向是刻意反过来的:它不替任何具体认证站岗,
 * 而是**只允许白名单里有凭据的项出现**。想新增一项,必须先来这里加白名单,
 * 并在注释里写下凭据出处 —— 让「加一句好听的」这件事变成一个需要留痕的动作。
 *
 * 空列表是合法状态。没有凭据就什么都不声称,比声称一个查不到的强。
 */
import { describe, it, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FACTORY_INFO } from '../../lib/factory-info';
import { AUTHORS } from '../../lib/author-data';
import { locales, type Locale } from '../../i18n';

/**
 * 允许对外声称的资质 —— 每一项后面必须写清凭据出处
 *
 * 新增一项的要求:手里有可核验的报告或证书编号。
 * 没有编号、只有「我们符合」的,不算。
 */
const VERIFIED_CREDENTIALS: ReadonlyArray<string> = [
  // 暂时为空。SMETA 审核报告(ZAA600229836)读过原件后加进来,
  // 届时注意措辞:SMETA 是审核方法,不是认证制度,不存在「SMETA 认证」。
];

/**
 * 明确不持有、因此任何地方都不得出现的声称
 *
 * 2026-11 从 factory-info / author-data / locales / TrustBadges 里清掉的就是这些。
 */
const UNBACKED_CLAIMS: ReadonlyArray<string> = [
  'ISO 9001',
  'ISO-9001',
  'ISO9001',
  'OEKO-TEX',
  'OEKO TEX',
  'GRS',
  'GOTS',
  'BSCI',
];

/**
 * 只扫「关于我们自己的声明」,不扫博客正文
 *
 * lib/blog-posts/danshin-needle-control-myanmar 里写着
 * 「BSCI / SEDEX / 品牌自有审核 —— 都支持」。那是**能力**声明
 * (我们能配合这些审核),本来就成立,不在本测试管辖范围内。
 */
const CLAIM_SURFACES: ReadonlyArray<string> = [
  'lib/factory-info.ts',
  'lib/author-data.ts',
  'components/bento/TrustBadges.tsx',
  'components/content/CertificationBadges.tsx',
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf-8');
}

function localeJson(locale: Locale): Record<string, unknown> {
  return JSON.parse(read(path.join('locales', `${locale}.json`)));
}

describe('FACTORY_INFO.credentials', () => {
  test('每一项都在白名单里 —— 白名单之外即为无凭据声称', () => {
    for (const credential of FACTORY_INFO.credentials) {
      expect(VERIFIED_CREDENTIALS).toContain(credential);
    }
  });

  test('空列表是合法的:没有凭据就什么都不声称', () => {
    expect(Array.isArray(FACTORY_INFO.credentials)).toBe(true);
  });

  test('不含那四项已确认并不持有的认证', () => {
    const joined = FACTORY_INFO.credentials.join(' | ');

    for (const claim of UNBACKED_CLAIMS) {
      expect(joined).not.toContain(claim);
    }
  });
});

describe('作者档案', () => {
  test('作者资质徽章里不含无凭据的认证', () => {
    for (const author of AUTHORS) {
      const joined = author.credentials.join(' | ');

      for (const claim of UNBACKED_CLAIMS) {
        expect(joined, `作者 ${author.id}`).not.toContain(claim);
      }
    }
  });

  it.each(locales)('%s 的作者简介正文里不含无凭据的认证', (locale) => {
    for (const author of AUTHORS) {
      const bio = author.bio[locale as Locale] ?? '';

      for (const claim of UNBACKED_CLAIMS) {
        expect(bio, `作者 ${author.id} / ${locale}`).not.toContain(claim);
      }
    }
  });
});

describe('翻译文件', () => {
  it.each(locales)('%s 的 certifications 命名空间里不含无凭据的认证', (locale) => {
    const namespace = JSON.stringify(localeJson(locale as Locale).certifications ?? {});

    for (const claim of UNBACKED_CLAIMS) {
      expect(namespace).not.toContain(claim);
    }
  });
});

describe('组件源码', () => {
  it.each(CLAIM_SURFACES)('%s 里没有硬编码的无凭据认证', (file) => {
    const source = read(file);

    for (const claim of UNBACKED_CLAIMS) {
      // 允许出现在注释里(说明为什么撤掉),只禁止出现在字符串字面量里
      const inStringLiteral = new RegExp(`['"\`][^'"\`\\n]*${claim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      expect(source).not.toMatch(inStringLiteral);
    }
  });
});

/**
 * SMETA 的措辞红线
 *
 * Sedex 自己的品牌规范明确:SMETA 是一套审核方法,不是认证制度。
 * 「SMETA 认证」「SMETA certified」这类说法不存在。我们正是在修
 * 过度声称的问题,别在新内容上又犯一次。
 */
describe('SMETA 措辞', () => {
  const FORBIDDEN = [
    /SMETA\s*(认证|認證)/,
    /SMETA[-\s]*certified/i,
    /SMETA\s*certification/i,
    /certified\s*(by\s*)?SMETA/i,
  ];

  const SURFACES = [...CLAIM_SURFACES, ...locales.map((l) => path.join('locales', `${l}.json`))];

  it.each(SURFACES)('%s 里没有把 SMETA 说成认证', (file) => {
    const source = read(file);

    for (const pattern of FORBIDDEN) {
      expect(source).not.toMatch(pattern);
    }
  });
});
