/**
 * 工厂基本信息常量(纯数据模块)
 *
 * 供 SEO JSON-LD 组件、页面 section 与测试共用。
 *
 * 重要:本模块必须保持无 'use client' 指令。BreadcrumbSchema 等
 * server 组件直接取用这里的值;若常量住在 'use client' 模块里,
 * server 侧拿到的是 client-reference 代理(FACTORY_INFO.url 为
 * undefined),曾导致线上 BreadcrumbList 输出 "undefined/zh" 被
 * Google 判为无效网址(见 tests/seo/server-safe-imports.test.ts)。
 */
export const FACTORY_INFO = {
  name: 'Better Bags Myanmar Company Limited',
  url: 'https://betterbagsmm.com',
  logo: 'https://betterbagsmm.com/logo.png',
  foundingDate: '2003',
  telephone: '+1-814-880-1463',
  email: 'jay@betterbagsmm.com',
  address: {
    streetAddress: 'Plot No. 48, Myay Taing Block No.24, Ngwe Pin Lai Industrial Zone',
    addressLocality: 'Yangon',
    addressCountry: 'MM',
    postalCode: '11000',
  },
  // 坐标取自 Google Business Profile 档案(Ngwe Pin Lai 工业区实地定位,
  // 2026-07-08 经 Google Maps 核实;旧值 16.871311,96.199379 指向市区东侧,系错误数据)
  geo: {
    latitude: 16.9304653,
    longitude: 96.0619768,
  },
  numberOfEmployees: {
    minValue: 600,
    maxValue: 700,
  },
  /**
   * 对外声称的资质 —— 只放手里有可核验凭据的项
   *
   * 2026-11 清空:此前这里写着四项国际认证,被两个 JSON-LD 组件当成
   * `hasCredential` 输出(ManufacturingPlantSchema 在根布局,等于每个页面、
   * 十二种语言都在声称),而工厂并不持有它们。页面上反倒一直没展示 ——
   * 机器可读的那份在声称,人眼看得到的那份不敢声称,方向正好是反的。
   *
   * 新增一项前先去 tests/seo/credential-claims.test.ts 的白名单登记,
   * 并写下凭据出处。空列表是合法状态:没有凭据就什么都不声称。
   */
  credentials: [] as ReadonlyArray<string>,
  // 站外权威档案(实体消歧):LinkedIn 公司页 + Google 商家档案。
  // 搜索引擎与 AI 引擎靠 sameAs 将网站与站外实体对齐(GEO 关键信号)
  sameAs: [
    'https://www.linkedin.com/company/better-bags-myanmar/',
    'https://www.google.com/maps/place/Better+Bags+Myanmar/@16.9304653,96.0619768,17z/',
  ],
};
