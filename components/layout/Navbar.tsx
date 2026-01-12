'use client';

import { useEffect, useState, useRef } from 'react';
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
  { id: 'blog', href: '#blog', key: 'blog' },
] as const;

/**
 * 固定导航栏组件
 *
 * 功能：
 * - 固定定位在视口顶部（sticky）
 * - 滚动时背景变化（从透明到半透明背景）
 * - 当前区块高亮指示（Intersection Observer）
 * - 平滑滚动导航
 * - 响应式汉堡菜单（<768px）
 * - 键盘导航和焦点管理
 * - 集成语言切换器
 *
 * 需求: 5.1, 5.2, 3.3, 3.4, 5.4, 5.5, 5.6
 */
export default function Navbar() {
  const t = useTranslations('nav');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('banner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
   * 键盘导航：ESC 键关闭菜单
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  /**
   * 焦点陷阱：当菜单打开时，焦点保持在菜单内
   */
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      // 获取菜单内所有可聚焦元素
      const focusableElements = mobileMenuRef.current.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // 聚焦第一个元素
      firstElement?.focus();

      // 处理 Tab 键循环
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isMobileMenuOpen]);

  /**
   * 锁定滚动：菜单打开时防止背景滚动
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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

      // 移动端：点击导航后关闭菜单
      setIsMobileMenuOpen(false);
    }
  };

  /**
   * 切换移动端菜单
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
            className="flex items-center space-x-2 group z-50"
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

          {/* 右侧：语言切换器 + 汉堡菜单按钮 */}
          <div className="flex items-center gap-2 z-50">
            {/* 语言切换器 */}
            <LanguageSwitcher />

            {/* 汉堡菜单按钮 - 移动端 */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary-cyan"
              aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                {/* 第一条线 */}
                <span
                  className={`
                    block h-0.5 w-6 bg-current transition-all duration-300
                    ${isScrolled ? 'bg-gray-900' : 'bg-white'}
                    ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}
                  `}
                />
                {/* 第二条线 */}
                <span
                  className={`
                    block h-0.5 w-6 bg-current transition-all duration-300
                    ${isScrolled ? 'bg-gray-900' : 'bg-white'}
                    ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}
                  `}
                />
                {/* 第三条线 */}
                <span
                  className={`
                    block h-0.5 w-6 bg-current transition-all duration-300
                    ${isScrolled ? 'bg-gray-900' : 'bg-white'}
                    ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}
                  `}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单抽屉 */}
      <div
        ref={mobileMenuRef}
        className={`
          md:hidden fixed inset-0 top-20 z-40
          transition-all duration-300 ease-in-out
          ${
            isMobileMenuOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }
        `}
      >
        {/* 背景遮罩 */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* 菜单内容 */}
        <div
          className={`
            absolute right-0 top-0 bottom-0 w-64
            bg-white shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(({ id, href, key }) => (
              <Link
                key={id}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={`
                  px-4 py-3 rounded-lg text-base font-medium
                  transition-all duration-200
                  ${
                    activeSection === id
                      ? 'bg-primary-cyan/20 text-primary-blue'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </nav>
  );
}
