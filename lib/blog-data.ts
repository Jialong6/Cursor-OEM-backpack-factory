/**
 * 博客文章数据
 *
 * 这是一个临时的数据文件，用于演示博客功能。
 * 在生产环境中，这些数据应该从 CMS、数据库或 Markdown 文件中获取。
 */

/**
 * 博客文章数据类型
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: {
    en: string;
    zh: string;
  };
  excerpt: {
    en: string;
    zh: string;
  };
  content?: {
    en: string;
    zh: string;
  };
  date: string;
  thumbnail: string;
  category: string;
  author?: string;
  authorId?: string;
  tags?: string[];
}

/**
 * 示例博客文章数据
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'custom-backpack-guide-2024',
    title: {
      zh: '2024年定制背包完全指南',
      en: 'Complete Guide to Custom Backpacks in 2024',
    },
    excerpt: {
      zh: '了解如何选择合适的背包材料、设计元素和生产流程，打造专属品牌背包。',
      en: 'Learn how to choose the right materials, design elements, and production process to create your branded backpack.',
    },
    content: {
      zh: `
# 2024年定制背包完全指南

在当今竞争激烈的市场环境中，拥有一款独特的品牌背包可以显著提升品牌识别度和客户忠诚度。本指南将帮助您了解定制背包的全过程。

## 1. 选择合适的材料

材料的选择直接影响背包的质量、外观和价格。常见的材料包括：

- **聚酯纤维**：耐用、防水、成本适中
- **尼龙**：轻便、强韧、价格稍高
- **帆布**：自然质感、环保、适合休闲风格
- **皮革**：高端质感、耐用、价格较高

## 2. 设计要素

一个成功的背包设计需要考虑以下因素：

- 功能性：口袋数量、隔层设计、背负系统
- 美观性：颜色搭配、logo位置、细节处理
- 人体工学：背带宽度、重量分配、透气性

## 3. 生产流程

定制背包的典型生产流程包括：

1. 需求沟通与报价
2. 样品开发与确认
3. 批量生产
4. 质量检验
5. 包装与运输

## 结论

选择合适的 OEM 合作伙伴至关重要。Better Bags Myanmar 拥有 20+ 年的行业经验，可以为您提供专业的定制解决方案。
      `,
      en: `
# Complete Guide to Custom Backpacks in 2024

In today's competitive market, having a unique branded backpack can significantly enhance brand recognition and customer loyalty. This guide will help you understand the complete process of customizing backpacks.

## 1. Choosing the Right Materials

Material selection directly affects the quality, appearance, and price of your backpack. Common materials include:

- **Polyester**: Durable, water-resistant, cost-effective
- **Nylon**: Lightweight, strong, slightly higher price
- **Canvas**: Natural texture, eco-friendly, suitable for casual style
- **Leather**: Premium feel, durable, higher price

## 2. Design Elements

A successful backpack design needs to consider the following factors:

- Functionality: Number of pockets, compartment design, carrying system
- Aesthetics: Color matching, logo placement, detail treatment
- Ergonomics: Strap width, weight distribution, breathability

## 3. Production Process

The typical production process for custom backpacks includes:

1. Requirements communication and quotation
2. Sample development and confirmation
3. Bulk production
4. Quality inspection
5. Packaging and shipping

## Conclusion

Choosing the right OEM partner is crucial. Better Bags Myanmar has 20+ years of industry experience and can provide professional customization solutions for you.
      `,
    },
    date: '2024-03-15',
    thumbnail: '/images/blog/custom-backpack-guide.jpg',
    category: 'Guide',
    author: 'Better Bags Team',
    tags: ['定制', 'OEM', '指南'],
  },
  {
    id: '2',
    slug: 'sustainable-materials-backpacks',
    title: {
      zh: '可持续材料在背包制造中的应用',
      en: 'Sustainable Materials in Backpack Manufacturing',
    },
    excerpt: {
      zh: '探索环保材料如何改变背包行业，以及如何将可持续性融入产品设计。',
      en: 'Explore how eco-friendly materials are transforming the backpack industry and how to integrate sustainability into product design.',
    },
    content: {
      zh: `
# 可持续材料在背包制造中的应用

随着全球对环境保护意识的提高，可持续材料在背包制造中的应用越来越受到重视。

## 环保材料的优势

- 减少碳足迹
- 可回收利用
- 符合国际环保标准
- 提升品牌形象

## 常见的可持续材料

1. **再生聚酯纤维（rPET）**：由回收塑料瓶制成
2. **有机棉**：无农药、无化肥种植
3. **天然橡胶**：可生物降解
4. **蘑菇皮革**：创新型环保材料

## Better Bags 的可持续实践

我们致力于采用环保材料，并持续优化生产流程，减少环境影响。
      `,
      en: `
# Sustainable Materials in Backpack Manufacturing

With the increasing global awareness of environmental protection, the application of sustainable materials in backpack manufacturing is receiving more attention.

## Advantages of Eco-friendly Materials

- Reduce carbon footprint
- Recyclable
- Comply with international environmental standards
- Enhance brand image

## Common Sustainable Materials

1. **Recycled Polyester (rPET)**: Made from recycled plastic bottles
2. **Organic Cotton**: Grown without pesticides or chemical fertilizers
3. **Natural Rubber**: Biodegradable
4. **Mushroom Leather**: Innovative eco-friendly material

## Better Bags' Sustainable Practices

We are committed to using eco-friendly materials and continuously optimizing our production processes to reduce environmental impact.
      `,
    },
    date: '2024-02-28',
    thumbnail: '/images/blog/sustainable-materials.jpg',
    category: 'Industry',
    author: 'Better Bags Team',
    tags: ['可持续', '环保', '材料'],
  },
  {
    id: '3',
    slug: 'oem-vs-odm-differences',
    title: {
      zh: 'OEM vs ODM：选择正确的生产模式',
      en: 'OEM vs ODM: Choosing the Right Production Model',
    },
    excerpt: {
      zh: '深入了解 OEM 和 ODM 的区别，以及如何根据您的业务需求做出明智选择。',
      en: 'Understand the differences between OEM and ODM, and how to make the right choice for your business needs.',
    },
    content: {
      zh: `
# OEM vs ODM：选择正确的生产模式

在选择制造合作伙伴时，理解 OEM 和 ODM 的区别至关重要。

## OEM（Original Equipment Manufacturer）

- 客户提供设计和规格
- 制造商负责生产
- 品牌拥有完全的设计控制权

## ODM（Original Design Manufacturer）

- 制造商提供现有设计
- 客户可以定制品牌和颜色
- 更快的上市时间，更低的开发成本

## 如何选择

根据以下因素做出选择：
- 预算
- 时间表
- 设计能力
- 品牌定位

Better Bags 同时提供 OEM 和 ODM 服务，满足不同客户的需求。
      `,
      en: `
# OEM vs ODM: Choosing the Right Production Model

Understanding the difference between OEM and ODM is crucial when choosing a manufacturing partner.

## OEM (Original Equipment Manufacturer)

- Customer provides design and specifications
- Manufacturer handles production
- Brand has complete design control

## ODM (Original Design Manufacturer)

- Manufacturer provides existing designs
- Customer can customize brand and colors
- Faster time to market, lower development costs

## How to Choose

Make your choice based on the following factors:
- Budget
- Timeline
- Design capabilities
- Brand positioning

Better Bags offers both OEM and ODM services to meet different customer needs.
      `,
    },
    date: '2024-01-20',
    thumbnail: '/images/blog/oem-vs-odm.jpg',
    category: 'Business',
    author: 'Better Bags Team',
    authorId: 'jay',
    tags: ['OEM', 'ODM', '商业'],
  },
  {
    id: '4',
    slug: 'quality-control-process',
    title: {
      zh: '背包质量控制：从原料到成品',
      en: 'Backpack Quality Control: From Raw Materials to Finished Products',
    },
    excerpt: {
      zh: '详细了解我们严格的质量控制流程，确保每一个背包都达到最高标准。',
      en: 'Learn about our rigorous quality control process that ensures every backpack meets the highest standards.',
    },
    date: '2023-12-10',
    thumbnail: '/images/blog/quality-control.jpg',
    category: 'Quality',
    author: 'Better Bags Team',
    authorId: 'jay',
    tags: ['质量', 'QC', '生产'],
  },
  {
    id: '5',
    slug: 'backpack-trends-2024',
    title: {
      zh: '2024年背包设计趋势',
      en: '2024 Backpack Design Trends',
    },
    excerpt: {
      zh: '探索2024年最新的背包设计趋势，从功能创新到美学演变。',
      en: 'Explore the latest backpack design trends for 2024, from functional innovations to aesthetic evolution.',
    },
    date: '2023-11-25',
    thumbnail: '/images/blog/trends-2024.jpg',
    category: 'Design',
    author: 'Better Bags Team',
    tags: ['设计', '趋势', '2024'],
  },
  {
    id: '6',
    slug: 'choosing-right-backpack-manufacturer',
    title: {
      zh: '如何选择合适的背包制造商',
      en: 'How to Choose the Right Backpack Manufacturer',
    },
    excerpt: {
      zh: '选择制造合作伙伴时需要考虑的关键因素和注意事项。',
      en: 'Key factors and considerations when choosing a manufacturing partner.',
    },
    date: '2023-10-15',
    thumbnail: '/images/blog/choosing-manufacturer.jpg',
    category: 'Business',
    author: 'Better Bags Team',
    tags: ['制造', '合作', '选择'],
  },
];

/**
 * 根据 slug 获取博客文章
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/**
 * 获取所有博客文章（按日期降序排列）
 */
export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * 获取精选博客文章（用于首页展示）
 */
export function getFeaturedBlogPosts(count: number = 3): BlogPost[] {
  return getAllBlogPosts().slice(0, count);
}
