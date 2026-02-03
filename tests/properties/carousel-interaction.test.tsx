/**
 * Carousel 轮播组件测试
 *
 * 属性测试 + 单元测试
 * - 导航控制（前进/后退）
 * - 自动播放
 * - 循环模式
 * - 无障碍支持（aria-label, aria-live, aria-roledescription）
 * - 键盘导航（左右箭头）
 * - 指示器同步
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import Carousel from '@/components/ui/Carousel';

describe('Carousel 轮播组件', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const sampleItems = [
    { id: '1', content: 'Slide 1' },
    { id: '2', content: 'Slide 2' },
    { id: '3', content: 'Slide 3' },
  ];

  /**
   * 属性测试 1: 对于任意幻灯片数量和点击次数，当前索引始终在有效范围内
   */
  it('属性: 导航后当前索引始终在有效范围 [0, items.length-1] 内', async () => {
    vi.useRealTimers();
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        fc.array(fc.constantFrom('next', 'prev'), { minLength: 1, maxLength: 5 }),
        async (numItems, actions) => {
          document.body.innerHTML = '';

          const items = Array.from({ length: numItems }, (_, i) => ({
            id: `item-${i}`,
            content: `Slide ${i + 1}`,
          }));

          const { container, unmount } = render(<Carousel items={items} />);

          for (const action of actions) {
            const button = within(container).getByRole('button', {
              name: action === 'next' ? /next/i : /prev/i,
            });
            await userEvent.click(button);
          }

          // 验证指示器中只有一个是活跃状态
          const indicators = container.querySelectorAll('[data-testid="carousel-indicator"]');
          const activeIndicators = container.querySelectorAll('[data-testid="carousel-indicator"][data-active="true"]');
          expect(indicators.length).toBe(numItems);
          expect(activeIndicators.length).toBe(1);

          unmount();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  }, 15000);

  /**
   * 属性测试 2: 循环模式下，从第一张向前导航回到最后一张，从最后一张向后导航回到第一张
   */
  it('属性: 循环模式下导航正确环绕', async () => {
    vi.useRealTimers();
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 6 }),
        async (numItems) => {
          document.body.innerHTML = '';

          const items = Array.from({ length: numItems }, (_, i) => ({
            id: `item-${i}`,
            content: `Slide ${i + 1}`,
          }));

          const { container, unmount } = render(<Carousel items={items} loop />);

          // 在第一张点击 prev，应该跳到最后一张
          const prevButton = within(container).getByRole('button', { name: /prev/i });
          await userEvent.click(prevButton);

          const activeAfterPrev = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
          const lastIndex = numItems - 1;
          expect(activeAfterPrev).toHaveAttribute('data-index', String(lastIndex));

          // 再点击 next，应该回到第一张
          const nextButton = within(container).getByRole('button', { name: /next/i });
          await userEvent.click(nextButton);

          const activeAfterNext = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
          expect(activeAfterNext).toHaveAttribute('data-index', '0');

          unmount();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  }, 15000);

  /**
   * 属性测试 3: 非循环模式下，在边界处导航按钮被禁用
   */
  it('属性: 非循环模式下边界按钮被禁用', async () => {
    vi.useRealTimers();
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 6 }),
        async (numItems) => {
          document.body.innerHTML = '';

          const items = Array.from({ length: numItems }, (_, i) => ({
            id: `item-${i}`,
            content: `Slide ${i + 1}`,
          }));

          const { container, unmount } = render(<Carousel items={items} />);

          // 初始状态：prev 按钮被禁用
          const prevButton = within(container).getByRole('button', { name: /prev/i });
          expect(prevButton).toBeDisabled();

          // 导航到最后一张
          const nextButton = within(container).getByRole('button', { name: /next/i });
          for (let i = 0; i < numItems - 1; i++) {
            await userEvent.click(nextButton);
          }

          // 最后一张：next 按钮被禁用
          expect(nextButton).toBeDisabled();

          unmount();
          return true;
        }
      ),
      { numRuns: 30 }
    );
  }, 15000);

  /**
   * 单元测试：基本渲染
   */
  it('渲染所有幻灯片内容', () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} />);

    expect(container.querySelector('[data-testid="carousel"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="carousel-slide"]').length).toBe(3);
  });

  /**
   * 单元测试：点击 next 导航
   */
  it('点击 next 按钮前进到下一张', async () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} />);

    // 初始在第一张
    const activeIndicator = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(activeIndicator).toHaveAttribute('data-index', '0');

    // 点击 next
    const nextButton = within(container).getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    const newActive = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(newActive).toHaveAttribute('data-index', '1');
  });

  /**
   * 单元测试：点击 prev 导航
   */
  it('点击 prev 按钮回到上一张', async () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} loop />);

    // 先前进到第二张
    const nextButton = within(container).getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // 点击 prev 回到第一张
    const prevButton = within(container).getByRole('button', { name: /prev/i });
    await userEvent.click(prevButton);

    const activeIndicator = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(activeIndicator).toHaveAttribute('data-index', '0');
  });

  /**
   * 单元测试：点击指示器导航到指定幻灯片
   */
  it('点击指示器直接导航到指定幻灯片', async () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} />);

    const indicators = container.querySelectorAll('[data-testid="carousel-indicator"]');
    await userEvent.click(indicators[2] as HTMLElement);

    const activeIndicator = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(activeIndicator).toHaveAttribute('data-index', '2');
  });

  /**
   * 单元测试：自动播放
   */
  it('启用自动播放时，定时切换到下一张', () => {
    const { container } = render(
      <Carousel items={sampleItems} autoPlay autoPlayInterval={3000} loop />
    );

    // 初始在第一张
    let active = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(active).toHaveAttribute('data-index', '0');

    // 前进 3 秒
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    active = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(active).toHaveAttribute('data-index', '1');

    // 再前进 3 秒
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    active = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(active).toHaveAttribute('data-index', '2');
  });

  /**
   * 单元测试：无障碍属性
   */
  it('具有正确的无障碍属性', () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} label="Product showcase" />);

    const carousel = container.querySelector('[data-testid="carousel"]');
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(carousel).toHaveAttribute('aria-label', 'Product showcase');

    // 幻灯片有 aria-roledescription
    const slides = container.querySelectorAll('[data-testid="carousel-slide"]');
    slides.forEach((slide) => {
      expect(slide).toHaveAttribute('aria-roledescription', 'slide');
    });

    // 有 live region
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion).toBeInTheDocument();
  });

  /**
   * 单元测试：键盘导航
   */
  it('支持左右箭头键导航', async () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={sampleItems} loop />);

    const carousel = container.querySelector('[data-testid="carousel"]') as HTMLElement;
    carousel.focus();

    // 右箭头前进
    await userEvent.keyboard('{ArrowRight}');

    let active = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(active).toHaveAttribute('data-index', '1');

    // 左箭头后退
    await userEvent.keyboard('{ArrowLeft}');

    active = container.querySelector('[data-testid="carousel-indicator"][data-active="true"]');
    expect(active).toHaveAttribute('data-index', '0');
  });

  /**
   * 单元测试：单个幻灯片不显示导航
   */
  it('只有一个幻灯片时不显示导航控件', () => {
    vi.useRealTimers();
    const singleItem = [{ id: '1', content: 'Only slide' }];
    const { container } = render(<Carousel items={singleItem} />);

    const prevButton = container.querySelector('[aria-label*="prev" i]');
    const nextButton = container.querySelector('[aria-label*="next" i]');
    const indicators = container.querySelectorAll('[data-testid="carousel-indicator"]');

    expect(prevButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
    expect(indicators.length).toBe(0);
  });

  /**
   * 单元测试：onSlideChange 回调
   */
  it('幻灯片切换时触发 onSlideChange 回调', async () => {
    vi.useRealTimers();
    const onSlideChange = vi.fn();
    const { container } = render(
      <Carousel items={sampleItems} onSlideChange={onSlideChange} />
    );

    const nextButton = within(container).getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    expect(onSlideChange).toHaveBeenCalledWith(1);
  });

  /**
   * 单元测试：空列表不崩溃
   */
  it('空列表不渲染任何内容', () => {
    vi.useRealTimers();
    const { container } = render(<Carousel items={[]} />);
    expect(container.querySelector('[data-testid="carousel"]')).not.toBeInTheDocument();
  });
});
