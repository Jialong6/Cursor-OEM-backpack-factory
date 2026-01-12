import { useTranslations } from 'next-intl';
import HeroBanner from '@/components/sections/HeroBanner';
import AboutUs from '@/components/sections/AboutUs';
import Features from '@/components/sections/Features';
import Services from '@/components/sections/Services';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';

/**
 * 首页组件 - 单页滚动式网站
 * 包含所有主要区块用于测试导航功能
 */
export default function Home() {
  const t = useTranslations();

  return (
    <main className="relative">
      {/* Banner 区块 */}
      <HeroBanner />

      {/* About 区块 */}
      <AboutUs />

      {/* Features 区块 */}
      <Features />

      {/* Services 区块 */}
      <Services />

      {/* FAQ 区块 */}
      <FAQ />

      {/* Contact 区块 */}
      <Contact />

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
