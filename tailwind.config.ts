import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Better Bags Myanmar 品牌色
        primary: {
          cyan: "#81C3D7",
          blue: "#416788",
        },
        secondary: {
          grey: "#5a6d7c",
        },
        dark: {
          blue: "#2f6690",
        },
      },
      fontSize: {
        // 流式字体尺寸 (使用 clamp 实现响应式)
        'body': 'clamp(0.875rem, 0.75rem + 0.5vw, 1.125rem)', // 14px-18px
        'h1': 'clamp(2rem, 1.5rem + 2vw, 3.5rem)',            // 32px-56px
        'h2': 'clamp(1.5rem, 1.25rem + 1.5vw, 2.5rem)',       // 24px-40px
        'h3': 'clamp(1.25rem, 1rem + 1vw, 2rem)',             // 20px-32px
        'h4': 'clamp(1.125rem, 0.875rem + 0.75vw, 1.5rem)',  // 18px-24px
      },
    },
  },
  plugins: [],
};

export default config;
