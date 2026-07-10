'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FACTORY_INFO } from '@/lib/factory-info';

/**
 * 工厂位置交互式地图(Google Maps 嵌入)
 *
 * 用于联系页地址卡片，让买家直观了解工厂在仰光的周边相对位置：
 * - 免 API key 的 output=embed 嵌入方式，支持缩放/拖动
 * - loading="lazy"：Contact 位于单页底部，滚动到附近才加载，不影响首屏
 * - 坐标复用 FACTORY_INFO.geo（GBP 已核实坐标），避免多处漂移
 * - 地图界面语言（hl 参数）跟随当前 locale
 *
 * 注：简体中文页面不渲染——中国大陆无法访问 Google Maps，
 * 避免大陆买家看到一个加载不出来的空白框（地址文字与外链仍在）。
 */

/** 不渲染地图的 locale（Google Maps 在中国大陆被屏蔽） */
const HIDDEN_LOCALES: string[] = ['zh'];

/** locale 与 Google Maps hl 参数不一致时的映射（其余 locale 直接透传） */
const MAPS_HL: Record<string, string> = {
  'zh-tw': 'zh-TW',
};

export default function FactoryMapEmbed() {
  const locale = useLocale();
  const t = useTranslations('contact');

  if (HIDDEN_LOCALES.includes(locale)) {
    return null;
  }

  const { latitude, longitude } = FACTORY_INFO.geo;
  const hl = MAPS_HL[locale] ?? locale;
  // q=商家名 命中已验证的 Google 商家条目（pin 显示公司名），ll 兜底居中到实测坐标
  const src = `https://maps.google.com/maps?q=Better+Bags+Myanmar&ll=${latitude},${longitude}&z=16&hl=${hl}&output=embed`;

  return (
    <iframe
      src={src}
      title={t('map.title')}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      className="mt-4 h-52 w-full rounded-md border border-neutral-200"
    />
  );
}
