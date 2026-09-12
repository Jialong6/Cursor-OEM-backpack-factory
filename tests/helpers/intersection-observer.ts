/**
 * 可控的 IntersectionObserver 替身
 *
 * happy-dom 里 IntersectionObserver 这个类是存在的,但它的 observe() 是
 * 空实现(node_modules/happy-dom/lib/intersection-observer/IntersectionObserver.js),
 * 回调永远不会触发 —— 不报错,只是静默拿不到任何数据。这是最危险的一种「缺」:
 * 测试会绿,功能却是死的。
 *
 * 所以凡是依赖 IO 的测试都必须换上这个替身,由测试自己决定何时投递 entry。
 * 现有 tests/hooks/useScrollAnimation.test.ts 里的简易 mock 只设了
 * isIntersecting 与 target,停留时长还需要三个高度字段,这里一并补全。
 */
import { vi } from 'vitest';

export interface EmitOptions {
  readonly target: Element;
  readonly isIntersecting?: boolean;
  /** 可见部分的高度 */
  readonly visibleHeight?: number;
  /** 元素自身的高度 */
  readonly selfHeight?: number;
  /** 可用视口的高度 */
  readonly viewportHeight?: number;
}

export interface FakeIntersectionObserver {
  /** 向所有活着的观测器投递一批 entry */
  emit(entries: readonly EmitOptions[]): void;
  /** 当前被观测的元素 */
  observed(): readonly Element[];
  /** disconnect 被调用了几次 */
  disconnectCount(): number;
  /** 创建过几个观测器实例 */
  instanceCount(): number;
  /** 最后一次创建时传入的配置 */
  lastInit(): IntersectionObserverInit | undefined;
  restore(): void;
}

interface Instance {
  readonly callback: IntersectionObserverCallback;
  readonly targets: Set<Element>;
  connected: boolean;
}

export function installIntersectionObserver(): FakeIntersectionObserver {
  const original = globalThis.IntersectionObserver;
  const instances: Instance[] = [];
  let disconnects = 0;
  let lastInit: IntersectionObserverInit | undefined;

  class FakeObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];

    private readonly instance: Instance;

    constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
      lastInit = init;
      this.instance = { callback, targets: new Set(), connected: true };
      instances.push(this.instance);
    }

    observe(target: Element): void {
      this.instance.targets.add(target);
    }

    unobserve(target: Element): void {
      this.instance.targets.delete(target);
    }

    disconnect(): void {
      disconnects++;
      this.instance.connected = false;
      this.instance.targets.clear();
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeObserver);

  const buildEntry = (options: EmitOptions): IntersectionObserverEntry => {
    const viewportHeight = options.viewportHeight ?? 800;
    const selfHeight = options.selfHeight ?? 600;
    const visibleHeight = options.visibleHeight ?? (options.isIntersecting === false ? 0 : selfHeight);

    return {
      target: options.target,
      isIntersecting: options.isIntersecting ?? visibleHeight > 0,
      intersectionRatio: selfHeight === 0 ? 0 : visibleHeight / selfHeight,
      intersectionRect: { height: visibleHeight } as DOMRectReadOnly,
      boundingClientRect: { height: selfHeight } as DOMRectReadOnly,
      rootBounds: { height: viewportHeight } as DOMRectReadOnly,
      time: 0,
    } as IntersectionObserverEntry;
  };

  return {
    emit(entries) {
      const built = entries.map(buildEntry);

      for (const instance of instances) {
        if (!instance.connected) continue;

        const mine = built.filter((entry) => instance.targets.has(entry.target));
        if (mine.length > 0) {
          instance.callback(mine, {} as IntersectionObserver);
        }
      }
    },
    observed() {
      const all = new Set<Element>();
      for (const instance of instances) {
        if (!instance.connected) continue;
        for (const target of instance.targets) all.add(target);
      }
      return [...all];
    },
    disconnectCount: () => disconnects,
    instanceCount: () => instances.length,
    lastInit: () => lastInit,
    restore() {
      if (original) {
        vi.stubGlobal('IntersectionObserver', original);
      }
    },
  };
}
