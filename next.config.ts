import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // 解决多 lockfile 警告：明确指定项目根目录为工作区
  outputFileTracingRoot: __dirname,
};

export default withNextIntl(nextConfig);
