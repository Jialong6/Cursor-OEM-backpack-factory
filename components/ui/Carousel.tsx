'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Carousel 轮播组件
 *
 * 功能：
 * - 前进/后退导航
 * - 可选循环模式（loop）
 * - 可选自动播放（autoPlay）
 * - 点击指示器直接跳转
 * - 键盘导航（左右箭头）
 * - 完整无障碍支持（WCAG AA）
 */

interface CarouselItem {
  id: string;
  content: React.ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  /** 启用循环模式 */
  loop?: boolean;
  /** 启用自动播放 */
  autoPlay?: boolean;
  /** 自动播放间隔（毫秒），默认 5000 */
  autoPlayInterval?: number;
  /** 幻灯片切换回调 */
  onSlideChange?: (index: number) => void;
  /** 无障碍标签 */
  label?: string;
}

export default function Carousel({
  items,
  loop = false,
  autoPlay = false,
  autoPlayInterval = 5000,
  onSlideChange,
  label = 'Carousel',
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const hasMultipleItems = items.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      onSlideChange?.(index);
    },
    [onSlideChange]
  );

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      goTo(currentIndex + 1);
    } else if (loop) {
      goTo(0);
    }
  }, [currentIndex, items.length, loop, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    } else if (loop) {
      goTo(items.length - 1);
    }
  }, [currentIndex, items.length, loop, goTo]);

  // 自动播放
  useEffect(() => {
    if (!autoPlay || !hasMultipleItems) return;

    const timer = setInterval(() => {
      goNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, hasMultipleItems, goNext]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  if (items.length === 0) {
    return null;
  }

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === items.length - 1;

  return (
    <div
      data-testid="carousel"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      ref={carouselRef}
      className="relative w-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      {/* Slides */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              data-testid="carousel-slide"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${items.length}`}
              className="w-full flex-shrink-0"
            >
              {typeof item.content === 'string' ? (
                <div className="p-6">{item.content}</div>
              ) : (
                item.content
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      {hasMultipleItems && (
        <>
          <button
            onClick={goPrev}
            disabled={!loop && isAtStart}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <svg
              className="h-5 w-5 text-neutral-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goNext}
            disabled={!loop && isAtEnd}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <svg
              className="h-5 w-5 text-neutral-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {hasMultipleItems && (
        <div className="mt-4 flex justify-center gap-2" role="tablist">
          {items.map((_, index) => (
            <button
              key={index}
              data-testid="carousel-indicator"
              data-active={index === currentIndex ? 'true' : 'false'}
              data-index={String(index)}
              onClick={() => goTo(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary scale-125'
                  : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Slide {currentIndex + 1} of {items.length}
      </div>
    </div>
  );
}
