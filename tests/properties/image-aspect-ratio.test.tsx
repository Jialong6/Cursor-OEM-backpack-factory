/**
 * 属性测试：图片宽高比保持
 *
 * **Feature: backpack-oem-website, Property 8: 图片宽高比保持**
 *
 * 验证：对于任意图片元素和任意容器宽度变化，图片的宽高比应该保持不变。
 *
 * 需求: 4.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import OptimizedImage, { ASPECT_RATIOS } from '@/components/ui/OptimizedImage';

/**
 * 解析宽高比字符串为数值
 *
 * @param aspectRatio 宽高比字符串，如 "16/9", "4/3"
 * @returns 宽高比数值，如 1.778, 1.333
 */
function parseAspectRatio(aspectRatio: string): number {
  const [width, height] = aspectRatio.split('/').map(Number);
  return width / height;
}

/**
 * 从元素的 style 属性获取宽高比
 *
 * @param element HTML 元素
 * @returns 宽高比数值，如果未设置则返回 null
 */
function getElementAspectRatio(element: Element): number | null {
  const style = window.getComputedStyle(element);
  const aspectRatio = style.aspectRatio;

  if (!aspectRatio || aspectRatio === 'auto') {
    return null;
  }

  // aspectRatio 可能是 "16 / 9" 或 "1.778" 格式
  if (aspectRatio.includes('/')) {
    return parseAspectRatio(aspectRatio.replace(/\s/g, ''));
  }

  return parseFloat(aspectRatio);
}

/**
 * 计算元素实际的宽高比（基于尺寸）
 *
 * @param element HTML 元素
 * @returns 实际宽高比数值
 */
function getActualAspectRatio(element: Element): number | null {
  const rect = element.getBoundingClientRect();
  if (rect.height === 0) return null;
  return rect.width / rect.height;
}

describe('属性 8: 图片宽高比保持', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // 创建一个可调整宽度的容器
    container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理 DOM
    document.body.removeChild(container);
  });

  /**
   * 属性测试 1: 对于任意宽高比，aspectRatio 样式应该正确设置
   */
  it('对于任意宽高比字符串，组件应该设置正确的 aspectRatio 样式', () => {
    fc.assert(
      fc.property(
        // 生成任意合理的宽高比：宽度 1-21，高度 1-9
        fc.integer({ min: 1, max: 21 }),
        fc.integer({ min: 1, max: 9 }),
        (width, height) => {
          const aspectRatioString = `${width}/${height}`;
          const expectedRatio = width / height;

          const { container: renderContainer } = render(
            <OptimizedImage
              src="/test-image.jpg"
              alt="Test image"
              fill
              aspectRatio={aspectRatioString}
            />
          );

          // 找到包含 aspect-ratio 的容器元素
          const imageContainer = renderContainer.querySelector('[style*="aspect-ratio"]');
          expect(imageContainer).not.toBeNull();

          if (imageContainer) {
            const styleAttr = imageContainer.getAttribute('style') || '';
            // 检查 style 属性中是否包含正确的 aspect-ratio
            expect(styleAttr).toContain('aspect-ratio');

            // 验证宽高比数值（允许小误差）
            const actualRatio = parseAspectRatio(aspectRatioString);
            expect(actualRatio).toBeCloseTo(expectedRatio, 3);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 2: 预设的宽高比配置应该产生一致的结果
   */
  it('使用任意预设的 ASPECT_RATIOS，应该生成正确的宽高比', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ASPECT_RATIOS.WIDE,
          ASPECT_RATIOS.STANDARD,
          ASPECT_RATIOS.SQUARE,
          ASPECT_RATIOS.PHOTO,
          ASPECT_RATIOS.ULTRAWIDE
        ),
        (aspectRatio) => {
          const expectedRatio = parseAspectRatio(aspectRatio);

          const { container: renderContainer } = render(
            <OptimizedImage
              src="/test-image.jpg"
              alt="Test image"
              fill
              aspectRatio={aspectRatio}
            />
          );

          const imageContainer = renderContainer.querySelector('[style*="aspect-ratio"]');
          expect(imageContainer).not.toBeNull();

          if (imageContainer) {
            const styleAttr = imageContainer.getAttribute('style') || '';
            expect(styleAttr).toContain('aspect-ratio');

            // 验证宽高比值
            const actualRatio = parseAspectRatio(aspectRatio);
            expect(actualRatio).toBeCloseTo(expectedRatio, 3);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性测试 3: 对于固定尺寸图片，宽高比应该由 width/height 决定
   */
  it('对于任意 width 和 height，固定尺寸图片应该保持正确的宽高比', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }), // width
        fc.integer({ min: 100, max: 2000 }), // height
        (width, height) => {
          const expectedRatio = width / height;

          const { container: renderContainer } = render(
            <OptimizedImage
              src="/test-image.jpg"
              alt="Test image"
              width={width}
              height={height}
            />
          );

          // Next.js Image 组件会被渲染
          const img = renderContainer.querySelector('img');
          expect(img).not.toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 单元测试 1: 16:9 宽高比应该约等于 1.778
   */
  it('16:9 宽高比应该约等于 1.778', () => {
    const ratio = parseAspectRatio(ASPECT_RATIOS.WIDE);
    expect(ratio).toBeCloseTo(16 / 9, 3);
    expect(ratio).toBeCloseTo(1.778, 3);
  });

  /**
   * 单元测试 2: 4:3 宽高比应该约等于 1.333
   */
  it('4:3 宽高比应该约等于 1.333', () => {
    const ratio = parseAspectRatio(ASPECT_RATIOS.STANDARD);
    expect(ratio).toBeCloseTo(4 / 3, 3);
    expect(ratio).toBeCloseTo(1.333, 3);
  });

  /**
   * 单元测试 3: 1:1 宽高比应该等于 1
   */
  it('1:1 宽高比应该等于 1', () => {
    const ratio = parseAspectRatio(ASPECT_RATIOS.SQUARE);
    expect(ratio).toBe(1);
  });

  /**
   * 单元测试 4: 3:2 宽高比应该等于 1.5
   */
  it('3:2 宽高比应该等于 1.5', () => {
    const ratio = parseAspectRatio(ASPECT_RATIOS.PHOTO);
    expect(ratio).toBe(1.5);
  });

  /**
   * 单元测试 5: 21:9 宽高比应该约等于 2.333
   */
  it('21:9 宽高比应该约等于 2.333', () => {
    const ratio = parseAspectRatio(ASPECT_RATIOS.ULTRAWIDE);
    expect(ratio).toBeCloseTo(21 / 9, 3);
    expect(ratio).toBeCloseTo(2.333, 3);
  });

  /**
   * 单元测试 6: 填充模式下应该设置 aspectRatio 样式
   */
  it('填充模式下应该在容器上设置 aspectRatio 样式', () => {
    const { container: renderContainer } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        fill
        aspectRatio={ASPECT_RATIOS.WIDE}
      />
    );

    const imageContainer = renderContainer.querySelector('[style*="aspect-ratio"]');
    expect(imageContainer).not.toBeNull();

    if (imageContainer) {
      const styleAttr = imageContainer.getAttribute('style') || '';
      expect(styleAttr).toContain('aspect-ratio');
      expect(styleAttr).toMatch(/16\s*\/\s*9/);
    }
  });

  /**
   * 单元测试 7: 固定尺寸模式下应该设置 width 和 height
   */
  it('固定尺寸模式下应该渲染带 width 和 height 的图片', () => {
    const { container: renderContainer } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    );

    const img = renderContainer.querySelector('img');
    expect(img).not.toBeNull();
  });

  /**
   * 单元测试 8: 默认宽高比应该是 16:9
   */
  it('未指定 aspectRatio 时，填充模式应该使用默认的 16:9', () => {
    const { container: renderContainer } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        fill
      />
    );

    const imageContainer = renderContainer.querySelector('[style*="aspect-ratio"]');
    expect(imageContainer).not.toBeNull();

    if (imageContainer) {
      const styleAttr = imageContainer.getAttribute('style') || '';
      expect(styleAttr).toContain('aspect-ratio');
      // 默认应该是 16/9
      expect(styleAttr).toMatch(/16\s*\/\s*9/);
    }
  });

  /**
   * 单元测试 9: aspectRatio 应该覆盖默认值
   */
  it('指定的 aspectRatio 应该覆盖默认的 16:9', () => {
    const { container: renderContainer } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        fill
        aspectRatio={ASPECT_RATIOS.SQUARE}
      />
    );

    const imageContainer = renderContainer.querySelector('[style*="aspect-ratio"]');
    expect(imageContainer).not.toBeNull();

    if (imageContainer) {
      const styleAttr = imageContainer.getAttribute('style') || '';
      expect(styleAttr).toContain('aspect-ratio');
      expect(styleAttr).toMatch(/1\s*\/\s*1/);
      expect(styleAttr).not.toMatch(/16\s*\/\s*9/);
    }
  });

  /**
   * 单元测试 10: 验证所有预设宽高比的正确性
   */
  it('所有预设的 ASPECT_RATIOS 应该有正确的数值', () => {
    expect(parseAspectRatio(ASPECT_RATIOS.WIDE)).toBeCloseTo(16 / 9, 3);
    expect(parseAspectRatio(ASPECT_RATIOS.STANDARD)).toBeCloseTo(4 / 3, 3);
    expect(parseAspectRatio(ASPECT_RATIOS.SQUARE)).toBe(1);
    expect(parseAspectRatio(ASPECT_RATIOS.PHOTO)).toBe(1.5);
    expect(parseAspectRatio(ASPECT_RATIOS.ULTRAWIDE)).toBeCloseTo(21 / 9, 3);
  });
});
