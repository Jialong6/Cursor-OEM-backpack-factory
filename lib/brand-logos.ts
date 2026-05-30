/**
 * 合作品牌 LOGO 数据源(Trusted by Global Brands 区块)
 * SVG 资产位于 public/brands/。
 */

export interface BrandLogo {
  slug: string;
  src: string;
  alt: string;
}

export const TRUSTED_BRANDS: readonly BrandLogo[] = Object.freeze([
  { slug: 'anello', src: '/brands/l_anello.svg', alt: 'anello' },
  { slug: 'anello-grande', src: '/brands/l_anellog.svg', alt: 'anello GRANDE' },
  { slug: 'onward', src: '/brands/logo_onward.svg', alt: 'ONWARD' },
  { slug: 'converse', src: '/brands/converse-logo.svg', alt: 'Converse' },
  { slug: 'hanshin-tigers', src: '/brands/Hanshin_tigers_emblem.svg', alt: 'Hanshin Tigers' },
  { slug: 'legato-largo', src: '/brands/l_legato.svg', alt: 'LEGATO LARGO' },
]);
