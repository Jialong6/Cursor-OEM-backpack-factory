'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * 导航链接配置
 */
const navItems = [
  { id: 'banner', href: '#banner', key: 'banner' },
  { id: 'about', href: '#about', key: 'about' },
  { id: 'features', href: '#features', key: 'features' },
  { id: 'services', href: '#services', key: 'services' },
  { id: 'faq', href: '#faq', key: 'faq' },
  { id: 'contact', href: '#contact', key: 'contact' },
  { id: 'blogs', href: '#blogs', key: 'blogs' },
] as const;

/**
 * 固定导航栏组件
 *
 * 功能：
 * - 固定定位在视口顶部（sticky）
 * - 滚动时背景变化（从透明到半透明背景）
 * - 当前区块高亮指示（Intersection Observer）
 * - 平滑滚动导航
 * - 集成语言切换器
 *
 * 需求: 5.1, 5.2, 3.3, 3.4
 */
export default function Navbar() {
  const t = useTranslations('nav');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('banner');

  /**
   * 监听页面滚动，改变导航栏样式
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * 使用 Intersection Observer 检测当前可见区块
   */
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // 当区块在视口中间 20%-30% 时触发
      threshold: 0,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // 观察所有导航对应的区块
    navItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  /**
   * 平滑滚动到目标区块
   */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const navbarHeight = 80; // 导航栏高度
      const targetPosition = targetElement.offsetTop - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300 ease-in-out
        ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="#banner"
            onClick={(e) => handleNavClick(e, '#banner')}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-cyan to-primary-blue rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-xl">BB</span>
            </div>
            <div className="hidden sm:block">
              <span
                className={`
                  text-xl font-bold transition-colors
                  ${isScrolled ? 'text-primary-blue' : 'text-white'}
                `}
              >
                Better Bags
              </span>
            </div>
          </Link>

          {/* 导航链接 - 桌面端 */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ id, href, key }) => (
              <Link
                key={id}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    activeSection === id
                      ? isScrolled
                        ? 'bg-primary-cyan/20 text-primary-blue'
                        : 'bg-white/30 text-white backdrop-blur-sm'
                      : isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white/90 hover:bg-white/20'
                  }
                `}
              >
                {t(key)}
              </Link>
            ))}
          </div>

          {/* 语言切换器 */}
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
