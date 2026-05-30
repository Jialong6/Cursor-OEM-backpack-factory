import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import TurnstileWidget from '@/components/ui/TurnstileWidget';

const messages = {
  contact: {
    form: {
      humanVerification: {
        label: 'Human Verification',
        placeholder: 'Loading verification...',
        error: 'Please complete the verification before submitting',
        notConfigured:
          'Verification is not configured. Form submissions will be accepted in development mode only.',
      },
    },
  },
};

function renderWidget(props: React.ComponentProps<typeof TurnstileWidget>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TurnstileWidget {...props} />
    </NextIntlClientProvider>
  );
}

// 捕获传给 turnstile.render 的回调，便于在测试里手动触发
type RenderOpts = {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
};
let lastRenderOpts: RenderOpts | null = null;
const renderMock = vi.fn((_el: HTMLElement, opts: RenderOpts) => {
  lastRenderOpts = opts;
  return 'widget-1';
});
const resetMock = vi.fn();
const removeMock = vi.fn();

describe('TurnstileWidget', () => {
  beforeEach(() => {
    lastRenderOpts = null;
    renderMock.mockClear();
    resetMock.mockClear();
    removeMock.mockClear();
    // 预置 window.turnstile，使脚本加载逻辑直接走"已就绪"分支，不发起真实网络
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: renderMock,
      reset: resetMock,
      remove: removeMock,
    };
  });

  afterEach(() => {
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  describe('configured state', () => {
    it('renders the container and calls render() with the sitekey', async () => {
      renderWidget({ siteKey: 'abc123', onVerify: vi.fn() });
      expect(screen.getByTestId('turnstile-container')).toBeInTheDocument();
      await waitFor(() => expect(renderMock).toHaveBeenCalledTimes(1));
      expect(lastRenderOpts?.sitekey).toBe('abc123');
    });

    it('passes the verified token to onVerify', async () => {
      const onVerify = vi.fn();
      renderWidget({ siteKey: 'key', onVerify });
      await waitFor(() => expect(renderMock).toHaveBeenCalled());
      act(() => lastRenderOpts!.callback('real-token-xyz'));
      expect(onVerify).toHaveBeenCalledWith('real-token-xyz');
    });

    it('routes error-callback to onError', async () => {
      const onVerify = vi.fn();
      const onError = vi.fn();
      renderWidget({ siteKey: 'key', onVerify, onError });
      await waitFor(() => expect(renderMock).toHaveBeenCalled());
      act(() => lastRenderOpts!['error-callback']?.());
      expect(onError).toHaveBeenCalled();
      expect(onVerify).not.toHaveBeenCalled();
    });

    it('clears the token via onVerify("") when the challenge expires', async () => {
      const onVerify = vi.fn();
      renderWidget({ siteKey: 'key', onVerify });
      await waitFor(() => expect(renderMock).toHaveBeenCalled());
      act(() => lastRenderOpts!['expired-callback']?.());
      expect(onVerify).toHaveBeenCalledWith('');
    });

    it('resets the widget when resetSignal increments', async () => {
      const { rerender } = renderWidget({ siteKey: 'key', resetSignal: 0, onVerify: vi.fn() });
      await waitFor(() => expect(renderMock).toHaveBeenCalled());
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <TurnstileWidget siteKey="key" resetSignal={1} onVerify={vi.fn()} />
        </NextIntlClientProvider>
      );
      await waitFor(() => expect(resetMock).toHaveBeenCalledWith('widget-1'));
    });

    it('removes the widget on unmount', async () => {
      const { unmount } = renderWidget({ siteKey: 'key', onVerify: vi.fn() });
      await waitFor(() => expect(renderMock).toHaveBeenCalled());
      unmount();
      expect(removeMock).toHaveBeenCalledWith('widget-1');
    });
  });

  describe('not configured state', () => {
    it('renders the notConfigured notice when siteKey is missing', () => {
      renderWidget({ siteKey: '', onVerify: vi.fn() });
      expect(screen.queryByTestId('turnstile-container')).not.toBeInTheDocument();
      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });

    it('auto-emits dev-skip-token through onVerify on mount', () => {
      const onVerify = vi.fn();
      renderWidget({ siteKey: '', onVerify });
      expect(onVerify).toHaveBeenCalledWith('dev-skip-token');
    });
  });
});
