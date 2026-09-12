import type { Metadata } from 'next';
import '../globals.css';

/**
 * 看板的根布局
 *
 * 站内唯一渲染 html/body 的布局本来是 app/[locale]/layout.tsx,而看板
 * 刻意放在 [locale] 之外 —— 它不翻译、不进 sitemap、只有一个人看。
 * 所以它需要自己的根布局,否则 next build 会直接报「没有 root layout」。
 *
 * 这里刻意不引 Navbar / Footer / 分析脚本:看板自己不该被埋点采集,
 * 也不需要站点的导航结构。
 */

export const metadata: Metadata = {
  title: 'Analytics',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
