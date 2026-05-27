'use client';

import { useTranslations } from 'next-intl';
import Carousel from '@/components/ui/Carousel';

/**
 * Testimonials 客户评价区块
 *
 * 使用 Carousel 轮播展示客户评价
 * - 自动播放（6秒间隔）
 * - 循环模式
 * - 显示客户名称、职位、公司和评价内容
 * - 星级评分展示
 */

interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

function Star({ fillRatio }: { fillRatio: number }) {
  if (fillRatio <= 0) return <StarIcon className="h-5 w-5 text-neutral-200" />;
  if (fillRatio >= 1) return <StarIcon className="h-5 w-5 text-yellow-400" />;
  return (
    <span className="relative inline-block h-5 w-5">
      <span className="absolute inset-0">
        <StarIcon className="h-5 w-5 text-neutral-200" />
      </span>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fillRatio * 100}%` }}
      >
        <StarIcon className="h-5 w-5 text-yellow-400" />
      </span>
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return <Star key={i} fillRatio={fill} />;
      })}
    </div>
  );
}

export default function Testimonials() {
  const t = useTranslations('testimonials');

  const items = t.raw('items') as TestimonialItem[];

  const carouselItems = items.map((item, index) => ({
    id: `testimonial-${index}`,
    content: (
      <div className="flex flex-col items-center px-4 py-8 text-center md:px-12">
        <StarRating rating={item.rating} />
        <blockquote className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-700 md:text-xl">
          &ldquo;{item.quote}&rdquo;
        </blockquote>
        <div className="mt-6">
          <p className="text-lg font-semibold text-neutral-800">{item.name}</p>
          <p className="text-sm text-neutral-500">
            {item.role}, {item.company}
          </p>
        </div>
      </div>
    ),
  }));

  return (
    <section
      id="testimonials"
      className="bg-white px-6 py-20 md:px-12 lg:py-28"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-neutral-800 md:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Carousel
            items={carouselItems}
            loop
            autoPlay
            autoPlayInterval={6000}
            label={t('title')}
          />
        </div>
      </div>
    </section>
  );
}
