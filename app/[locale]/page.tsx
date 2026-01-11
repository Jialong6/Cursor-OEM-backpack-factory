import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

/**
 * 首页组件
 * 展示项目初始化状态和双语切换功能
 */
export default function Home() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-cyan to-primary-blue">
      <div className="text-center text-white p-8 max-w-2xl">
        {/* 语言切换器 */}
        <div className="flex justify-end mb-8">
          <LanguageSwitcher />
        </div>

        {/* 品牌标题 */}
        <h1 className="text-h1 font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-h3 mb-6">{t('hero.subtitle')}</p>

        {/* 配置完成状态 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 space-y-3">
          <h2 className="text-h4 font-semibold mb-4">
            ✅ {t('home.setupComplete')}
          </h2>
          <p className="text-body">✅ {t('home.features.nextjs')}</p>
          <p className="text-body">✅ {t('home.features.tailwind')}</p>
          <p className="text-body">✅ {t('home.features.brandColors')}</p>
          <p className="text-body">✅ {t('home.features.fluidFonts')}</p>
          <p className="text-body">✅ {t('home.features.i18n')}</p>
          <p className="text-body">✅ {t('home.features.middleware')}</p>
        </div>
      </div>
    </div>
  );
}
