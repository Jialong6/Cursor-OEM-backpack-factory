/**
 * 跨语言路径映射纯函数
 *
 * 把当前路径映射到目标语言的等价路径(页脚语言区块等场景使用)。
 * 必须完整段匹配:仅当 pathname 恰为 /{locale} 或以 /{locale}/ 开头
 * 才剥离前缀,避免 /zh 误剥 /zh-tw 路径(字符串 replace 写法的隐患)。
 */
import type { Locale } from '@/i18n';

export function stripLocalePrefix(pathname: string, locale: Locale): string {
  if (pathname === `/${locale}`) {
    return '';
  }
  if (pathname.startsWith(`/${locale}/`)) {
    return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/** 当前路径在目标语言下的等价路径(如 /zh-tw/blog + de -> /de/blog) */
export function buildLocaleHref(
  pathname: string,
  currentLocale: Locale,
  targetLocale: Locale
): string {
  return `/${targetLocale}${stripLocalePrefix(pathname, currentLocale)}`;
}
