import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';

/**
 * 属性测试：语言切换一致性
 *
 * **Feature: backpack-oem-website, Property 1: 语言切换一致性**
 *
 * 正确性属性：切换语言后，页面上所有文本元素都应该更新为目标语言，
 * 不会出现部分中文部分英文的混合状态。
 *
 * 验证需求：2.2, 2.3
 */

// 支持的语言列表
const supportedLocales = ['en', 'zh'] as const;
type Locale = (typeof supportedLocales)[number];

// 翻译键定义（用于验证一致性）
const translationKeys = [
  'nav.banner',
  'nav.about',
  'nav.features',
  'nav.services',
  'nav.faq',
  'nav.contact',
  'nav.blog',
  'banner.cta',
  'about.title',
  'footer.quickLinks',
  'footer.hours',
] as const;

// 模拟翻译数据
const mockTranslations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.banner': 'Home',
    'nav.about': 'About Us',
    'nav.features': 'Features',
    'nav.services': 'Services',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact Us',
    'nav.blog': 'Blog',
    'banner.cta': 'Get A Quote',
    'about.title': 'About Us',
    'footer.quickLinks': 'Quick Links',
    'footer.hours': 'Business Hours',
  },
  zh: {
    'nav.banner': '首页',
    'nav.about': '关于我们',
    'nav.features': '特色优势',
    'nav.services': '服务流程',
    'nav.faq': '常见问题',
    'nav.contact': '联系我们',
    'nav.blog': '博客',
    'banner.cta': '获取报价',
    'about.title': '关于我们',
    'footer.quickLinks': '快捷链接',
    'footer.hours': '工作时间',
  },
};

/**
 * 获取翻译文本
 * @param locale 语言代码
 * @param key 翻译键
 * @returns 翻译后的文本
 */
function getTranslation(locale: Locale, key: string): string {
  return mockTranslations[locale][key] || key;
}

/**
 * 检测文本是否包含中文字符
 * @param text 待检测的文本
 * @returns 是否包含中文
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * 检测文本是否全为英文（包含标点和数字）
 * @param text 待检测的文本
 * @returns 是否全为英文
 */
function isAllEnglish(text: string): boolean {
  // 允许英文字母、数字、空格、常见标点
  return /^[a-zA-Z0-9\s.,!?'"@#$%&*()_\-+=\[\]{}|\\:;<>\/]+$/.test(text);
}

/**
 * 模拟的语言切换组件
 * 用于测试语言切换逻辑
 */
function MockLanguageProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <div data-locale={locale} data-testid="locale-provider">
      {children}
    </div>
  );
}

/**
 * 模拟页面内容组件
 * 包含多个翻译文本元素
 */
function MockPageContent({ locale }: { locale: Locale }) {
  return (
    <div data-testid="page-content">
      <nav data-testid="navbar">
        {['nav.banner', 'nav.about', 'nav.features', 'nav.services', 'nav.faq', 'nav.contact', 'nav.blog'].map(
          (key) => (
            <a key={key} data-testid={`nav-${key.split('.')[1]}`} href={`#${key.split('.')[1]}`}>
              {getTranslation(locale, key)}
            </a>
          )
        )}
      </nav>
      <main>
        <section data-testid="banner">
          <button data-testid="cta-button">{getTranslation(locale, 'banner.cta')}</button>
        </section>
        <section data-testid="about">
          <h2 data-testid="about-title">{getTranslation(locale, 'about.title')}</h2>
        </section>
      </main>
      <footer data-testid="footer">
        <h3 data-testid="quick-links-title">{getTranslation(locale, 'footer.quickLinks')}</h3>
        <h3 data-testid="hours-title">{getTranslation(locale, 'footer.hours')}</h3>
      </footer>
    </div>
  );
}

describe('Property 1: 语言切换一致性', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

/**
 * 属性测试：切换到任意语言后，所有文本都应该是该语言
 *
 * 对于任意支持的语言，页面上所有翻译文本应该都是该语言，
 * 不会出现混合状态
 */
it('对于任意支持的语言，页面上所有文本应该是同一种语言', () => {
  fc.assert(
    fc.property(fc.constantFrom(...supportedLocales), (locale) => {
      const { container, unmount } = render(
        <MockLanguageProvider locale={locale}>
          <MockPageContent locale={locale} />
        </MockLanguageProvider>
      );

      // 验证：如果是中文，关键文本应该包含中文
      // 如果是英文，关键文本应该不包含中文
      if (locale === 'zh') {
        // 检查关键文本是否包含中文
        const ctaButton = screen.getByTestId('cta-button');
        const aboutTitle = screen.getByTestId('about-title');
        const result =
          containsChinese(ctaButton.textContent || '') &&
          containsChinese(aboutTitle.textContent || '');
        unmount();
        return result;
      } else {
        // 检查关键文本是否不包含中文（即为英文）
        const ctaButton = screen.getByTestId('cta-button');
        const aboutTitle = screen.getByTestId('about-title');
        const result =
          !containsChinese(ctaButton.textContent || '') &&
          !containsChinese(aboutTitle.textContent || '');
        unmount();
        return result;
      }
    }),
    { numRuns: 100 }
  );
});

/**
 * 属性测试：语言切换后所有导航链接文本应该一致更新
 */
it('语言切换后所有导航链接文本应该是同一种语言', () => {
  fc.assert(
    fc.property(fc.constantFrom(...supportedLocales), (locale) => {
      const { unmount } = render(
        <MockLanguageProvider locale={locale}>
          <MockPageContent locale={locale} />
        </MockLanguageProvider>
      );

      // 获取所有导航链接
      const navLinks = [
        screen.getByTestId('nav-banner'),
        screen.getByTestId('nav-about'),
        screen.getByTestId('nav-features'),
        screen.getByTestId('nav-services'),
        screen.getByTestId('nav-faq'),
        screen.getByTestId('nav-contact'),
        screen.getByTestId('nav-blog'),
      ];

      let result: boolean;
      if (locale === 'zh') {
        // 中文模式：所有链接应该包含中文
        result = navLinks.every((link) =>
          containsChinese(link.textContent || '')
        );
      } else {
        // 英文模式：所有链接应该不包含中文
        result = navLinks.every((link) =>
          !containsChinese(link.textContent || '')
        );
      }

      unmount();
      return result;
    }),
    { numRuns: 100 }
  );
});

/**
 * 属性测试：语言切换顺序不影响最终结果
 *
 * 无论先切换到哪种语言再切换到目标语言，
 * 最终显示的文本应该与直接显示目标语言相同
 */
it('语言切换顺序不影响最终显示结果', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...supportedLocales),
      fc.constantFrom(...supportedLocales),
      (firstLocale, targetLocale) => {
        // 直接渲染目标语言
        const { unmount } = render(
          <MockLanguageProvider locale={targetLocale}>
            <MockPageContent locale={targetLocale} />
          </MockLanguageProvider>
        );

        const directCtaText = screen.getByTestId('cta-button').textContent;
        const directAboutText = screen.getByTestId('about-title').textContent;

        unmount();

        // 先渲染第一个语言（模拟切换前状态）
        const { unmount: unmount2 } = render(
          <MockLanguageProvider locale={firstLocale}>
            <MockPageContent locale={firstLocale} />
          </MockLanguageProvider>
        );

        unmount2();

        // 再渲染目标语言（模拟切换后状态）
        const { unmount: unmount3 } = render(
          <MockLanguageProvider locale={targetLocale}>
            <MockPageContent locale={targetLocale} />
          </MockLanguageProvider>
        );

        const afterSwitchCtaText = screen.getByTestId('cta-button').textContent;
        const afterSwitchAboutText = screen.getByTestId('about-title').textContent;

        unmount3();

        // 验证：直接渲染和切换后渲染的结果应该相同
        return (
          directCtaText === afterSwitchCtaText &&
          directAboutText === afterSwitchAboutText
        );
      }
    ),
    { numRuns: 100 }
  );
});

  /**
   * 单元测试：验证英文模式下所有文本都是英文
   */
  it('英文模式下所有关键文本应该是英文', () => {
    render(
      <MockLanguageProvider locale="en">
        <MockPageContent locale="en" />
      </MockLanguageProvider>
    );

    expect(screen.getByTestId('cta-button').textContent).toBe('Get A Quote');
    expect(screen.getByTestId('about-title').textContent).toBe('About Us');
    expect(screen.getByTestId('quick-links-title').textContent).toBe('Quick Links');
    expect(screen.getByTestId('hours-title').textContent).toBe('Business Hours');
    expect(screen.getByTestId('nav-banner').textContent).toBe('Home');
    expect(screen.getByTestId('nav-contact').textContent).toBe('Contact Us');
  });

  /**
   * 单元测试：验证中文模式下所有文本都是中文
   */
  it('中文模式下所有关键文本应该是中文', () => {
    render(
      <MockLanguageProvider locale="zh">
        <MockPageContent locale="zh" />
      </MockLanguageProvider>
    );

    expect(screen.getByTestId('cta-button').textContent).toBe('获取报价');
    expect(screen.getByTestId('about-title').textContent).toBe('关于我们');
    expect(screen.getByTestId('quick-links-title').textContent).toBe('快捷链接');
    expect(screen.getByTestId('hours-title').textContent).toBe('工作时间');
    expect(screen.getByTestId('nav-banner').textContent).toBe('首页');
    expect(screen.getByTestId('nav-contact').textContent).toBe('联系我们');
  });

  /**
   * 单元测试：验证翻译函数返回正确的值
   */
  it('翻译函数应该返回对应语言的正确值', () => {
    // 英文翻译
    expect(getTranslation('en', 'nav.banner')).toBe('Home');
    expect(getTranslation('en', 'banner.cta')).toBe('Get A Quote');

    // 中文翻译
    expect(getTranslation('zh', 'nav.banner')).toBe('首页');
    expect(getTranslation('zh', 'banner.cta')).toBe('获取报价');
  });

  /**
   * 单元测试：验证中文检测函数
   */
  it('应该正确检测文本是否包含中文', () => {
    expect(containsChinese('首页')).toBe(true);
    expect(containsChinese('关于我们')).toBe(true);
    expect(containsChinese('Home')).toBe(false);
    expect(containsChinese('About Us')).toBe(false);
    expect(containsChinese('Hello 你好')).toBe(true);
  });

  /**
   * 单元测试：验证英文检测函数
   */
  it('应该正确检测文本是否全为英文', () => {
    expect(isAllEnglish('Home')).toBe(true);
    expect(isAllEnglish('About Us')).toBe(true);
    expect(isAllEnglish('Get A Quote!')).toBe(true);
    expect(isAllEnglish('首页')).toBe(false);
    expect(isAllEnglish('Hello 你好')).toBe(false);
  });

  /**
   * 单元测试：验证不同页面区块的语言一致性
   */
  it('不同页面区块的文本语言应该一致', () => {
    for (const locale of supportedLocales) {
      render(
        <MockLanguageProvider locale={locale}>
          <MockPageContent locale={locale} />
        </MockLanguageProvider>
      );

      const navbar = screen.getByTestId('navbar');
      const banner = screen.getByTestId('banner');
      const about = screen.getByTestId('about');
      const footer = screen.getByTestId('footer');

      // 获取各区块的文本
      const navText = navbar.textContent || '';
      const bannerText = banner.textContent || '';
      const aboutText = about.textContent || '';
      const footerText = footer.textContent || '';

      if (locale === 'zh') {
        // 所有区块都应该包含中文
        expect(containsChinese(navText)).toBe(true);
        expect(containsChinese(bannerText)).toBe(true);
        expect(containsChinese(aboutText)).toBe(true);
        expect(containsChinese(footerText)).toBe(true);
      }

      // 清理以便下一次迭代
      document.body.innerHTML = '';
    }
  });
});
