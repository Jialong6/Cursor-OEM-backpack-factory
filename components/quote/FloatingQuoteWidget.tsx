'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import QuoteFormFields from './QuoteFormFields';
import { useQuoteForm } from './QuoteFormContext';
import { useDraggable } from '@/hooks/useDraggable';

/**
 * 可拖动 Get A Quote 浮窗
 *
 * 桌面端（≥768px）：
 *   - 默认折叠为"右上方"圆角按钮（"Get A Quote"）—— 仅 Y 轴上下拖动
 *   - 点击展开为可双向拖动卡片，含完整 Get A Quote 表单
 *   - 按钮 Y 位置与展开状态独立持久化到 localStorage
 *
 * 手机端（<768px）：
 *   - 仅折叠按钮，也在右上方、可上下拖
 *   - 点击不展开，而是平滑滚动到 #contact-form
 */

const STATE_KEY = 'quote_widget_state';
const BUTTON_Y_KEY = 'quote_widget_button_y';
const CARD_WIDTH = 420;
const CARD_HEIGHT_VH = 0.75;
const MOBILE_BREAKPOINT = 768;
const NAVBAR_HEIGHT = 80;
const BUTTON_VPAD = 8;
const BUTTON_HEIGHT_GUESS = 48;
const DEFAULT_BUTTON_Y = NAVBAR_HEIGHT + 16; // navbar 下方 16px

type WidgetState = 'collapsed' | 'expanded';

function readStoredState(): WidgetState {
  if (typeof window === 'undefined') return 'collapsed';
  try {
    const v = window.localStorage.getItem(STATE_KEY);
    return v === 'expanded' ? 'expanded' : 'collapsed';
  } catch {
    return 'collapsed';
  }
}

function readStoredButtonY(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(BUTTON_Y_KEY);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export default function FloatingQuoteWidget() {
  const t = useTranslations('quoteWidget');
  const { isSubmitting } = useQuoteForm();

  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [state, setState] = useState<WidgetState>('collapsed');

  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: 600 });
  const [yBounds, setYBounds] = useState({
    min: NAVBAR_HEIGHT + BUTTON_VPAD,
    max: 600,
  });

  // 折叠按钮：只允许 Y 拖动；初始 Y 从 localStorage 读
  const initialButtonY =
    typeof window !== 'undefined'
      ? readStoredButtonY() ?? DEFAULT_BUTTON_Y
      : DEFAULT_BUTTON_Y;

  const buttonDrag = useDraggable({
    initial: { x: 0, y: initialButtonY },
    enabled: mounted && state === 'collapsed',
    lockAxis: 'x',
    yBounds,
  });

  // 展开卡片：双向拖动
  const cardDrag = useDraggable({
    initial: { x: 0, y: 0 },
    size: cardSize,
    enabled: mounted && isDesktop && state === 'expanded',
  });

  // 客户端挂载后：屏宽 + 状态恢复
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const updateDesktop = () => setIsDesktop(mq.matches);
    updateDesktop();
    mq.addEventListener('change', updateDesktop);
    setState(readStoredState());
    return () => mq.removeEventListener('change', updateDesktop);
  }, []);

  // 卡片尺寸 + 按钮 Y bounds 跟随视口变化
  useEffect(() => {
    if (!mounted) return;
    const compute = () => {
      const h = Math.min(720, Math.max(420, window.innerHeight * CARD_HEIGHT_VH));
      setCardSize({ width: CARD_WIDTH, height: h });
      setYBounds({
        min: NAVBAR_HEIGHT + BUTTON_VPAD,
        max: Math.max(
          NAVBAR_HEIGHT + BUTTON_VPAD,
          window.innerHeight - BUTTON_HEIGHT_GUESS - 16
        ),
      });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [mounted]);

  // 展开时初始化卡片到右下
  useEffect(() => {
    if (!mounted || !isDesktop || state !== 'expanded') return;
    if (cardDrag.position.x === 0 && cardDrag.position.y === 0) {
      const x = window.innerWidth - cardSize.width - 24;
      const y = window.innerHeight - cardSize.height - 24;
      cardDrag.setPosition({ x: Math.max(8, x), y: Math.max(8, y) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isDesktop, state, cardSize.width, cardSize.height]);

  // 持久化展开/折叠状态
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STATE_KEY, state);
    } catch {
      // 忽略 storage 错误
    }
  }, [mounted, state]);

  // 折叠态：拖动结束后写 Y 到 localStorage
  useEffect(() => {
    if (!mounted) return;
    if (buttonDrag.isDragging) return; // 拖动中不写
    try {
      window.localStorage.setItem(BUTTON_Y_KEY, String(buttonDrag.position.y));
    } catch {
      // 忽略
    }
  }, [mounted, buttonDrag.isDragging, buttonDrag.position.y]);

  const handleOpenClick = useCallback(
    (e: React.MouseEvent) => {
      // 拖动后松手会触发 click，要拦截掉
      if (buttonDrag.wasDraggedRef.current) {
        e.preventDefault();
        buttonDrag.wasDraggedRef.current = false;
        return;
      }
      if (!isDesktop) {
        const el = document.getElementById('contact-form');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        return;
      }
      setState('expanded');
    },
    [buttonDrag.wasDraggedRef, isDesktop]
  );

  const handleMinimize = useCallback(() => {
    if (isSubmitting) return; // 上传/提交进行中不允许最小化，避免丢失进度反馈
    setState('collapsed');
  }, [isSubmitting]);

  if (!mounted) return null;

  // === 折叠态：右上方圆角按钮，仅 Y 拖动 ===
  if (state === 'collapsed') {
    return (
      <button
        type="button"
        {...buttonDrag.handleProps}
        onClick={handleOpenClick}
        aria-label={isDesktop ? t('openLabel') : t('mobileJumpLabel')}
        title={t('dragHandle')}
        className="fixed z-40 flex items-center gap-2 rounded-full bg-primary text-white px-5 py-3 shadow-lg hover:bg-primary-dark hover:shadow-xl transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/30 select-none"
        style={{
          ...buttonDrag.handleProps.style,
          top: buttonDrag.position.y,
          right: 16,
        }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="font-semibold text-sm">{t('openLabel')}</span>
      </button>
    );
  }

  // 展开态：仅桌面端有
  if (!isDesktop) return null;

  return (
    <div
      role="dialog"
      aria-label={t('openLabel')}
      aria-modal="false"
      className="fixed z-40 bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden"
      style={{
        width: cardSize.width,
        height: cardSize.height,
        left: cardDrag.position.x,
        top: cardDrag.position.y,
        transition: cardDrag.isDragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <div
        {...cardDrag.handleProps}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white select-none"
      >
        <div className="flex items-center gap-2 flex-1" aria-label={t('dragHandle')}>
          <svg className="w-4 h-4 opacity-70" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
          </svg>
          <span className="font-semibold text-sm">{t('openLabel')}</span>
        </div>
        <button
          type="button"
          onClick={handleMinimize}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={t('minimize')}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
          className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <QuoteFormFields variant="floating" idPrefix="fq" />
      </div>
    </div>
  );
}
