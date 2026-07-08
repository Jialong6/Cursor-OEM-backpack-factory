import { notFound } from 'next/navigation';

/**
 * Catch-all 路由:未匹配的 locale 内路径统一触发 404
 *
 * next-intl 标准方案 —— 没有这个 catch-all,未知路径不会进入
 * [locale] 布局,not-found.tsx 也就无法以本地化形式渲染。
 */
export default function CatchAllPage(): never {
  notFound();
}
