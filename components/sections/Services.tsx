'use client';

import { useTranslations } from 'next-intl';

/**
 * 服务流程区块组件
 *
 * 功能：
 * - 展示"优化过的面向量产的一站式服务"标题
 * - 展示六步服务流程：接收客户询盘、生产报价、样品开发、批量生产、质量控制、包装与运输
 * - 每个步骤包含详细描述
 * - 响应式布局：移动端纵向，桌面端网格布局
 *
 * 验证需求：9.1, 9.2, 9.3, 9.4
 */
export default function Services() {
  const t = useTranslations('services');

  // 获取六个服务步骤
  const steps = t.raw('steps') as Array<{
    title: string;
    desc: string;
  }>;

  // 步骤图标配置
  const stepIcons = [
    // 1. 接收客户询盘 - 邮件图标
    <svg key={1} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>,
    // 2. 生产报价 - 计算器图标
    <svg key={2} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>,
    // 3. 样品开发 - 画板图标
    <svg key={3} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>,
    // 4. 批量生产 - 工厂图标
    <svg key={4} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>,
    // 5. 质量控制 - 检查图标
    <svg key={5} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    // 6. 包装与运输 - 货运图标
    <svg key={6} className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>,
  ];

  return (
    <section
      id="services"
      className="relative bg-white px-6 py-20 md:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* 标题 */}
        <h2 className="mb-16 text-center text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
          {t('title')}
        </h2>

        {/* 服务步骤网格 */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative rounded-xl bg-white border border-neutral-200 p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              {/* 步骤编号和图标 */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  {stepIcons[index]}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                  {index + 1}
                </div>
              </div>

              {/* 步骤标题 */}
              <h3 className="mb-4 text-xl font-bold text-neutral-800 md:text-2xl">
                {step.title}
              </h3>

              {/* 步骤描述 */}
              <p className="leading-relaxed text-neutral-600">
                {step.desc}
              </p>

              {/* 连接线（桌面端显示，最后一个不显示） */}
              {index < steps.length - 1 && (
                <div className="absolute -bottom-4 left-1/2 hidden h-8 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary to-transparent md:block lg:hidden lg:even:block" />
              )}
            </div>
          ))}
        </div>

        {/* 流程说明 */}
        <div className="mt-16 rounded-xl bg-neutral-50 border border-neutral-200 p-8 text-center">
          <p className="text-lg text-neutral-600">
            <span className="font-semibold text-primary">从询盘到交付</span>，我们的专业团队全程支持，
            <span className="font-semibold text-primary">确保每个环节高效透明</span>，
            让您的定制项目顺利落地。
          </p>
        </div>
      </div>
    </section>
  );
}
