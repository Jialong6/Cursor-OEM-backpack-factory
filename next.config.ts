import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // 解决多 lockfile 警告：明确指定项目根目录为工作区
  outputFileTracingRoot: __dirname,

  /**
   * 性能优化配置 - 需求 15.4, 15.5
   * Task 15.1: 配置资源压缩和优化
   */

  // 生产环境优化
  productionBrowserSourceMaps: false, // 禁用生产环境 source maps 以减小包大小

  // 压缩配置（Next.js 15 默认使用 SWC minifier）
  // swcMinify 在 Next.js 13+ 默认为 true，这里显式声明以确保启用
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // 生产环境移除 console.log，保留 error 和 warn
    } : false,
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'], // 优先使用现代图片格式
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // 响应式图片尺寸
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 小图标尺寸
    minimumCacheTTL: 60, // 图片缓存时间（秒）
  },

  // 实验性功能
  experimental: {
    // 启用优化的包导入（减少包大小）
    optimizePackageImports: ['react-hook-form', '@hookform/resolvers', 'zod'],
  },
};

export default withNextIntl(nextConfig);
