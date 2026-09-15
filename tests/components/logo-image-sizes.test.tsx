/**
 * logo Image sizes 测试
 *
 * 背景(GSC /ja 资源报告排查发现):Navbar/Footer 的 logo Image 写了
 * width={2481} 但没写 sizes,Next 按内在宽度从 deviceSizes 挑档,
 * 1x/2x 全落到 w=3840 超大图;Navbar 版还带 priority,等于全站每页
 * 预加载一张 3840px 的图,而 logo 实际显示仅约 96px 宽。
 * 修复:两处 Image 加 sizes="96px",浏览器改取 128/256 小档。
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'fs';
import path from 'path';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

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

const messages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'locales', 'en.json'), 'utf-8')
);

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function expectLogoUsesSmallSizes(container: HTMLElement, where: string) {
  const logo = container.querySelector('img[alt="Better Bags Myanmar"]');
  expect(logo, `${where}: 找不到 logo img`).not.toBeNull();

  // 纯 px 的 sizes 会让 next/image 输出全量 srcset 候选(含 3840w),
  // 但浏览器/爬虫按 sizes 属性选档:96px × DPR≤3 只会命中 128/256/384,
  // 3840 永远不被选中;priority 预加载同理经 imagesizes 走小档。
  // 因此断言锚定在 sizes 属性 + 小档候选存在,而非 3840 缺席。
  expect(logo!.getAttribute('sizes'), `${where}: logo 缺少 sizes 属性`).toBe('96px');

  const srcset = logo!.getAttribute('srcset') ?? '';
  expect(srcset, `${where}: srcset 缺少 128 小档`).toContain('w=128');
  expect(srcset, `${where}: srcset 缺少 256 小档`).toContain('w=256');
}

describe('logo Image 不再请求 3840px 超大图', () => {
  it('Navbar logo 应带 sizes="96px" 且 srcset 只含小档位', () => {
    const { container } = renderWithIntl(<Navbar />);
    expectLogoUsesSmallSizes(container, 'Navbar');
  });

  it('Footer logo 应带 sizes="96px" 且 srcset 只含小档位', () => {
    const { container } = renderWithIntl(<Footer />);
    expectLogoUsesSmallSizes(container, 'Footer');
  });
});
