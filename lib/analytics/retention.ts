/**
 * 原始数据的保留期
 *
 * 180 天是对访客的公开承诺:12 个语言版的隐私政策里都写着
 * 「分析记录 180 天后删除」。改这个数字要连带改那 12 份文案。
 *
 * 单独成模块而不是放在定时任务路由里:Next 的 route 文件只允许导出
 * 固定的一组名字(HTTP 方法、runtime、dynamic 等),多导出一个常量
 * 会让 next build 直接报「does not match the required types of a Next.js Route」。
 */
export const RETENTION_DAYS = 180;
