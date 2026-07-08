// 复用同目录常量取站点 URL(与 BlogPostingSchema 一致);
// 不从 lib/metadata 引入,避免联动 HreflangTags -> i18n 的重依赖链
import { FACTORY_INFO } from './ManufacturingPlantSchema';

/**
 * 面包屑条目
 */
export interface BreadcrumbSchemaItem {
  /** 条目显示名称(已本地化) */
  readonly name: string;
  /** 相对路径(含 locale 前缀,如 /en/blog);当前页省略 */
  readonly path?: string;
}

/**
 * BreadcrumbSchema 组件属性
 */
interface BreadcrumbSchemaProps {
  readonly items: readonly BreadcrumbSchemaItem[];
}

/**
 * BreadcrumbList JSON-LD 结构化数据组件
 *
 * 生成符合 Schema.org BreadcrumbList 规范的 JSON-LD,
 * 帮助搜索引擎理解页面层级并在结果中展示路径导航。
 *
 * 规范要点(Google Rich Results):
 * - itemListElement 为 ListItem 数组,position 从 1 递增
 * - 最后一项(当前页)按规范省略 item URL
 *
 * 纯展示组件,无 hooks,可直接用于 server 组件;
 * 名称由调用方本地化后传入(如 nav.banner / blogDetail.blog)。
 *
 * 安全说明:
 * - 数据来自可信调用方(页面组件的翻译与常量),经 JSON.stringify
 *   序列化输出,与 ManufacturingPlantSchema 模式一致,无 XSS 风险
 */
export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${FACTORY_INFO.url}${item.path}` } : {}),
    })),
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
