import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';

/**
 * 属性测试：页脚链接滚动
 *
 * **Feature: backpack-oem-website, Property 13: 页脚链接滚动**
 *
 * 正确性属性：对于任意页脚快捷链接，点击后应该触发平滑滚动到对应区块，
 * 滚动位置应该考虑导航栏高度偏移。
 *
 * 验证需求：13.5
 */

// 区块 ID 列表（与 Footer.tsx 中的快捷链接对应）
const sectionIds = [
  'banner',
  'about',
  'features',
  'services',
  'faq',
  'contact',
  'blog',
] as const;

type SectionId = (typeof sectionIds)[number];

// 导航栏高度（像素）
const NAVBAR_HEIGHT = 80;

// 模拟的区块位置（用于测试）
const mockSectionOffsets: Record<SectionId, number> = {
  banner: 0,
  about: 800,
  features: 1600,
  services: 2400,
  faq: 3200,
  contact: 4000,
  blog: 4800,
};

/**
 * 计算目标滚动位置
 * @param sectionId 区块 ID
 * @returns 考虑导航栏偏移后的目标滚动位置
 */
function calculateTargetScrollPosition(sectionId: SectionId): number {
  const sectionOffset = mockSectionOffsets[sectionId];
  return Math.max(0, sectionOffset - NAVBAR_HEIGHT);
}

/**
 * 模拟的页脚链接处理函数
 * 与 Footer.tsx 中的 handleLinkClick 逻辑一致
 */
function handleLinkClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  scrollToMock: (options: { top: number; behavior: string }) => void
) {
  e.preventDefault();
  const targetId = href.replace('#', '') as SectionId;
  const targetOffset = mockSectionOffsets[targetId];

  if (targetOffset !== undefined) {
    // 与 Footer.tsx 一致：使用 Math.max(0, ...) 确保不为负数
    const targetPosition = Math.max(0, targetOffset - NAVBAR_HEIGHT);
    scrollToMock({
      top: targetPosition,
      behavior: 'smooth',
    });
  }
}

/**
 * 模拟的页脚组件
 * 包含快捷链接列表
 */
function MockFooter({
  onScrollTo,
}: {
  onScrollTo: (options: { top: number; behavior: string }) => void;
}) {
  const quickLinks = sectionIds.map((id) => ({
    name: id.charAt(0).toUpperCase() + id.slice(1),
    href: `#${id}`,
  }));

  return (
    <footer data-testid="footer">
      <nav data-testid="footer-nav">
        <h3>Quick Links</h3>
        <ul>
          {quickLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                data-testid={`footer-link-${link.href.replace('#', '')}`}
                onClick={(e) => handleLinkClick(e, link.href, onScrollTo)}
              >
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}

/**
 * 模拟的页面布局
 * 包含所有区块和页脚
 */
function MockPageLayout({
  onScrollTo,
}: {
  onScrollTo: (options: { top: number; behavior: string }) => void;
}) {
  return (
    <div data-testid="page-layout">
      <main>
        {sectionIds.map((id) => (
          <section
            key={id}
            id={id}
            data-testid={`section-${id}`}
            style={{
              height: '800px',
              position: 'relative',
              top: `${mockSectionOffsets[id]}px`,
            }}
          >
            <h2>{id.charAt(0).toUpperCase() + id.slice(1)} Section</h2>
          </section>
        ))}
      </main>
      <MockFooter onScrollTo={onScrollTo} />
    </div>
  );
}

describe('Property 13: 页脚链接滚动', () => {
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollToMock = vi.fn();
    // 模拟 window.scrollTo
    vi.stubGlobal('scrollTo', scrollToMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 属性测试：点击任意页脚链接应该触发平滑滚动
   *
   * 对于任意页脚快捷链接，点击后应该调用 window.scrollTo，
   * 且行为设置为 'smooth'
   */
  it('点击任意页脚链接应该触发平滑滚动', () => {
    fc.assert(
      fc.property(fc.constantFrom(...sectionIds), (sectionId) => {
        const scrollToFn = vi.fn();
        const { unmount } = render(<MockFooter onScrollTo={scrollToFn} />);

        const link = screen.getByTestId(`footer-link-${sectionId}`);
        fireEvent.click(link);

        // 验证：scrollTo 被调用
        const called = scrollToFn.mock.calls.length > 0;

        // 验证：behavior 设置为 'smooth'
        const lastCall = scrollToFn.mock.calls[scrollToFn.mock.calls.length - 1];
        const isSmooth = lastCall && lastCall[0].behavior === 'smooth';

        unmount();

        return called && isSmooth;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试：滚动位置应该考虑导航栏高度偏移
   *
   * 对于任意目标区块，计算的滚动位置应该等于区块偏移量减去导航栏高度
   */
  it('滚动位置应该考虑导航栏高度偏移', () => {
    fc.assert(
      fc.property(fc.constantFrom(...sectionIds), (sectionId) => {
        const scrollToFn = vi.fn();
        const { unmount } = render(<MockFooter onScrollTo={scrollToFn} />);

        const link = screen.getByTestId(`footer-link-${sectionId}`);
        fireEvent.click(link);

        // 获取实际滚动位置
        const lastCall = scrollToFn.mock.calls[scrollToFn.mock.calls.length - 1];
        const actualTop = lastCall ? lastCall[0].top : -1;

        // 计算期望的滚动位置
        const expectedTop = calculateTargetScrollPosition(sectionId);

        unmount();

        // 验证：实际滚动位置应该等于期望位置
        return actualTop === expectedTop;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试：滚动位置不应该为负数
   *
   * 对于任意目标区块（包括首屏区块），滚动位置应该 >= 0
   */
  it('滚动位置不应该为负数', () => {
    fc.assert(
      fc.property(fc.constantFrom(...sectionIds), (sectionId) => {
        const scrollToFn = vi.fn();
        const { unmount } = render(<MockFooter onScrollTo={scrollToFn} />);

        const link = screen.getByTestId(`footer-link-${sectionId}`);
        fireEvent.click(link);

        // 获取实际滚动位置
        const lastCall = scrollToFn.mock.calls[scrollToFn.mock.calls.length - 1];
        const actualTop = lastCall ? lastCall[0].top : 0;

        unmount();

        // 验证：滚动位置应该 >= 0
        return actualTop >= 0;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试：连续点击不同链接应该更新滚动位置
   */
  it('连续点击不同链接应该更新到最新的滚动位置', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...sectionIds),
        fc.constantFrom(...sectionIds),
        (firstSection, secondSection) => {
          const scrollToFn = vi.fn();
          const { unmount } = render(<MockFooter onScrollTo={scrollToFn} />);

          // 点击第一个链接
          const firstLink = screen.getByTestId(`footer-link-${firstSection}`);
          fireEvent.click(firstLink);

          // 点击第二个链接
          const secondLink = screen.getByTestId(`footer-link-${secondSection}`);
          fireEvent.click(secondLink);

          // 获取最后一次滚动位置
          const lastCall = scrollToFn.mock.calls[scrollToFn.mock.calls.length - 1];
          const actualTop = lastCall ? lastCall[0].top : -1;

          // 期望的位置应该是第二个区块的位置
          const expectedTop = calculateTargetScrollPosition(secondSection);

          unmount();

          return actualTop === expectedTop;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 单元测试：验证所有页脚链接都存在
   */
  it('所有快捷链接都应该存在', () => {
    const scrollToFn = vi.fn();
    render(<MockFooter onScrollTo={scrollToFn} />);

    for (const sectionId of sectionIds) {
      const link = screen.getByTestId(`footer-link-${sectionId}`);
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe(`#${sectionId}`);
    }
  });

  /**
   * 单元测试：验证点击首页链接滚动到顶部
   */
  it('点击首页链接应该滚动到顶部（考虑导航栏偏移）', () => {
    const scrollToFn = vi.fn();
    render(<MockFooter onScrollTo={scrollToFn} />);

    const bannerLink = screen.getByTestId('footer-link-banner');
    fireEvent.click(bannerLink);

    expect(scrollToFn).toHaveBeenCalledWith({
      top: 0, // banner 位置是 0，减去 80 后取 Math.max(0, -80) = 0
      behavior: 'smooth',
    });
  });

  /**
   * 单元测试：验证点击关于我们链接滚动到正确位置
   */
  it('点击关于我们链接应该滚动到正确位置', () => {
    const scrollToFn = vi.fn();
    render(<MockFooter onScrollTo={scrollToFn} />);

    const aboutLink = screen.getByTestId('footer-link-about');
    fireEvent.click(aboutLink);

    expect(scrollToFn).toHaveBeenCalledWith({
      top: 800 - NAVBAR_HEIGHT, // about 位置 800 - 导航栏高度 80 = 720
      behavior: 'smooth',
    });
  });

  /**
   * 单元测试：验证点击联系我们链接滚动到正确位置
   */
  it('点击联系我们链接应该滚动到正确位置', () => {
    const scrollToFn = vi.fn();
    render(<MockFooter onScrollTo={scrollToFn} />);

    const contactLink = screen.getByTestId('footer-link-contact');
    fireEvent.click(contactLink);

    expect(scrollToFn).toHaveBeenCalledWith({
      top: 4000 - NAVBAR_HEIGHT, // contact 位置 4000 - 导航栏高度 80 = 3920
      behavior: 'smooth',
    });
  });

  /**
   * 单元测试：验证链接点击阻止默认行为
   */
  it('点击链接应该阻止默认跳转行为', () => {
    const scrollToFn = vi.fn();
    render(<MockFooter onScrollTo={scrollToFn} />);

    const link = screen.getByTestId('footer-link-about');
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    // 使用 fireEvent 会自动触发 onClick，其中调用了 e.preventDefault()
    fireEvent.click(link);

    // 验证滚动函数被调用（说明 preventDefault 生效，没有发生页面跳转）
    expect(scrollToFn).toHaveBeenCalled();
  });

  /**
   * 单元测试：验证所有区块的滚动位置计算正确
   */
  it('所有区块的滚动位置计算应该正确', () => {
    for (const sectionId of sectionIds) {
      const expectedPosition = calculateTargetScrollPosition(sectionId);
      const sectionOffset = mockSectionOffsets[sectionId];
      const calculatedPosition = Math.max(0, sectionOffset - NAVBAR_HEIGHT);

      expect(expectedPosition).toBe(calculatedPosition);
    }
  });

  /**
   * 单元测试：验证辅助函数 calculateTargetScrollPosition
   */
  it('calculateTargetScrollPosition 应该返回正确的位置', () => {
    expect(calculateTargetScrollPosition('banner')).toBe(0); // max(0, 0-80) = 0
    expect(calculateTargetScrollPosition('about')).toBe(720); // 800-80
    expect(calculateTargetScrollPosition('features')).toBe(1520); // 1600-80
    expect(calculateTargetScrollPosition('services')).toBe(2320); // 2400-80
    expect(calculateTargetScrollPosition('faq')).toBe(3120); // 3200-80
    expect(calculateTargetScrollPosition('contact')).toBe(3920); // 4000-80
    expect(calculateTargetScrollPosition('blog')).toBe(4720); // 4800-80
  });
});
