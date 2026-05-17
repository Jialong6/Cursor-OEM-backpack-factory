import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import MCaptchaWidget from '@/components/ui/MCaptchaWidget';

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

function renderWidget(props: React.ComponentProps<typeof MCaptchaWidget>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MCaptchaWidget {...props} />
    </NextIntlClientProvider>
  );
}

describe('MCaptchaWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('configured state', () => {
    it('renders an iframe with sitekey in src', () => {
      renderWidget({
        instanceUrl: 'https://captcha.example.com',
        siteKey: 'abc123',
        onVerify: vi.fn(),
      });
      const iframe = screen.getByTitle('mCaptcha Human Verification') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://captcha.example.com/widget/?sitekey=abc123');
    });

    it('strips trailing slash from instanceUrl', () => {
      renderWidget({
        instanceUrl: 'https://captcha.example.com/',
        siteKey: 'key',
        onVerify: vi.fn(),
      });
      const iframe = screen.getByTitle('mCaptcha Human Verification') as HTMLIFrameElement;
      expect(iframe.src).toBe('https://captcha.example.com/widget/?sitekey=key');
    });

    it('passes through token from matching-origin postMessage', () => {
      const onVerify = vi.fn();
      renderWidget({
        instanceUrl: 'https://captcha.example.com',
        siteKey: 'key',
        onVerify,
      });

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://captcha.example.com',
            data: { token: 'real-token-xyz' },
          })
        );
      });
      expect(onVerify).toHaveBeenCalledWith('real-token-xyz');
    });

    it('ignores postMessage from mismatched origin', () => {
      const onVerify = vi.fn();
      renderWidget({
        instanceUrl: 'https://captcha.example.com',
        siteKey: 'key',
        onVerify,
      });

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://evil.example.com',
            data: { token: 'attacker-token' },
          })
        );
      });
      expect(onVerify).not.toHaveBeenCalled();
    });

    it('routes error payload to onError', () => {
      const onVerify = vi.fn();
      const onError = vi.fn();
      renderWidget({
        instanceUrl: 'https://captcha.example.com',
        siteKey: 'key',
        onVerify,
        onError,
      });

      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://captcha.example.com',
            data: { error: 'verification timeout' },
          })
        );
      });
      expect(onError).toHaveBeenCalledWith('verification timeout');
      expect(onVerify).not.toHaveBeenCalled();
    });

    it('removes the message listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderWidget({
        instanceUrl: 'https://captcha.example.com',
        siteKey: 'key',
        onVerify: vi.fn(),
      });
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('not configured state', () => {
    it('renders the notConfigured notice when instanceUrl is missing', () => {
      renderWidget({ instanceUrl: '', siteKey: 'key', onVerify: vi.fn() });
      expect(screen.queryByTitle('mCaptcha Human Verification')).not.toBeInTheDocument();
      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });

    it('renders the notConfigured notice when siteKey is missing', () => {
      renderWidget({ instanceUrl: 'https://captcha.example.com', siteKey: '', onVerify: vi.fn() });
      expect(screen.queryByTitle('mCaptcha Human Verification')).not.toBeInTheDocument();
      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });

    it('auto-emits dev-skip-token through onVerify on mount', () => {
      const onVerify = vi.fn();
      renderWidget({ instanceUrl: '', siteKey: '', onVerify });
      expect(onVerify).toHaveBeenCalledWith('dev-skip-token');
    });
  });
});
