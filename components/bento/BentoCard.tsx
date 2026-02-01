'use client';

import { ReactNode } from 'react';

export type BentoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface BentoCardProps {
  children: ReactNode;
  position: BentoPosition;
  href?: string;
  className?: string;
}

/**
 * BentoCard - 四象限网格卡片组件
 *
 * 古腾堡图表布局:
 * - top-left: 品牌+价值主张 (Primary Optical Area)
 * - top-right: 数据看板 (Strong Fallow Area)
 * - bottom-left: 信任徽章 (Weak Fallow Area)
 * - bottom-right: CTA区块 (Terminal Area)
 *
 * 无障碍特性:
 * - 触控区域 >= 44x44px (::after 伪元素扩展)
 * - 焦点环 >= 2px (focus:ring-4)
 * - 键盘导航支持
 */
export function BentoCard({
  children,
  position,
  href,
  className = '',
}: BentoCardProps) {
  // 根据位置设置响应式 order 和样式
  const positionStyles: Record<BentoPosition, string> = {
    'top-left': 'order-1 md:order-1',
    'top-right': 'order-2 md:order-2',
    'bottom-left': 'order-3 md:order-3',
    'bottom-right': 'order-4 md:order-4',
  };

  const baseStyles = `
    relative
    rounded-lg
    bg-white
    p-6
    shadow-sm
    transition-all
    duration-200
    hover:shadow-md
    ${positionStyles[position]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // 如果有 href，渲染为可点击链接
  if (href) {
    return (
      <a
        href={href}
        data-position={position}
        className={`
          ${baseStyles}
          block
          min-h-[100px]
          focus:outline-none
          focus:ring-4
          focus:ring-primary/30
          focus:ring-offset-2
          after:absolute
          after:inset-0
          after:min-h-[44px]
          after:min-w-[44px]
          after:content-['']
        `.trim().replace(/\s+/g, ' ')}
      >
        {children}
      </a>
    );
  }

  // 否则渲染为普通 div
  return (
    <div
      data-position={position}
      className={baseStyles}
    >
      {children}
    </div>
  );
}
