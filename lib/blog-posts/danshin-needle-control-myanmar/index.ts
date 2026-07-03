import type { BlogPost } from '../types';

const post: BlogPost = {
  id: 'danshin-needle-control-myanmar',
  slug: 'danshin-needle-control-myanmar',
  title: {
    ja: '1 本の針も逃さない ── Better Bags Myanmar 工場の断針管理体制',
    zh: '1 根针也不漏 ── Better Bags Myanmar 工厂的断针管理体制',
    en: "We Don't Let a Single Needle Slip — The Needle-Control System at the Better Bags Myanmar Factory",
  },
  excerpt: {
    ja: 'バッグ製造で最も恐ろしい「断針による異物混入」のリスクを 0 に近づける、Better Bags Myanmar 工場の断針管理体制を完全公開。在庫針管理台帳、Fjade X 線検針機、5 年記録保管まで、日本品質を支える仕組みを解説します。',
    zh: '把包袋制造中最可怕的「断针异物混入」风险逼近零 ── Better Bags Myanmar 工厂断针管理体制全公开。库存针管理台账、Fjade X 光检针机、5 年记录保管，撑起「日本品质」的机制完整解读。',
    en: 'Driving the most dreaded risk in bag-making — foreign-object contamination from a broken needle — as close to zero as it can go. A complete look at the needle-control system at the Better Bags Myanmar factory: the needle-inventory ledger, the Fjade X-ray needle detector, and five-year record retention — the machinery behind "Japanese quality."',
  },
  // 正文按语言拆分为 content.{locale}.ts,经动态 import 加载;
  // 显式列出(不用模板字符串路径)保证打包器可静态分析
  contentLoaders: {
    ja: () => import('./content.ja'),
    zh: () => import('./content.zh'),
    en: () => import('./content.en'),
  },
  date: '2026-05-15',
  thumbnail: '/images/blog/placeholder-danshin.svg',
  category: { ja: '品質管理', zh: '品质管理', en: 'Quality Control' },
  authorId: 'jay',
  tags: {
    ja: ['断針管理', 'X 線検針', '異物混入', '緬甸工場', '日本品質', '在庫針管理台帳', '品質シリーズ Vol.01'],
    zh: ['断针管理', 'X 光检针', '异物混入', '缅甸工厂', '日本品质', '库存针管理台账', '品质系列 Vol.01'],
    en: ['Needle Control', 'X-ray Screening', 'Foreign-Object Contamination', 'Myanmar Factory', 'Japanese Quality', 'Needle-Inventory Ledger', 'Quality Series Vol.01'],
  },
};

export default post;
