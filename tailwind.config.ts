import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Task 16: 多语言字体回退栈
        // 使用 CSS 变量引用 next/font/google 加载的字体
        sans: [
          'var(--font-noto-sans)',
          'var(--font-noto-sans-sc)',
          'var(--font-noto-sans-tc)',
          'var(--font-noto-sans-jp)',
          'Arial',
          'Helvetica Neue',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // Better Bags Myanmar 品牌色 - 极简绿色主题
        primary: {
          light: "#a3c293",    // 浅绿色 - 用于hover背景
          DEFAULT: "#87A575",  // Logo绿 - 主色调
          dark: "#6b8a5e",     // 深绿色 - 用于hover按钮
        },
        // 中性色 - 极简风格
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // 添加品牌色别名，方便使用
        'brand-green': "#87A575",
        'brand-green-light': "#a3c293",
        'brand-green-dark': "#6b8a5e",
      },
      fontSize: {
        // 流式字体尺寸 (使用 clamp 实现响应式)
        // 需求 4.1, 4.2: 全平台自适应字体大小
        'body': ['clamp(0.875rem, 0.75rem + 0.5vw, 1.125rem)', { lineHeight: '1.75' }], // 14px-18px
        'h1': ['clamp(2rem, 1.5rem + 2vw, 3.5rem)', { lineHeight: '1.2', fontWeight: '700' }],       // 32px-56px
        'h2': ['clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem)', { lineHeight: '1.3', fontWeight: '700' }],  // 24px-40px
        'h3': ['clamp(1.25rem, 1rem + 1vw, 2rem)', { lineHeight: '1.4', fontWeight: '600' }],        // 20px-32px
        'h4': ['clamp(1.125rem, 0.875rem + 0.75vw, 1.5rem)', { lineHeight: '1.5', fontWeight: '600' }], // 18px-24px
        'h5': ['clamp(1rem, 0.875rem + 0.5vw, 1.25rem)', { lineHeight: '1.5', fontWeight: '600' }],  // 16px-20px
      },
      spacing: {
        // 响应式间距 (使用 clamp 实现流式间距)
        // 需求 4.4: 使用相对单位定义间距和尺寸
        'fluid-xs': 'clamp(0.25rem, 0.125rem + 0.5vw, 0.5rem)',   // 4px-8px
        'fluid-sm': 'clamp(0.5rem, 0.25rem + 1vw, 1rem)',         // 8px-16px
        'fluid-md': 'clamp(1rem, 0.5rem + 2vw, 2rem)',            // 16px-32px
        'fluid-lg': 'clamp(1.5rem, 1rem + 2vw, 3rem)',            // 24px-48px
        'fluid-xl': 'clamp(2rem, 1rem + 4vw, 4rem)',              // 32px-64px
        'fluid-2xl': 'clamp(3rem, 2rem + 4vw, 6rem)',             // 48px-96px
      },
      maxWidth: {
        // 响应式最大宽度
        'prose': 'clamp(45ch, 50%, 75ch)', // 适合阅读的文本宽度
      },
      borderRadius: {
        // 响应式圆角
        'fluid': 'clamp(0.5rem, 0.25rem + 1vw, 1rem)', // 8px-16px
      },
    },
  },
  plugins: [],
};

export default config;
