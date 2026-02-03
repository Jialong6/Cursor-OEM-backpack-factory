/**
 * 动画常量、类型和工具函数
 *
 * 提供统一的动画时长、缓动、变体定义以及响应式断点配置。
 * 所有动画使用 CSS transition + opacity/transform，确保 GPU 加速无布局重排。
 */

/**
 * 动画时长常量 (ms)
 * 所有值限制在 200-400ms 范围内，符合流畅但不拖沓的用户体验标准
 */
export const ANIMATION_DURATION = {
  fast: 200,
  default: 300,
  slow: 400,
} as const

/**
 * 动画缓动函数
 * ease-out 曲线：快速进入、缓慢结束，适合进场动画
 */
export const ANIMATION_EASING = 'cubic-bezier(0.0, 0.0, 0.2, 1)' as const

/**
 * 动画变体类型
 */
export type AnimationVariant = 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right'

/**
 * 所有可用的动画变体列表
 */
export const ANIMATION_VARIANTS: readonly AnimationVariant[] = [
  'fade-up',
  'fade-in',
  'fade-left',
  'fade-right',
] as const

/**
 * 响应式断点配置 (px)
 * 扩展默认 Tailwind 断点，新增 xs(320px) 和 3xl(2560px)
 */
export const RESPONSIVE_BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 2560,
} as const

/**
 * 验证动画时长是否在有效范围 (200-400ms) 内
 */
export function isValidAnimationDuration(duration: number): boolean {
  return duration >= 200 && duration <= 400
}

/**
 * 将动画时长限制在有效范围 (200-400ms) 内
 */
export function clampAnimationDuration(duration: number): number {
  return Math.max(200, Math.min(400, duration))
}
