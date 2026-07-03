import type { BlogPost } from '../types';

const post: BlogPost = {
  id: 'factory-tour-one-day-myanmar',
  slug: 'factory-tour-one-day-myanmar',
  title: {
    ja: '緬甸ヤンゴン工場の「1 日」をご案内します ── 7:30 始業から 18:00 終業まで、写真で巡るバーチャル工場見学',
    zh: '缅甸仰光工厂的「1 天」── 从 7:30 上班到 18:00 下班，照片陪您走完一趟虚拟参访',
    en: 'One Day at Our Yangon Factory in Myanmar — From the 7:30 Start to the 6:00 Close, a Virtual Tour in Photos',
  },
  excerpt: {
    ja: '「ヤンゴンまで工場見学に行きたいけれど、なかなか…」というお客様の本音にお応えして、Better Bags Myanmar 工場の「1 日」を 4 つの場面で巡るバーチャル見学。始業から終業まで、合計約 600 名（縫製 + 補助スタッフ）の現場を公開します。',
    zh: '「想去仰光参观工厂，但实在抽不出时间…」面对客户的真实心声，我们用 4 个场景带您走一趟 Better Bags Myanmar 工厂的「1 天」虚拟参访。从开工到收工，合计约 600 名（缝纫工 + 辅助人员）的现场全公开。',
    en: '"We\'d love to visit the factory in Yangon, but we just can\'t find the time…" In answer to what clients so often tell us, we walk you through one day at the Better Bags Myanmar factory, in four scenes — from clock-in to clock-out, across a shop floor of around 600 people (sewing operators and support staff).',
  },
  // 正文按语言拆分为 content.{locale}.ts,经动态 import 加载;
  // 显式列出(不用模板字符串路径)保证打包器可静态分析
  contentLoaders: {
    ja: () => import('./content.ja'),
    zh: () => import('./content.zh'),
    en: () => import('./content.en'),
  },
  date: '2026-05-20',
  thumbnail: '/images/blog/placeholder-factory-tour.svg',
  category: { ja: '工場見学', zh: '工厂参访', en: 'Factory Tour' },
  authorId: 'jay',
  tags: {
    ja: ['工場見学', 'バーチャル見学', 'ヤンゴン', 'Better Bags Myanmar', '工場シリーズ Vol.01'],
    zh: ['工厂参访', '虚拟参访', '仰光', 'Better Bags Myanmar', '工厂系列 Vol.01'],
    en: ['Factory Tour', 'Virtual Tour', 'Yangon', 'Better Bags Myanmar', 'Factory Series Vol.01'],
  },
};

export default post;
