/**
 * 找出当前页面上要观测停留时长的板块
 *
 * 用选择器扫 DOM 而不是硬编码 id 列表:后者每加一个页面都得改常量,
 * 而且看厂页的 4 个 tour-* id 根本不挂在 <section> 上 —— 它们挂在 <h2>,
 * <section> 只有 aria-labelledby(components/sections/VirtualTour.tsx:86 起)。
 *
 * 扫 DOM 还有一个好处:11 个首页板块组件一行都不用改。
 *
 * 本模块不读取全局 document,root 由调用方传入,便于测试。
 */

/**
 * 板块选择器
 *
 * data-analytics-section 是逃生口:以后有哪个区块既不是 <section>
 * 又想被观测,加这个属性即可,不必改这里。
 */
export const SECTION_SELECTOR =
  '[data-analytics-section], section[id], section[aria-labelledby]';

/**
 * 兜底 key
 *
 * blog / blog/[slug] / glossary / fact-sheet 一个 <section> 都没有。
 * 对这些页面退回观测 main 本身,博客文章至少拿得到阅读时长。
 */
export const PAGE_FALLBACK_KEY = '_page';

/**
 * 单页最多观测多少个板块
 *
 * IntersectionObserver 本身很便宜,但阈值梯子有 11 档,
 * 元素数量失控时回调频率会很难看。首页 11 个,上限留足余量。
 */
export const MAX_TRACKED_SECTIONS = 40;

export interface SectionTarget {
  readonly key: string;
  readonly element: Element;
}

/**
 * 取一个元素的板块标识
 *
 * 优先级:显式标注 > id > aria 指向的标题 id。
 */
export function sectionKey(element: Element): string {
  return (
    element.getAttribute('data-analytics-section') ||
    element.id ||
    element.getAttribute('aria-labelledby') ||
    ''
  );
}

function findFallback(root: ParentNode): Element | null {
  return root.querySelector('main#main-content') ?? root.querySelector('main');
}

/**
 * 扫出当前页面要观测的板块,按文档顺序、去重、截断
 *
 * @param root - 通常是 document;传入而不是内部读取,便于测试
 */
export function collectSections(
  root: ParentNode | null | undefined
): readonly SectionTarget[] {
  if (!root) {
    return [];
  }

  const seen = new Set<string>();
  const targets: SectionTarget[] = [];

  for (const element of root.querySelectorAll(SECTION_SELECTOR)) {
    if (targets.length >= MAX_TRACKED_SECTIONS) {
      break;
    }

    const key = sectionKey(element);

    if (key === '' || seen.has(key)) {
      continue;
    }

    seen.add(key);
    targets.push({ key, element });
  }

  if (targets.length > 0) {
    return targets;
  }

  const fallback = findFallback(root);

  return fallback ? [{ key: PAGE_FALLBACK_KEY, element: fallback }] : [];
}
