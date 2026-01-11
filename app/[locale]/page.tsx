import { useTranslations } from 'next-intl';

/**
 * 首页组件 - 单页滚动式网站
 * 包含所有主要区块用于测试导航功能
 */
export default function Home() {
  const t = useTranslations();

  return (
    <main className="relative">
      {/* Banner 区块 */}
      <section
        id="banner"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-cyan to-primary-blue"
      >
        <div className="text-center text-white p-8 max-w-4xl">
          <h1 className="text-h1 font-bold mb-6">Better Bags Myanmar</h1>
          <p className="text-h3 mb-8">{t('common.tagline')}</p>
          <p className="text-body max-w-2xl mx-auto mb-8">
            专注于高品质 OEM 背包制造，服务全球客户超过 20 年
          </p>
          <button className="px-8 py-3 bg-white text-primary-blue rounded-lg hover:bg-white/90 transition-all font-semibold">
            获取报价
          </button>
        </div>
      </section>

      {/* About 区块 */}
      <section id="about" className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-h2 font-bold text-primary-blue mb-6 text-center">
            关于我们
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-h4 font-semibold text-primary-blue mb-4">
                我们的使命
              </h3>
              <p className="text-body text-gray-700">
                为全球品牌和合作伙伴提供创新、高质量、高性价比的背包解决方案
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-h4 font-semibold text-primary-blue mb-4">
                我们的愿景
              </h3>
              <p className="text-body text-gray-700">
                成为全球最值得信赖的背包制造合作伙伴
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features 区块 */}
      <section
        id="features"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="max-w-6xl mx-auto p-8">
          <h2 className="text-h2 font-bold text-primary-blue mb-12 text-center">
            核心优势
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['灵活性', '沟通', '质量控制', '竞争力价格'].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-h4 font-semibold text-primary-blue mb-3">
                  {feature}
                </h3>
                <p className="text-body text-gray-600">
                  专业的服务和卓越的品质保证
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services 区块 */}
      <section id="services" className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-h2 font-bold text-primary-blue mb-12 text-center">
            服务流程
          </h2>
          <div className="space-y-4">
            {['咨询', '报价', '打样', '量产', '质检', '交付'].map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-gray-50 p-6 rounded-lg"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary-cyan text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-h4 font-semibold text-primary-blue">
                    {step}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 区块 */}
      <section
        id="faq"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-h2 font-bold text-primary-blue mb-12 text-center">
            常见问题
          </h2>
          <div className="space-y-4">
            {[
              { q: '最小起订量是多少？', a: '我们的 MOQ 是 150 件/款/色' },
              { q: '打样需要多长时间？', a: '通常 7-10 个工作日' },
              { q: '是否接受 OEM 订单？', a: '是的，我们专注于 OEM/ODM 制造' },
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-h4 font-semibold text-primary-blue mb-2">
                  {item.q}
                </h3>
                <p className="text-body text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact 区块 */}
      <section
        id="contact"
        className="min-h-screen flex items-center justify-center bg-primary-blue text-white"
      >
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-h2 font-bold mb-12 text-center">联系我们</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-h4 font-semibold mb-4">联系信息</h3>
              <div className="space-y-3">
                <p className="text-body">📧 Email: jay@biteerbags.com</p>
                <p className="text-body">📱 Phone: +1 814.880.1463</p>
                <p className="text-body">
                  📍 Address: Yangon, Myanmar
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-h4 font-semibold mb-4">工作时间</h3>
              <p className="text-body">周一至周五：9:00 - 17:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blogs 区块 */}
      <section
        id="blogs"
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-h2 font-bold text-primary-blue mb-12 text-center">
            博客
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-primary-cyan to-primary-blue"></div>
                <div className="p-4">
                  <h3 className="text-h4 font-semibold text-primary-blue mb-2">
                    博客文章 {item}
                  </h3>
                  <p className="text-body text-gray-600">
                    最新的行业动态和公司新闻
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
