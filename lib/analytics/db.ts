import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Neon 连接
 *
 * 必须惰性初始化:neon(process.env.DATABASE_URL!) 写在模块顶层会在缺变量时
 * 让 next build 直接崩 —— Next 在构建期会求值模块顶层代码。
 *
 * 也刻意不用 Proxy 包装来「优雅地」惰性化:Proxy 会拦截属性探测,
 * 一些库据此判断对象形状时会被骗过去,调试起来毫无线索。一个普通函数
 * 加一个模块级变量就够了。
 *
 * 用 HTTP 模式(而不是 WebSocket 池):serverless 环境下没有长连接可复用,
 * HTTP 模式没有连接池要管。代价是一次调用一个网络往返 ——
 * 所以写入路径必须压成一条语句,见 lib/analytics/ingest.ts。
 */

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;

/** 数据库是否已配置。未配置时埋点静默跳过,不影响站点 */
export function isAnalyticsDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Sql {
  if (client) {
    return client;
  }

  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  client = neon(url);

  return client;
}

/** 仅供测试:丢弃已建立的连接 */
export function __resetDbForTests(): void {
  client = null;
}
