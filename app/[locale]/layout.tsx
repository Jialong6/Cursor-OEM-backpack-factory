import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import Navbar from '@/components/layout/Navbar';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Better Bags Myanmar - Premium OEM Backpack Factory",
  description: "High-end B2B backpack manufacturing with customization services",
};

/**
 * 生成静态路由参数
 * 为每个支持的语言生成静态页面
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * 根布局组件
 *
 * @param locale - 当前语言（从 URL 路径获取，如 /en 或 /zh）
 * @param children - 子组件
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Next.js 15: params 需要被 await
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 获取当前语言的翻译消息
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
