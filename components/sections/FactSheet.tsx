/**
 * Fact Sheet 展示组件(纯展示,无 'use client'、无 hooks)
 *
 * 为 GEO / AI 搜索优化提供一个"确定、短、可引用"的公司事实页面:
 * - 语义结构:main > h1 > intro > dl(dt/dd 键值对)> lastUpdated
 * - 服务端直出(SSR),事实不依赖客户端 JS,便于爬虫与 AI 引擎抓取
 * - 不可变:facts 以 ReadonlyArray 传入,map 渲染,不做任何原地修改
 *
 * 样式基调沿用 glossary 页(浅灰底 + 白色卡片),事实卡片用 divide-y 分隔。
 */

interface FactItem {
  readonly label: string;
  readonly value: string;
}

interface FactSheetProps {
  readonly title: string;
  readonly intro: string;
  readonly lastUpdated: string;
  readonly facts: ReadonlyArray<FactItem>;
}

/**
 * 公司事实页展示组件
 *
 * @param title 页面主标题(h1)
 * @param intro 引导语(引用说明)
 * @param lastUpdated 最后更新时间文案
 * @param facts 事实键值对列表(label/value)
 */
export default function FactSheet({
  title,
  intro,
  lastUpdated,
  facts,
}: FactSheetProps) {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 页面标题 */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {title}
        </h1>

        {/* 引导语:引用说明 */}
        <p className="text-lg text-gray-600 leading-relaxed mb-10">{intro}</p>

        {/* 事实列表:白色卡片 + 分隔线,每行一个键值对 */}
        <dl className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4"
            >
              <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {fact.label}
              </dt>
              <dd className="mt-1 text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* 最后更新时间 */}
        <p className="mt-8 text-sm text-gray-500">{lastUpdated}</p>
      </div>
    </main>
  );
}
