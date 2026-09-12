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

export interface UseSectionDwellOptions {
  /** 页面标识。变化时先把上一页的停留发走,再按新 DOM 重建观测 */
  pageKey: string
  /** 拿到增量时的回调 */
  onFlush: (entries: readonly DwellEntry[]) => void
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

    const flush = (): void => {
      const result = flushDwell(stateRef.current, now())
      stateRef.current = result.state

      if (result.entries.length > 0) {
        onFlushRef.current(result.entries)
      }
    }

    const handleEntries: IntersectionObserverCallback = (entries) => {
      const at = now()

      for (const entry of entries) {
        const sectionId = entry.target.id || entry.target.getAttribute('data-analytics-section')

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
        // 观测的是元素本身,sectionId 从 id / data 属性回读
        if (!target.element.id && !target.element.getAttribute('data-analytics-section')) {
          target.element.setAttribute('data-analytics-section', target.key)
        }
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
        // 移动端唯一可靠的「会话可能结束」信号,立刻交数据
        flush()
      }
    }

    rafId = requestAnimationFrame(() => scan(0))

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const heartbeat = setInterval(flush, heartbeatMs)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      clearInterval(heartbeat)

      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }
      document.removeEventListener('visibilitychange', handleVisibility)

      observer?.disconnect()

      // 先把上一页的数据发走,再让新的 effect 按新 DOM 重建
      flush()
      stateRef.current = createDwellState(now())
    }
  }, [pageKey, heartbeatMs])
}
