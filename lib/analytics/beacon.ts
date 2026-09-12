/**
 * 自建埋点的传输层(模块级单例)
 *
 * 为什么是模块单例而不是 React context:
 * 调用点横跨整棵树 —— Navbar、Footer、各 section、询盘表单、浮窗、
 * 语言切换、Cal.com 嵌入。context 要求每个调用点都是客户端组件且位于
 * Provider 之下;而一个文档一个访客一个端点,本来就是单例,context 的
 * 存在意义(多实例隔离)在这里根本不存在。测试侧也更省:
 * vi.mock('@/lib/analytics/beacon') 一行就能在模块边界拦掉。
 *
 * 客户端零设备存储:pageViewId 只活在内存里,不碰 cookie / localStorage /
 * sessionStorage。导航即消失,这正是「一次页面浏览」的语义,也因此不触发
 * 第二轮 cookie 同意义务。
 */
import { buildBatches, type BatchContext } from './batching';
import {
  FLUSH_DEBOUNCE_MS,
  FLUSH_HARD_LIMIT_MS,
  INSIGHT_ENDPOINT,
  MAX_EVENTS_PER_BATCH,
  type DwellPayloadEntry,
  type InsightEventName,
  type InsightProps,
  type QueuedEvent,
} from './events';

let queue: readonly QueuedEvent[] = [];
let dwellQueue: readonly DwellPayloadEntry[] = [];
let pageViewId = '';
let pageStartedAt = 0;
let seq = 1;
let firstBatchSent = false;
let lifecycleBound = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let hardTimer: ReturnType<typeof setTimeout> | null = null;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // 极老的浏览器或被裁剪的运行时:退化成时间戳加随机数即可,
    // 这个 id 只需要在单次页面浏览内唯一
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * 绑定页面生命周期监听
 *
 * 刻意不用 beforeunload / unload:注册它们会让部分浏览器直接禁掉 bfcache,
 * 而且在移动端本来就不可靠。visibilitychange 才是移动端唯一可靠的
 * 「会话可能结束」信号。
 *
 * lifecycleBound 是模块级布尔,React StrictMode 的双次 effect 不会重复注册。
 */
function bindLifecycle(): void {
  if (lifecycleBound || typeof document === 'undefined') {
    return;
  }

  lifecycleBound = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush('hidden');
    }
  });

  window.addEventListener('pagehide', () => {
    flush('pagehide');
  });
}

function ensurePageView(): string {
  if (pageViewId === '') {
    pageViewId = newId();
    pageStartedAt = now();
    bindLifecycle();
  }

  return pageViewId;
}

function clearTimers(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (hardTimer !== null) {
    clearTimeout(hardTimer);
    hardTimer = null;
  }
}

function scheduleFlush(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => flush('debounce'), FLUSH_DEBOUNCE_MS);

  // 硬上限:防止一直有新事件进来、防抖被无限推迟
  if (hardTimer === null) {
    hardTimer = setTimeout(() => flush('hard-limit'), FLUSH_HARD_LIMIT_MS);
  }
}

/**
 * 发送一个载荷
 *
 * 先 sendBeacon:它是唯一能在移动端 Safari 的 pagehide 之后仍把请求送出去
 * 的手段。代价是拿不到响应、不能设自定义头 —— 而服务端一律返回 204、
 * 客户端从不读响应,代价为零。它只在每源 64 KB 队列满时返回 false,
 * 那才是回落 fetch keepalive 的场景。
 *
 * body 用 text/plain 的 Blob 保持简单请求语义,将来换域名也不会突然多一次
 * 预检。服务端 await request.text() 再 JSON.parse 即可。
 */
function send(payload: string): void {
  const type = 'text/plain;charset=UTF-8';

  try {
    if (navigator.sendBeacon?.(INSIGHT_ENDPOINT, new Blob([payload], { type }))) {
      return;
    }
  } catch {
    // 被扩展拦掉或运行时不支持,继续回落
  }

  try {
    void fetch(INSIGHT_ENDPOINT, {
      method: 'POST',
      body: payload,
      keepalive: true,
      mode: 'same-origin',
      headers: { 'Content-Type': type },
    }).catch(() => {
      // 埋点失败绝不影响页面
    });
  } catch {
    // 静默丢弃
  }
}

/**
 * 从当前 URL 读广告系列参数
 *
 * 只在首批发一次:客户端路由切换后 query 还在,但那已经不是新的来源了。
 */
function readUtm(): { source?: string; medium?: string; campaign?: string } | undefined {
  const params = new URLSearchParams(window.location.search);
  const utm = {
    ...(params.get('utm_source') ? { source: params.get('utm_source') as string } : {}),
    ...(params.get('utm_medium') ? { medium: params.get('utm_medium') as string } : {}),
    ...(params.get('utm_campaign') ? { campaign: params.get('utm_campaign') as string } : {}),
  };

  return Object.keys(utm).length > 0 ? utm : undefined;
}

function currentContext(): BatchContext {
  return {
    pageViewId: ensurePageView(),
    path: window.location.pathname,
    locale: document.documentElement.lang || 'en',
    // referrer 只在首批发一次,后续批次省下这段带宽
    ...(firstBatchSent || !document.referrer ? {} : { referrer: document.referrer }),
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ...(firstBatchSent ? {} : { utm: readUtm() }),
  };
}

export type FlushReason =
  | 'debounce'
  | 'hard-limit'
  | 'threshold'
  | 'hidden'
  | 'pagehide'
  | 'page-change'
  | 'test';

/** 把队列里的东西全部发走 */
export function flush(_reason: FlushReason): void {
  clearTimers();

  if (queue.length === 0 && dwellQueue.length === 0) {
    return;
  }

  const events = queue;
  const dwell = dwellQueue;

  // 先清空再发送:send 内部任何异常都不该导致重发
  queue = [];
  dwellQueue = [];

  const context = currentContext();
  const batches = buildBatches(events, dwell, context, seq);

  seq += batches.length;

  // referrer 与 utm 只随首批发一次,后续批次省下这段带宽
  firstBatchSent = true;

  for (const batch of batches) {
    send(JSON.stringify(batch));
  }
}

function canTrack(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  // 客户端侧的粗筛。真正的爬虫过滤在服务端用 detectBot 做
  return navigator.webdriver !== true;
}

/**
 * 记录一个事件
 *
 * @param options.immediate - 立刻发送。mailto: / tel: / wa.me 点击是导航,
 *   会把页面带离源站,pending 的防抖定时器直接死,这类必须设 true。
 */
export function track(
  name: InsightEventName,
  props: InsightProps = {},
  options: { readonly immediate?: boolean } = {}
): void {
  if (!canTrack()) {
    return;
  }

  // 在入队这一刻就盖上 pageViewId:路由切换时 effect 的先后顺序
  // 便不再影响归属,上一页的事件永远挂在上一个 pageView 下
  queue = [
    ...queue,
    {
      pageViewId: ensurePageView(),
      name,
      ts: Math.max(0, Math.round(now() - pageStartedAt)),
      props,
    },
  ];

  if (options.immediate || queue.length >= MAX_EVENTS_PER_BATCH) {
    flush('threshold');
    return;
  }

  scheduleFlush();
}

/** 记录一批板块停留增量 */
export function trackDwell(entries: readonly DwellPayloadEntry[]): void {
  if (!canTrack() || entries.length === 0) {
    return;
  }

  ensurePageView();
  dwellQueue = [...dwellQueue, ...entries];
  scheduleFlush();
}

export function getPageViewId(): string {
  return pageViewId;
}

/**
 * 换一次新的页面浏览身份
 *
 * 路由切换、以及 bfcache 恢复时调用。bfcache 那条尤其重要:
 * performance.now() 在页面躺在 bfcache 期间照常走,直接续算会把那几十分钟
 * 全算进停留时长里。
 */
export function resetPageView(): string {
  flush('page-change');

  pageViewId = newId();
  pageStartedAt = now();
  seq = 1;

  return pageViewId;
}

/** 仅供测试:把模块单例恢复到初始状态,避免用例之间互相污染 */
export function __resetBeaconForTests(): void {
  clearTimers();
  queue = [];
  dwellQueue = [];
  pageViewId = '';
  pageStartedAt = 0;
  seq = 1;
  firstBatchSent = false;
}
