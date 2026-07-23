/**
 * lib/lang-cookie-client —— 客户端语言偏好 cookie 写入测试
 *
 * 服务端读写在 lib/language-preference.ts(import next/server,不能进
 * 客户端包),客户端写入因此单独成模块、常量本地定义。
 * 关键守护:cookie 名与有效期必须与服务端模块严格一致(防漂移),
 * 否则 middleware 读不到页脚语言链接写入的偏好。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LANG_COOKIE_NAME,
  COOKIE_MAX_AGE,
  setLangCookieClient,
} from '@/lib/lang-cookie-client';
import {
  LANG_COOKIE_NAME as SERVER_COOKIE_NAME,
  COOKIE_MAX_AGE as SERVER_COOKIE_MAX_AGE,
} from '@/lib/language-preference';

describe('常量与服务端模块防漂移', () => {
  it('cookie 名与 lib/language-preference 严格一致', () => {
    expect(LANG_COOKIE_NAME).toBe(SERVER_COOKIE_NAME);
  });

  it('有效期与 lib/language-preference 严格一致', () => {
    expect(COOKIE_MAX_AGE).toBe(SERVER_COOKIE_MAX_AGE);
  });
});

describe('setLangCookieClient', () => {
  beforeEach(() => {
    document.cookie = `${LANG_COOKIE_NAME}=; path=/; max-age=0`;
  });

  it('写入目标 locale 到 document.cookie', () => {
    setLangCookieClient('de');
    expect(document.cookie).toContain(`${LANG_COOKIE_NAME}=de`);
  });

  it('覆盖旧值', () => {
    setLangCookieClient('ja');
    setLangCookieClient('zh-tw');
    expect(document.cookie).toContain(`${LANG_COOKIE_NAME}=zh-tw`);
    expect(document.cookie).not.toContain(`${LANG_COOKIE_NAME}=ja`);
  });
});
