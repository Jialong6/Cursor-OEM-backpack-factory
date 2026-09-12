/**
 * 访客身份的派生(纯函数)
 *
 * 整个第二期的隐私叙事支点:只存不可逆指纹,不存明文 IP,而且指纹所用的盐
 * 每天换一次 —— 同一台设备跨天必然得到不同的标识,无法被串成一条长期轨迹。
 * 隐私政策(12 个语言版)已经把这句话写给访客看了,所以这里的行为是对外承诺,
 * 不是实现细节。
 *
 * 当日盐由 HMAC(密钥, UTC 日期) 确定性派生:不需要 KV,不需要跨实例协调,
 * UTC 零点自动轮换。轮换那个密钥可以一次切断全部历史关联。
 *
 * 本模块只依赖 node:crypto,不碰 DOM,也不读环境变量(密钥由调用方传入,
 * 便于测试)。
 */
import { createHash, createHmac } from 'node:crypto';

/** 参与哈希的站点常量,避免同一份密钥在别处产生相同的指纹 */
const SITE_TAG = 'betterbagsmm';

/** 取 UTC 日期,形如 2026-09-12 */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * 派生当日盐
 *
 * @throws 密钥为空时直接抛错。绝不静默降级成无盐哈希 —— 那等于把
 *   「不可逆」这个承诺悄悄作废
 */
export function dailySalt(secret: string, date: Date | string): string {
  if (!secret) {
    throw new Error('ANALYTICS_SALT_SECRET is required to derive the daily salt');
  }

  const day = typeof date === 'string' ? date : utcDateKey(date);

  return createHmac('sha256', secret).update(day).digest('hex');
}

/**
 * 派生访客标识
 *
 * @param salt - dailySalt 的产物
 * @param ip - 客户端 IP。缺失时传空串即可,仍会产出稳定哈希
 * @param userAgent - 原始 User-Agent
 */
export function visitorHash(salt: string, ip: string, userAgent: string): string {
  return createHash('sha256')
    .update(salt)
    .update(' ')
    .update(ip)
    .update(' ')
    .update(userAgent)
    .update(' ')
    .update(SITE_TAG)
    .digest('hex');
}
