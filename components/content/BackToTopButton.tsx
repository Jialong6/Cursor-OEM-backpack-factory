'use client';

/**
 * 返回顶部按钮(博客详情页 footer 用)
 *
 * page.tsx server 化后,页面中唯一的交互点抽成这个小 client 组件;
 * 文案由服务端经 props 传入,组件本身不依赖 i18n hooks。
 */
export default function BackToTopButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="inline-flex items-center text-gray-600 hover:text-primary font-semibold transition-colors"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {label}
    </button>
  );
}
