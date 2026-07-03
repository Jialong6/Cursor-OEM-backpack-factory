import type { BlogPost } from '../types';

const post: BlogPost = {
  id: 'ipack-third-party-inspection-myanmar',
  slug: 'ipack-third-party-inspection-myanmar',
  title: {
    ja: '第三者の目で、もう一度。── I-pack 社との連携で実現する、緬甸出荷の「日本品質 100%」',
    zh: '让第三方的眼睛再看一遍 ── 与 I-pack 合作实现的、缅甸出货「日本品质 100%」',
    en: 'A Second Look Through Third-Party Eyes — Delivering "100% Japanese Quality" on Myanmar Shipments with I-pack',
  },
  excerpt: {
    ja: 'バッグ業界専門の検品プロフェッショナル「株式会社 I-pack」と Better Bags Myanmar の 10 年以上のパートナーシップ。社内検品の上に、もう一段「日本人による日本基準」の目を重ねた三段防衛体制で、出荷品の 100% が日本のお客様の期待に応えます。',
    zh: '包袋行业专精的检品专家「株式会社 I-pack」与 Better Bags Myanmar 超过 10 年的合作关系。在厂内检品之上，再叠一层「以日本标准、由日本人」复核的眼睛，三段防卫体制让出货品 100% 满足日本客户的期望。',
    en: 'More than ten years of partnership between Better Bags Myanmar and I-pack Co., Ltd., a bag-industry inspection specialist. On top of in-house inspection, we add one more layer of eyes — re-checking to Japanese standards, by Japanese inspectors — a three-layer defense that lets 100% of our shipments meet the expectations of Japanese clients.',
  },
  // 正文按语言拆分为 content.{locale}.ts,经动态 import 加载;
  // 显式列出(不用模板字符串路径)保证打包器可静态分析
  contentLoaders: {
    ja: () => import('./content.ja'),
    zh: () => import('./content.zh'),
    en: () => import('./content.en'),
  },
  date: '2026-05-10',
  thumbnail: '/images/blog/placeholder-ipack.svg',
  category: { ja: '品質管理', zh: '品质管理', en: 'Quality Control' },
  authorId: 'jay',
  tags: {
    ja: ['第三者検品', 'I-pack', 'セル方式', '三段防衛', '緬甸工場', '日本品質', '品質シリーズ Vol.02'],
    zh: ['第三方检品', 'I-pack', '单元方式', '三段防卫', '缅甸工厂', '日本品质', '品质系列 Vol.02'],
    en: ['Third-Party Inspection', 'I-pack', 'Cell Method', 'Three-Layer Defense', 'Myanmar Factory', 'Japanese Quality', 'Quality Series Vol.02'],
  },
};

export default post;
