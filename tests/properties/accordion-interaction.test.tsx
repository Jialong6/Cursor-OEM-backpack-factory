/**
 * 属性测试：FAQ手风琴交互
 *
 * 属性 9: 对于任意 FAQ 问题点击，点击后该问题的答案应该展开显示，
 *         且之前展开的其他答案应该折叠。
 *
 * 验证需求：10.2, 10.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import Accordion from '@/components/ui/Accordion';

describe('属性 9: FAQ手风琴交互', () => {
  // 每个测试前清理 DOM
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  /**
   * 属性测试 1: 点击任意问题后，该问题展开且只有该问题展开
   */
  it('点击任意问题后，该问题展开且只有一个问题处于展开状态', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }), // 问题数量
        fc.integer({ min: 0, max: 9 }), // 点击的问题索引（相对值）
        async (numQuestions, clickIndexRelative) => {
          const clickIndex = clickIndexRelative % numQuestions;

          // 清理 DOM
          document.body.innerHTML = '';

          // 生成测试数据
          const items = Array.from({ length: numQuestions }, (_, i) => ({
            q: `Q${i + 1}`,
            a: `A${i + 1}`,
          }));

          // 渲染组件
          const { container, unmount } = render(<Accordion items={items} />);

          // 获取所有问题按钮（使用 getAllByRole 更精确）
          const buttons = within(container).getAllByRole('button');

          // 点击指定问题
          await userEvent.click(buttons[clickIndex]);

          // 验证被点击的问题已展开
          expect(buttons[clickIndex]).toHaveAttribute('aria-expanded', 'true');

          // 验证其他所有问题都是折叠状态
          buttons.forEach((button, index) => {
            if (index !== clickIndex) {
              expect(button).toHaveAttribute('aria-expanded', 'false');
            }
          });

          // 验证只有一个答案可见
          const expandedContents = container.querySelectorAll('.max-h-96.opacity-100');
          expect(expandedContents.length).toBe(1);

          // 清理
          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 2: 连续点击多个问题，每次只展开最后点击的不同问题
   */
  it('连续点击多个不同问题时，每次只展开最后点击的问题', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 8 }), // 问题数量
        fc.array(fc.integer({ min: 0, max: 7 }), { minLength: 2, maxLength: 5 }), // 点击序列
        async (numQuestions, clickSequenceRaw) => {
          // 将点击序列映射到有效范围
          const clickSequence = clickSequenceRaw.map((val) => val % numQuestions);

          // 清理 DOM
          document.body.innerHTML = '';

          // 生成测试数据
          const items = Array.from({ length: numQuestions }, (_, i) => ({
            q: `Q${i + 1}`,
            a: `A${i + 1}`,
          }));

          // 渲染组件
          const { container, unmount } = render(<Accordion items={items} />);

          // 获取所有问题按钮
          const buttons = within(container).getAllByRole('button');

          // 追踪当前展开的问题索引
          let currentOpenIndex: number | null = null;

          // 依次点击问题
          for (const clickIndex of clickSequence) {
            await userEvent.click(buttons[clickIndex]);

            // 更新当前展开的问题索引
            // 如果点击的是已展开的问题，则折叠（变为 null）
            // 否则，展开新点击的问题
            if (currentOpenIndex === clickIndex) {
              currentOpenIndex = null;
            } else {
              currentOpenIndex = clickIndex;
            }

            // 验证状态符合预期
            buttons.forEach((button, index) => {
              if (index === currentOpenIndex) {
                expect(button).toHaveAttribute('aria-expanded', 'true');
              } else {
                expect(button).toHaveAttribute('aria-expanded', 'false');
              }
            });
          }

          // 清理
          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 3: 点击已展开的问题会将其折叠
   */
  it('点击已展开的问题会将其折叠，所有问题都变为折叠状态', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }), // 问题数量
        fc.integer({ min: 0, max: 9 }), // 点击的问题索引
        async (numQuestions, clickIndexRelative) => {
          const clickIndex = clickIndexRelative % numQuestions;

          // 清理 DOM
          document.body.innerHTML = '';

          // 生成测试数据
          const items = Array.from({ length: numQuestions }, (_, i) => ({
            q: `Q${i + 1}`,
            a: `A${i + 1}`,
          }));

          // 渲染组件
          const { container, unmount } = render(<Accordion items={items} />);

          // 获取所有问题按钮
          const buttons = within(container).getAllByRole('button');

          // 第一次点击：展开问题
          await userEvent.click(buttons[clickIndex]);
          expect(buttons[clickIndex]).toHaveAttribute('aria-expanded', 'true');

          // 第二次点击：折叠问题
          await userEvent.click(buttons[clickIndex]);
          expect(buttons[clickIndex]).toHaveAttribute('aria-expanded', 'false');

          // 验证所有问题都是折叠状态
          buttons.forEach((button) => {
            expect(button).toHaveAttribute('aria-expanded', 'false');
          });

          // 验证没有展开的内容
          const expandedContents = container.querySelectorAll('.max-h-96.opacity-100');
          expect(expandedContents.length).toBe(0);

          // 清理
          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 单元测试：基本交互场景
   */
  it('基本场景：点击问题 1 展开，再点击问题 2 折叠问题 1 并展开问题 2', async () => {
    const items = [
      { q: 'Question 1', a: 'Answer 1' },
      { q: 'Question 2', a: 'Answer 2' },
      { q: 'Question 3', a: 'Answer 3' },
    ];

    const { container } = render(<Accordion items={items} />);
    const buttons = within(container).getAllByRole('button');

    // 初始状态：所有问题都折叠
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');

    // 点击问题 1
    await userEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
    expect(within(container).getByText('Answer 1')).toBeInTheDocument();

    // 点击问题 2
    await userEvent.click(buttons[1]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
    expect(within(container).getByText('Answer 2')).toBeInTheDocument();
  });

  /**
   * 单元测试：带默认展开索引
   */
  it('支持 defaultOpenIndex 属性，默认展开指定问题', () => {
    const items = [
      { q: 'Question 1', a: 'Answer 1' },
      { q: 'Question 2', a: 'Answer 2' },
      { q: 'Question 3', a: 'Answer 3' },
    ];

    const { container } = render(<Accordion items={items} defaultOpenIndex={1} />);
    const buttons = within(container).getAllByRole('button');

    // 问题 2 默认展开
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'false');
    expect(within(container).getByText('Answer 2')).toBeInTheDocument();
  });

  /**
   * 单元测试：aria-controls 属性正确设置
   */
  it('每个问题按钮都有正确的 aria-controls 属性', () => {
    const items = [
      { q: 'Question 1', a: 'Answer 1' },
      { q: 'Question 2', a: 'Answer 2' },
    ];

    const { container } = render(<Accordion items={items} />);
    const buttons = within(container).getAllByRole('button');

    expect(buttons[0]).toHaveAttribute('aria-controls', 'accordion-content-0');
    expect(buttons[1]).toHaveAttribute('aria-controls', 'accordion-content-1');

    // 验证对应的内容区域存在
    expect(document.getElementById('accordion-content-0')).toBeInTheDocument();
    expect(document.getElementById('accordion-content-1')).toBeInTheDocument();
  });

  /**
   * 单元测试：空列表处理
   */
  it('空列表不渲染任何问题', () => {
    const { container } = render(<Accordion items={[]} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  /**
   * 单元测试：单个问题的切换
   */
  it('单个问题可以正常展开和折叠', async () => {
    const items = [{ q: 'Single Question', a: 'Single Answer' }];

    const { container } = render(<Accordion items={items} />);
    const button = within(container).getByRole('button');

    // 初始折叠
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // 点击展开
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(container).getByText('Single Answer')).toBeInTheDocument();

    // 再次点击折叠
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
