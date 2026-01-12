import { useTranslations } from 'next-intl';
import HeroBanner from '@/components/sections/HeroBanner';
import AboutUs from '@/components/sections/AboutUs';
import Features from '@/components/sections/Features';
import Services from '@/components/sections/Services';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';
import Blog from '@/components/sections/Blog';

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

      {/* Blog 区块 */}
      <Blog />
    </main>
  );
}
