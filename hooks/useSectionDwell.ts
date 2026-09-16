'use client'

import { useEffect, useRef } from 'react'
import { NAVBAR_HEIGHT } from '@/lib/navigation'
import { collectSections } from '@/lib/analytics/section-targets'
import {
  applyVisibility,
  createDwellState,
  flushDwell,
  markActivity,
  setPaused,
  type DwellEntry,
  type DwellState,
} from '@/lib/analytics/dwell-accumulator'

/**
 * 观测各板块的停留时长
 *
 * 为什么不复用现有的两个 observer:
 * - useScrollAnimation 首次可见即 unobserve,语义是「首次曝光」;而且它的 ref
 *   挂在内层 div(HeroBanner 有四个实例分别挂标题/描述/CTA/统计块),不是 section。
 * - useActiveSection 只观测 NAV_ITEMS 的七个 id,缺 costAdvantage 等四个,
 *   也不累积时长。
 *
 * 本 hook 不挂 ref,而是用选择器扫 DOM —— 11 个板块组件一行都不用改。
 *
 * pageKey 由外部传入而不是内部调 usePathname:这样 hook 不隐式依赖
 * next/navigation,测试里直接 rerender 换 key 就能模拟路由切换。
 */

/** 阈值梯子 */
const DWELL_THRESHOLDS = Object.freeze([
  0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1,
])

/** 心跳上报间隔。长会话不必等到页面关闭才交数据 */
const HEARTBEAT_MS = 30_000

/** 算作「用户还在」的交互 */
const ACTIVITY_EVENTS = Object.freeze([
  'scroll',
  'pointermove',
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
] as const)

/**
 * 这次交出增量是因为什么
 *
 * 'pagehide' 对调用方有额外含义:页面马上要走,攒批的定时器会死在原地,
 * 所以调用方拿到这个原因时应当把传输层也一并发走。
 */
export type DwellFlushReason = 'heartbeat' | 'hidden' | 'pagehide' | 'page-change'

export interface UseSectionDwellOptions {
  /** 页面标识。变化时先把上一页的停留发走,再按新 DOM 重建观测 */
  pageKey: string
  /** 拿到增量时的回调 */
  onFlush: (entries: readonly DwellEntry[], reason: DwellFlushReason) => void
  heartbeatMs?: number
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function useSectionDwell(options: UseSectionDwellOptions): void {
  const { pageKey, heartbeatMs = HEARTBEAT_MS } = options

  const stateRef = useRef<DwellState>(createDwellState(now()))
  // onFlush 放进 ref,调用方不必 useCallback 也不会让整个 effect 重跑
  const onFlushRef = useRef(options.onFlush)
  onFlushRef.current = options.onFlush

  useEffect(() => {
    let disposed = false
    let observer: IntersectionObserver | null = null
    let rafId = 0

    const flush = (reason: DwellFlushReason): void => {
      const result = flushDwell(stateRef.current, now())
      stateRef.current = result.state

      if (result.entries.length > 0) {
        onFlushRef.current(result.entries, reason)
      }
    }

    const handleEntries: IntersectionObserverCallback = (entries) => {
      const at = now()

      for (const entry of entries) {
        // 先读 data 属性再读 id:属性里放的是 collectSections 定下的 key,
        // 那才是权威值。反过来读会让 <main id="main-content"> 这个兜底目标
        // 上报自己的 id,哨兵 key 就永远出不来。
        const sectionId = entry.target.getAttribute('data-analytics-section') || entry.target.id

        if (!sectionId) {
          continue
        }

        // 可用视口高度。rootMargin 已经扣掉了导航栏,所以 rootBounds 直接可用
        const viewportHeight = entry.rootBounds?.height || window.innerHeight || 1
        const selfHeight = entry.boundingClientRect.height || 1
        const visibleHeight = entry.isIntersecting ? entry.intersectionRect.height : 0

        stateRef.current = applyVisibility(stateRef.current, at, sectionId, {
          coverage: visibleHeight / viewportHeight,
          selfRatio: visibleHeight / selfHeight,
        })
      }
    }

    /**
     * 扫描并观测板块
     *
     * 先等一帧再扫:不是为了 IntersectionObserver 的几何(它自己会异步投递
     * 首个 entry,几何永远是新鲜的),而是为了跨过 React 的 commit,
     * 让 Suspense / 动态内容先落地。一个都没扫到时再等一帧重试一次就放弃。
     */
    const scan = (attempt: number): void => {
      if (disposed) {
        return
      }

      const targets = collectSections(document)

      if (targets.length === 0 && attempt === 0) {
        rafId = requestAnimationFrame(() => scan(1))
        return
      }

      observer = new IntersectionObserver(handleEntries, {
        threshold: [...DWELL_THRESHOLDS],
        // 顶部那条被不透明的固定导航盖着,不算「在看」;
        // 顺带让 rootBounds.height 直接等于可用视口高度
        rootMargin: `-${NAVBAR_HEIGHT}px 0px 0px 0px`,
      })

      for (const target of targets) {
        // 一律盖上 key:观测的是元素本身,回调里只能从属性回读。
        // 无条件写入保证「上报的 key 恒等于 collectSections 定下的 key」。
        target.element.setAttribute('data-analytics-section', target.key)
        observer.observe(target.element)
      }
    }

    const handleActivity = (): void => {
      stateRef.current = markActivity(stateRef.current, now())
    }

    const handleVisibility = (): void => {
      const hidden = document.visibilityState === 'hidden'
      stateRef.current = setPaused(stateRef.current, now(), hidden)

      if (hidden) {
        flush('hidden')
      }
    }

    /**
     * 页面即将离开(关闭、跳走,或进 bfcache)
     *
     * 必须和 visibilitychange 一起挂,不能二选一:移动端 Safari 的部分关闭
     * 路径只发 pagehide。lib/analytics/beacon.ts 两条都挂着,这边只挂一条
     * 的后果就是队列被发走、而停留数据压根没进过队列 —— 线上真的丢过。
     *
     * 先暂停再交数据:进了 bfcache 的页面,performance.now() 还在走,
     * 不暂停的话躺着的那几分钟会被算成有人在读。
     */
    const handlePageHide = (): void => {
      stateRef.current = setPaused(stateRef.current, now(), true)
      flush('pagehide')
    }

    /** 从 bfcache 回来,把钟重新起起来(setPaused(false) 顺带重置空闲基线) */
    const handlePageShow = (): void => {
      stateRef.current = setPaused(stateRef.current, now(), false)
    }

    rafId = requestAnimationFrame(() => scan(0))

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    const heartbeat = setInterval(() => flush('heartbeat'), heartbeatMs)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      clearInterval(heartbeat)

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)

      observer?.disconnect()

      // 先把上一页的数据发走,再让新的 effect 按新 DOM 重建
      flush('page-change')
      stateRef.current = createDwellState(now())
    }
  }, [pageKey, heartbeatMs])
}
