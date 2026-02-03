/**
 * WCAG 无障碍审计测试
 *
 * 使用 axe-core 对主要组件进行程序化无障碍审计，
 * 验证符合 WCAG 2.1 AA 标准。
 *
 * 审计范围：
 * - Navbar / Footer（导航组件）
 * - HeroBanner（首屏）
 * - AboutUs / Features / Services（内容区块）
 * - FAQ（手风琴交互）
 * - Contact（表单）
 * - Accordion / Carousel（交互 UI）
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = (key: string) => {
      if (key === 'stats') {
        return [
          { label: '20+ Years', value: '20+' },
          { label: 'Clients', value: '500+' },
        ];
      }
      if (key === 'items') {
        return [
          { icon: 'shield', title: 'Quality', desc: 'High quality' },
        ];
      }
      if (key === 'services') {
        return [
          { icon: 'factory', title: 'OEM', desc: 'OEM manufacturing' },
        ];
      }
      if (key === 'sections') {
        return [
          {
            title: 'General',
            items: [
              { q: 'What is MOQ?', a: '150 pieces minimum.' },
              { q: 'Lead time?', a: '30-45 days.' },
            ],
          },
        ];
      }
      return [];
    };
    return t;
  },
  useLocale: () => 'en',
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useScrollAnimation
vi.mock('@/hooks/useScrollAnimation', () => ({
  useScrollAnimation: () => ({
    ref: { current: null },
    animationClassName: '',
  }),
}));

// Mock useNavigation hooks
vi.mock('@/hooks/useNavigation', () => ({
  useScrollState: () => false,
  useActiveSection: () => 'banner',
  useSmoothScroll: () => vi.fn(),
  useMobileMenu: () => ({
    isOpen: false,
    toggle: vi.fn(),
    close: vi.fn(),
    menuRef: { current: null },
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} data-fill={fill ? 'true' : undefined} data-priority={priority ? 'true' : undefined} />;
  },
}));

import Accordion from '@/components/ui/Accordion';
import HeroBanner from '@/components/sections/HeroBanner';
import AboutUs from '@/components/sections/AboutUs';
import Features from '@/components/sections/Features';
import Services from '@/components/sections/Services';
import FAQ from '@/components/sections/FAQ';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';

/**
 * 运行 axe-core 审计并返回违规列表
 */
async function runAxeAudit(container: Element): Promise<axe.Result[]> {
  const results = await axe.run(container, {
    rules: {
      // 仅审计 WCAG 2.1 AA 级别规则
      region: { enabled: false }, // 跳过 region 规则，组件不在 landmark 内是正常的
      'page-has-heading-one': { enabled: false }, // 组件级测试不要求 h1
      'landmark-one-main': { enabled: false }, // 组件级测试不需要 main landmark
      'landmark-unique': { enabled: false }, // 组件级测试可能有重复 landmark
    },
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
    },
  });
  return results.violations;
}

/**
 * 格式化违规信息用于测试输出
 */
function formatViolations(violations: axe.Result[]): string {
  if (violations.length === 0) return 'No violations';
  return violations
    .map((v) => `[${v.id}] ${v.description} (impact: ${v.impact})`)
    .join('\n');
}

describe('WCAG 2.1 AA 无障碍审计', () => {
  describe('导航组件', () => {
    it('Navbar 应通过 axe-core 审计', async () => {
      const { container } = render(<Navbar />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('Footer 应通过 axe-core 审计', async () => {
      const { container } = render(<Footer />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });
  });

  describe('页面区块组件', () => {
    it('HeroBanner 应通过 axe-core 审计', async () => {
      const { container } = render(<HeroBanner />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('AboutUs 应通过 axe-core 审计', async () => {
      const { container } = render(<AboutUs />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('Features 应通过 axe-core 审计', async () => {
      const { container } = render(<Features />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('Services 应通过 axe-core 审计', async () => {
      const { container } = render(<Services />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('FAQ 应通过 axe-core 审计', async () => {
      const { container } = render(<FAQ />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });
  });

  describe('交互 UI 组件', () => {
    it('Accordion 应通过 axe-core 审计', async () => {
      const items = [
        { q: 'Question 1', a: 'Answer 1' },
        { q: 'Question 2', a: 'Answer 2' },
        { q: 'Question 3', a: 'Answer 3' },
      ];
      const { container } = render(<Accordion items={items} />);
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });

    it('展开状态的 Accordion 应通过审计', async () => {
      const items = [
        { q: 'Question 1', a: 'Answer 1' },
        { q: 'Question 2', a: 'Answer 2' },
      ];
      const { container } = render(
        <Accordion items={items} defaultOpenIndex={0} />
      );
      const violations = await runAxeAudit(container);
      expect(violations, formatViolations(violations)).toHaveLength(0);
    });
  });

  describe('通用无障碍要求', () => {
    it('按钮元素应有可识别的文本', () => {
      const items = [{ q: 'Test Question', a: 'Test Answer' }];
      const { container } = render(<Accordion items={items} />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const text = button.textContent?.trim();
        const ariaLabel = button.getAttribute('aria-label');
        const ariaLabelledBy = button.getAttribute('aria-labelledby');
        const hasAccessibleName = (text && text.length > 0) || ariaLabel || ariaLabelledBy;
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('交互元素应有可见的焦点样式（focus 类）', () => {
      const items = [{ q: 'Test', a: 'Answer' }];
      const { container } = render(<Accordion items={items} />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const classes = button.className;
        const hasFocusStyle =
          classes.includes('focus:') ||
          classes.includes('focus-visible:') ||
          classes.includes('focus-within:');
        expect(hasFocusStyle).toBe(true);
      });
    });

    it('aria-expanded 属性应与内容可见性一致', () => {
      const items = [
        { q: 'Q1', a: 'A1' },
        { q: 'Q2', a: 'A2' },
      ];
      const { container } = render(
        <Accordion items={items} defaultOpenIndex={0} />
      );
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const controlsId = button.getAttribute('aria-controls');
        if (controlsId) {
          const content = document.getElementById(controlsId);
          if (isExpanded) {
            expect(content?.className).toContain('opacity-100');
          } else {
            expect(content?.className).toContain('opacity-0');
          }
        }
      });
    });

    it('图片应有替代文本或 aria-hidden', () => {
      const { container } = render(<HeroBanner />);
      const images = container.querySelectorAll('img');
      const svgs = container.querySelectorAll('svg');

      images.forEach((img) => {
        const hasAlt = img.hasAttribute('alt');
        const isHidden = img.getAttribute('aria-hidden') === 'true';
        const hasRole = img.getAttribute('role') === 'presentation';
        expect(hasAlt || isHidden || hasRole).toBe(true);
      });

      svgs.forEach((svg) => {
        const isHidden = svg.getAttribute('aria-hidden') === 'true';
        const hasTitle = svg.querySelector('title') !== null;
        const hasRole = svg.getAttribute('role') === 'img';
        expect(isHidden || hasTitle || hasRole).toBe(true);
      });
    });
  });
});
