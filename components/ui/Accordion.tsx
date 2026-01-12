'use client';

import { useState } from 'react';

/**
 * Accordion 手风琴组件
 *
 * 功能：
 * - 可展开/折叠的内容面板
 * - 一次只展开一个项目
 * - 平滑动画过渡
 * - 无障碍键盘支持
 */

interface AccordionItem {
  q: string; // Question
  a: string; // Answer
}

interface AccordionProps {
  items: AccordionItem[];
  /** 可选：默认展开的项目索引 */
  defaultOpenIndex?: number;
}

export default function Accordion({ items, defaultOpenIndex }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpenIndex ?? null
  );

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-lg border-2 border-gray-200 bg-white transition-all hover:border-primary-cyan"
          >
            {/* Question Button */}
            <button
              onClick={() => handleToggle(index)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:ring-offset-2"
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${index}`}
            >
              <span className="text-lg font-semibold text-primary-blue">
                {item.q}
              </span>

              {/* Expand/Collapse Icon */}
              <svg
                className={`h-6 w-6 flex-shrink-0 text-primary-cyan transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Answer Content */}
            <div
              id={`accordion-content-${index}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-gray-200 bg-gray-50 p-5">
                <p className="leading-relaxed text-gray-700">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
