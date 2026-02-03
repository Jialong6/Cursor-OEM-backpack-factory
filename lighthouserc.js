/**
 * Lighthouse CI 配置
 *
 * 定义性能、无障碍、最佳实践和 SEO 的目标分数，
 * 以及 Core Web Vitals 的阈值。
 *
 * 运行方式: npx lhci autorun
 */

module.exports = {
  ci: {
    collect: {
      // 使用本地构建产物启动服务器
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,

      // 审计的页面 URL
      url: [
        'http://localhost:3000/en',
        'http://localhost:3000/zh',
      ],

      // 每个 URL 运行 3 次取中位数
      numberOfRuns: 3,

      settings: {
        // 模拟移动设备
        preset: 'desktop',
        // 禁用 throttling 以获得更快的本地测试
        throttlingMethod: 'provided',
      },
    },

    assert: {
      assertions: {
        // Lighthouse 评分目标 (0-1 scale, 0.9 = 90 分)
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },

    upload: {
      // 本地临时存储（不上传到外部服务）
      target: 'temporary-public-storage',
    },
  },
};
