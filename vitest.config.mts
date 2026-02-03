import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 使用 happy-dom 环境模拟浏览器 DOM
    environment: 'happy-dom',

    // 全局设置文件
    setupFiles: ['./tests/setup.ts'],

    // 包含测试文件的模式
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // 排除的目录
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
    ],

    // 测试覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '.next/',
      ],
    },

    // 全局变量支持（用于 @testing-library）
    globals: true,

    // 属性测试（fast-check asyncProperty）需要更长的超时时间
    testTimeout: 30000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/locales': path.resolve(__dirname, './locales'),
    },
  },
})
