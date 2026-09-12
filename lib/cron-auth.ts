/**
 * 定时任务端点的鉴权
 *
 * Vercel 在项目里设了 CRON_SECRET 之后,会自动给每次定时调用带上
 * Authorization: Bearer <secret>。端点自己比对即可。
 *
 * fail-closed:没配 secret 时一律拒绝。这两个端点一个会发邮件、
 * 一个会删数据,绝不能因为「忘了配」而变成公开可调用。
 */

export interface CronAuthResult {
  readonly authorized: boolean;
  /** 拒绝原因,只用于服务端日志,不返回给调用方 */
  readonly reason?: 'missing_secret' | 'bad_token';
}

export function authorizeCron(
  authorizationHeader: string | null,
  secret: string | undefined
): CronAuthResult {
  if (!secret) {
    return { authorized: false, reason: 'missing_secret' };
  }

  if (authorizationHeader !== `Bearer ${secret}`) {
    return { authorized: false, reason: 'bad_token' };
  }

  return { authorized: true };
}
