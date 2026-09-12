import { NextResponse, after, type NextRequest } from 'next/server';
import { detectBot } from '@/lib/bot-detector';
import { isAnalyticsDbConfigured } from '@/lib/analytics/db';
import { SERVER_MAX_BODY_BYTES, type InsightEnvelope } from '@/lib/analytics/events';
import { ingestEnvelope } from '@/lib/analytics/ingest';
import { insightEnvelopeSchema } from '@/lib/analytics/insight-schema';
import { isSameOrigin, readRequestContext } from '@/lib/analytics/request-context';
import { dailySalt, visitorHash } from '@/lib/analytics/visitor-hash';

/**
 * 自建埋点的上报端点
 *
 * 路径名刻意避开 collect / track / analytics 这些词:广告拦截插件的默认
 * 规则表按路径关键词拦截,叫 insight 能明显降低被拦率。
 *
 * 三条设计约束:
 * 1. 无论发生什么都返回 204。客户端用 sendBeacon,本来就读不到响应;
 *    而把「有没有被记录」告诉调用方,只会方便别人试探。
 * 2. 落库全部放进 after()。响应立即返回,数据库冷启动(Neon 闲置五分钟
 *    缩到零)与端点延迟无关。
 * 3. 明文 IP 到此为止。它只被用来即刻派生不可逆指纹,从不落库。
 *
 * middleware 的 matcher 已经排除了 /api,所以这里不会被 i18n 重定向。
 */

export const runtime = 'nodejs';

/** 统一的空响应 */
function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 跨站上报直接丢弃。缺 Origin 的放行 —— sendBeacon 在部分浏览器上不带这个头
    if (!isSameOrigin(request.headers)) {
      return noContent();
    }

    const context = readRequestContext(request.headers);

    // 爬虫不进库。它们不跑 JS,能到这里的基本是刻意构造的
    if (detectBot(context.userAgent)) {
      return noContent();
    }

    const raw = await request.text();

    // 先按字节数拦,再解析 —— 不给超大载荷进 JSON.parse 的机会
    if (Buffer.byteLength(raw, 'utf8') > SERVER_MAX_BODY_BYTES) {
      return noContent();
    }

    let payload: unknown;

    try {
      payload = JSON.parse(raw);
    } catch {
      return noContent();
    }

    const parsed = insightEnvelopeSchema.safeParse(payload);

    if (!parsed.success) {
      return noContent();
    }

    if (!isAnalyticsDbConfigured()) {
      return noContent();
    }

    const secret = process.env.ANALYTICS_SALT_SECRET;

    if (!secret) {
      // 生产日志里 console.log 会被移除,这里必须用 warn 才看得见
      console.warn('[insight] ANALYTICS_SALT_SECRET is not set, dropping payload');
      return noContent();
    }

    const hash = visitorHash(
      dailySalt(secret, new Date()),
      context.ip,
      context.userAgent
    );

    after(async () => {
      try {
        await ingestEnvelope({
          envelope: parsed.data as InsightEnvelope,
          context,
          visitorHash: hash,
        });
      } catch (error) {
        console.error('[insight] ingest failed:', error);
      }
    });

    return noContent();
  } catch (error) {
    console.error('[insight] unexpected failure:', error);
    return noContent();
  }
}
