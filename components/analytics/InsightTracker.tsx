'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSectionDwell } from '@/hooks/useSectionDwell';
import { classifyLink } from '@/lib/analytics/link-classifier';
import { newMilestones, scrollPercent } from '@/lib/analytics/scroll-depth';
import { resetPageView, track, trackDwell } from '@/lib/analytics/beacon';
import type { DwellEntry } from '@/lib/analytics/dwell-accumulator';

/**
 * 第二期自建埋点的唯一生命周期挂载点
 *
 * 挂在 components/analytics/index.tsx 里,因此 app/[locale]/layout.tsx
 * 本期一行都不用改 —— 爆炸半径小很多。那个位置也正好合适:在
 * NextIntlClientProvider 内部,且在 <main> 之后渲染,首次挂载时板块 DOM
 * 已经存在,扫一次就中。
 *
 * 本组件自己不产出任何正确性逻辑,全部委托给已经单测过的纯模块。
 */

/**
 * 外链点击靠一个 document 级委托监听器采集,而不是去改六个组件
 *
 * lib/contact-links.ts 是会被服务端组件 import 的纯字符串模块,不能塞
 * track();而 Contact.tsx 里还有一个没走那个模块的裸 mailto:,逐个改
 * 迟早会漏。委托的做法零组件改动,而且以后任何地方新加一个 WhatsApp
 * 链接都会自动被采到。
 *
 * 只上报元素上的 data-analytics-label,绝不上报 href —— 电话号码和
 * 邮箱地址一个字符都不进库。
 */
function useOutboundClicks(): void {
  useEffect(() => {
    const handleClick = (event: Event): void => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a[href]');

      if (!anchor) {
        return;
      }

      const eventName = classifyLink(anchor.getAttribute('href'));

      if (!eventName) {
        return;
      }

      const label = anchor.getAttribute('data-analytics-label') ?? '';

      // 立刻发送:这些点击都是导航,页面马上就要被带离源站,
      // 攒批的定时器会直接死在那里
      track(eventName, { label }, { immediate: true });
    };

    // capture 阶段:组件自己的 onClick 里若调了 stopPropagation 也不会漏
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);
}

/** 滚动深度里程碑,每次页面浏览各报一次 */
function useScrollDepth(pageKey: string): void {
  useEffect(() => {
    const reached = new Set<number>();

    const handleScroll = (): void => {
      const percent = scrollPercent(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight
      );

      for (const milestone of newMilestones(percent, reached)) {
        reached.add(milestone);
        track('scroll_depth', { pct: milestone });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pageKey]);
}

export default function InsightTracker() {
  const pathname = usePathname();
  const mountedPathRef = useRef<string | null>(null);

  const handleDwellFlush = useCallback((entries: readonly DwellEntry[]) => {
    trackDwell(entries);
  }, []);

  useSectionDwell({ pageKey: pathname, onFlush: handleDwellFlush });
  useOutboundClicks();
  useScrollDepth(pathname);

  // 页面浏览:首次挂载算一次,之后每次路由切换算一次
  useEffect(() => {
    // 首屏那次不必换身份,beacon 会惰性生成第一个 pageViewId
    if (mountedPathRef.current !== null) {
      resetPageView();
    }

    mountedPathRef.current = pathname;
    track('page_view', { path: pathname });
  }, [pathname]);

  /**
   * bfcache 恢复要开一条全新的页面浏览
   *
   * performance.now() 在页面躺在 bfcache 期间照常走,直接续算会把躺着的
   * 那几十分钟全算进停留时长里。开新身份之后,所有累计值都不跨越一次
   * pagehide,这条不变量才成立。
   */
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent): void => {
      if (!event.persisted) {
        return;
      }

      resetPageView();
      track('page_view', { path: pathname, restored: true });
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pathname]);

  return null;
}
