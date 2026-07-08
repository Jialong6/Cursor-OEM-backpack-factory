/**
 * 虚拟看厂落地页展示组件(纯展示,无 'use client'、无 hooks)
 *
 * 结构自上而下:
 * - header:h1 + 副标题 + 简介 + 亮点徽章行(60 分钟/免费/Zoom 或 Meet)
 * - What You'll See:4 卡(裁剪备料/缝制/QC+X 光验针/包装成品仓)
 * - How It Works:3 步预约流程
 * - 预约区:标题 + bookingSlot(由页面注入 CalTourEmbed client island,
 *   保持本组件可服务端直出、可零 mock 测试)
 * - 参观详情:dl 键值对(时长/平台/时段/语言/费用)
 *
 * 样式基调沿用 FactSheet 页(浅灰底 + 白色卡片);
 * 不可变:所有列表以 ReadonlyArray 传入,map 渲染。
 */

interface TourCard {
  readonly title: string;
  readonly desc: string;
}

interface TourDetail {
  readonly label: string;
  readonly value: string;
}

interface VirtualTourProps {
  readonly title: string;
  readonly subtitle: string;
  readonly intro: string;
  readonly highlights: ReadonlyArray<string>;
  readonly whatYouSeeTitle: string;
  readonly whatYouSeeItems: ReadonlyArray<TourCard>;
  readonly howItWorksTitle: string;
  readonly howItWorksSteps: ReadonlyArray<TourCard>;
  readonly detailsTitle: string;
  readonly detailsItems: ReadonlyArray<TourDetail>;
  readonly bookingTitle: string;
  /** 预约日历区插槽(client 组件 CalTourEmbed 或替代卡) */
  readonly bookingSlot: React.ReactNode;
}

/**
 * 虚拟看厂落地页展示组件
 */
export default function VirtualTour({
  title,
  subtitle,
  intro,
  highlights,
  whatYouSeeTitle,
  whatYouSeeItems,
  howItWorksTitle,
  howItWorksSteps,
  detailsTitle,
  detailsItems,
  bookingTitle,
  bookingSlot,
}: VirtualTourProps) {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 页头:标题 + 副标题 + 简介 + 亮点 */}
        <header className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-primary font-semibold mb-4">
            {subtitle}
          </p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            {intro}
          </p>
          <ul className="flex flex-col sm:flex-row justify-center gap-3">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="inline-flex items-center justify-center rounded-full bg-white border border-neutral-200 px-5 py-2 text-sm font-medium text-neutral-700"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </header>

        {/* What You'll See:4 卡 */}
        <section aria-labelledby="tour-what-you-see" className="mb-14">
          <h2
            id="tour-what-you-see"
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8"
          >
            {whatYouSeeTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {whatYouSeeItems.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works:3 步 */}
        <section aria-labelledby="tour-how-it-works" className="mb-14">
          <h2
            id="tour-how-it-works"
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8"
          >
            {howItWorksTitle}
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorksSteps.map((step, index) => (
              <li
                key={step.title}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 预约区:CalTourEmbed client island 或替代卡 */}
        <section aria-labelledby="tour-booking" className="mb-14">
          <h2
            id="tour-booking"
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8"
          >
            {bookingTitle}
          </h2>
          {bookingSlot}
        </section>

        {/* 参观详情:键值对 */}
        <section aria-labelledby="tour-details">
          <h2
            id="tour-details"
            className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8"
          >
            {detailsTitle}
          </h2>
          <dl className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {detailsItems.map((item) => (
              <div
                key={item.label}
                className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4"
              >
                <dt className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {item.label}
                </dt>
                <dd className="mt-1 text-base text-gray-900 sm:mt-0 sm:col-span-2">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
