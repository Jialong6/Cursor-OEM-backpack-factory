/**
 * 客户端语言偏好 cookie 写入
 *
 * 服务端读写在 lib/language-preference.ts,但它 import next/server,
 * 不能进客户端包,故此处常量本地定义(与服务端一致,防漂移由
 * tests/lib/lang-cookie-client.test.ts 锁定)。属性与服务端写入对齐:
 * path=/、一年有效、samesite=lax、https 下带 secure。
 */
import type { Locale } from '@/i18n';

export const LANG_COOKIE_NAME = 'NEXT_LOCALE';
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function setLangCookieClient(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${LANG_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
}
