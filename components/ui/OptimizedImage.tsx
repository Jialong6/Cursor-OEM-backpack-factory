/**
 * 优化的图片组件
 *
 * 功能：
 * - 使用 Next.js Image 组件实现自动优化
 * - 支持懒加载（loading="lazy"）
 * - 自动生成 WebP 格式，并提供回退格式
 * - 保持宽高比（aspect ratio）
 * - 响应式 sizes 属性
 * - 占位符支持（blur placeholder）
 * - 错误处理和回退显示
 *
 * 验证需求：4.5, 15.1, 15.2, 15.3
 */

import Image from 'next/image';
import { useState } from 'react';

/**
 * 图片组件属性类型
 */
export interface OptimizedImageProps {
  /** 图片源地址 */
  src: string;
  /** 图片替代文本（无障碍） */
  alt: string;
  /** 图片宽度（px） */
  width?: number;
  /** 图片高度（px） */
  height?: number;
  /** 是否填充容器（使用 fill 模式） */
  fill?: boolean;
  /** 宽高比（如：'16/9', '4/3', '1/1'） */
  aspectRatio?: string;
  /** 响应式 sizes 属性 */
  sizes?: string;
  /** 图片优先级（首屏图片设置为 true） */
  priority?: boolean;
  /** 图片质量（1-100，默认 70） */
  quality?: number;
  /** CSS 类名 */
  className?: string;
  /** 对象适配方式 */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** 对象位置 */
  objectPosition?: string;
  /** 占位符类型 */
  placeholder?: 'blur' | 'empty';
  /** 模糊占位符数据 URL */
  blurDataURL?: string;
  /** 图片加载完成回调 */
  onLoad?: () => void;
  /** 图片加载错误回调 */
  onError?: () => void;
}

/**
 * 生成默认的 sizes 属性
 *
 * 针对不同使用场景的响应式 sizes 配置：
 * - 全宽图片：视口宽度的 100%
 * - 内容区图片：移动端 100vw，桌面端最大 1200px
 * - 卡片缩略图：移动端 100vw，平板 50vw，桌面 33vw
 */
function getDefaultSizes(fill: boolean = false): string {
  if (fill) {
    // 填充模式：根据容器大小自适应
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }
  // 固定尺寸模式：使用图片原始宽度
  return '100vw';
}

/**
 * 生成模糊占位符
 *
 * 创建一个简单的纯色模糊占位符，用于图片加载前显示
 */
function generateBlurPlaceholder(color: string = '#f3f4f6'): string {
  // 生成 1x1 像素的 SVG 占位符
  const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `;
  // 转换为 base64 data URL
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * OptimizedImage 组件
 *
 * 需求 4.5: 图片保持宽高比并根据容器宽度自适应缩放
 * 需求 15.1: 使用 loading="lazy" 延迟加载视口下方的图片
 * 需求 15.2: 提供 WebP 格式，并为旧浏览器提供 JPEG/PNG 后备格式
 * 需求 15.3: 使用 srcset 和 sizes 属性根据视口提供适当尺寸的图片
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  aspectRatio,
  sizes,
  priority = false,
  quality = 70,
  className = '',
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 图片加载完成处理
   */
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  /**
   * 图片加载错误处理
   */
  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  /**
   * 如果图片加载失败，显示占位符
   */
  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary-cyan to-primary-blue ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
        }}
      >
        <span className="text-white text-2xl font-bold opacity-50">BB</span>
      </div>
    );
  }

  /**
   * 计算响应式 sizes
   */
  const imageSizes = sizes || getDefaultSizes(fill);

  /**
   * 准备 Image 组件属性
   */
  const imageProps = {
    src,
    alt,
    quality,
    // 需求 15.1: 延迟加载（非首屏图片）
    loading: priority ? undefined : ('lazy' as const),
    // 首屏图片使用 priority 预加载
    priority,
    // 需求 15.3: 使用 sizes 属性实现响应式图片
    sizes: imageSizes,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    style: {
      objectFit,
      objectPosition,
    },
    // 需求 15.2: Next.js 自动生成 WebP 格式和 srcset
    // 占位符支持
    placeholder: placeholder as 'blur' | 'empty',
    blurDataURL: blurDataURL || (placeholder === 'blur' ? generateBlurPlaceholder() : undefined),
    onLoad: handleLoad,
    onError: handleError,
  };

  /**
   * 填充模式：图片填充整个容器
   * 需求 4.5: 保持宽高比
   */
  if (fill) {
    return (
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: aspectRatio || '16/9',
        }}
      >
        <Image {...imageProps} alt={alt} fill />
      </div>
    );
  }

  /**
   * 固定尺寸模式：指定宽高
   */
  if (width && height) {
    return <Image {...imageProps} alt={alt} width={width} height={height} />;
  }

  /**
   * 默认回退：使用宽高比容器
   */
  return (
    <div
      className="relative"
      style={{
        width: width || '100%',
        aspectRatio: aspectRatio || '16/9',
      }}
    >
      <Image {...imageProps} alt={alt} fill />
    </div>
  );
}

/**
 * 预设的 sizes 配置
 *
 * 针对常见使用场景的优化配置
 */
export const IMAGE_SIZES = {
  /** 全宽 Banner 图片 */
  BANNER: '100vw',
  /** 内容区域图片 */
  CONTENT: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
  /** 博客缩略图 */
  BLOG_THUMBNAIL: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  /** 产品卡片 */
  PRODUCT_CARD: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  /** 头像/小图标 */
  AVATAR: '(max-width: 768px) 64px, 96px',
} as const;

/**
 * 预设的宽高比配置
 */
export const ASPECT_RATIOS = {
  /** 16:9 宽屏 */
  WIDE: '16/9',
  /** 4:3 标准 */
  STANDARD: '4/3',
  /** 1:1 正方形 */
  SQUARE: '1/1',
  /** 3:2 摄影 */
  PHOTO: '3/2',
  /** 21:9 超宽屏 */
  ULTRAWIDE: '21/9',
} as const;
