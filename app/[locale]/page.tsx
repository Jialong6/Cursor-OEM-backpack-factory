'use client';

import { useEffect, useState } from 'react';
import HeroBanner from '@/components/sections/HeroBanner';
import { BentoHero } from '@/components/bento';
import AboutUs from '@/components/sections/AboutUs';
import Features from '@/components/sections/Features';
import Services from '@/components/sections/Services';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';
import Blog from '@/components/sections/Blog';

/**
 * 首页组件 - 单页滚动式网站
 * 包含所有主要区块用于测试导航功能
 *
 * 功能：
 * - 整合所有区块组件
 * - 处理 URL 锚点自动滚动
 * - 支持页面加载时滚动到指定区块
 * - Bento Grid 布局（可切换）
 *
 * 需求: 3.1, 3.2, 3.5
 */
export default function Home() {
  // Bento Grid 布局开关（可通过 URL 参数控制）
  const [useBentoLayout, setUseBentoLayout] = useState(false);

  useEffect(() => {
    // 检查 URL 参数是否启用 Bento 布局
    const urlParams = new URLSearchParams(window.location.search);
    const bentoParam = urlParams.get('bento');
    if (bentoParam === 'true' || bentoParam === '1') {
      setUseBentoLayout(true);
    }
  }, []);

  /**
   * 处理 URL 锚点自动滚动
   * 当页面加载时，如果 URL 包含 hash（如 #contact），
   * 自动滚动到对应区块
   */
  useEffect(() => {
    // 检查 URL 是否包含 hash
    const hash = window.location.hash;
    if (hash) {
      // 移除 # 号获取目标 ID
      const targetId = hash.replace('#', '');
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // 延迟滚动，确保页面完全渲染
        setTimeout(() => {
          const navbarHeight = 80; // 导航栏高度
          const targetPosition = targetElement.offsetTop - navbarHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }, 100);
      }
    }
  }, []);

  return (
    <main className="relative">
      {/* Banner 区块 - 支持 Bento Grid 布局 */}
      {useBentoLayout ? <BentoHero /> : <HeroBanner />}

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
