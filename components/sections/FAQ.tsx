'use client';

import { useTranslations, useLocale } from 'next-intl';
import Accordion from '@/components/ui/Accordion';
import { FAQPageSchema, type FAQSection } from '@/components/seo';

/**
 * FAQ 常见问题区块组件
 *
 * 功能：
 * - 展示分类组织的 FAQ 内容（5 个分类）
 * - 使用手风琴形式呈现问答内容
 * - 点击问题展开答案，折叠其他已展开的答案
 * - 包含 FAQPage JSON-LD 结构化数据
 * - 支持中英文内容切换
 *
 * 验证需求：10.1, 10.2, 10.3, 10.4, 10.5
 */
export default function FAQ() {
  const t = useTranslations('faq');
  const locale = useLocale();

  // 获取 FAQ 分类数据
  const sections = t.raw('sections') as FAQSection[];

  return (
    <>
      {/* FAQPage JSON-LD 结构化数据 - 需求 10.5 */}
      <FAQPageSchema sections={sections} />

      <section
        id="faq"
        className="relative bg-neutral-50 px-6 py-20 md:px-12 lg:py-28"
      >
        <div className="mx-auto w-full max-w-5xl">
          {/* 标题 */}
          <h2 className="mb-16 text-center text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>

          {/* FAQ 分类 */}
          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* 分类标题 */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                    {sectionIndex + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 md:text-3xl">
                    {section.title}
                  </h3>
                </div>

                {/* 该分类下的问答列表 */}
                <Accordion items={section.items} />
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div className="mt-16 rounded-xl bg-white border border-neutral-200 p-8 text-center">
            <p className="mb-4 text-lg text-neutral-600">
              {locale === 'zh' ? (
                <>
                  没找到您想要的答案？
                  <span className="font-semibold text-primary">
                    欢迎随时联系我们
                  </span>
                  ，我们的团队将竭诚为您解答。
                </>
              ) : (
                <>
                  Can&apos;t find what you&apos;re looking for?{' '}
                  <span className="font-semibold text-primary">
                    Feel free to contact us
                  </span>{' '}
                  — our team is here to help.
                </>
              )}
            </p>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  const navbarHeight = 80;
                  const targetPosition =
                    contactSection.getBoundingClientRect().top +
                    window.pageYOffset -
                    navbarHeight;
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth',
                  });
                }
              }}
              className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              {locale === 'zh' ? '联系我们' : 'Contact Us'}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
