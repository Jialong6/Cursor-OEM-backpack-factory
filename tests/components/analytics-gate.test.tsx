/**
 * components/analytics/AnalyticsGate —— 两条地区门禁的接线
 *
 * 门禁一(中国):CN 访客不加载 GA 与 Clarity,也不弹同意条。
 * 门禁二(EEA/英国/瑞士):脚本照常加载但默认拒绝,同意条要求访客先选择;
 *   其余地区默认放行,不打扰。
 *
 * next/script 在 happy-dom 里不会真的注入 DOM,这里替换成普通 script 元素,
 * 好让断言能看到 src 与内联内容。
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'node:fs';
import path from 'node:path';
import AnalyticsGate from '@/components/analytics/AnalyticsGate';
import { CONSENT_STORAGE_KEY } from '@/lib/consent-storage';
import { GEO_COUNTRY_COOKIE } from '@/lib/analytics-config';

// type="text/plain" 让 happy-dom 不执行内联脚本 —— 否则 Clarity 的 snippet
// 会真的去 fetch clarity.ms,既拖慢测试又在缅甸网络下可能挂住
vi.mock('next/script', () => ({
  default: ({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: string;
  }) =>
    src ? (
      <script data-testid={id} data-src={src} type="text/plain" />
    ) : (
      <script data-testid={id} type="text/plain">
        {children}
      </script>
    ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const messages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'locales', 'en.json'), 'utf8')
);

function setCountry(code: string): void {
  document.cookie = `${GEO_COUNTRY_COOKIE}=${code}; path=/`;
}

function clearCountry(): void {
  document.cookie = `${GEO_COUNTRY_COOKIE}=; path=/; max-age=0`;
}

function renderGate() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AnalyticsGate />
    </NextIntlClientProvider>
  );
}

function scriptMarkup(): string {
  return document.body.innerHTML;
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST12345');
  vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity123');
  window.localStorage.clear();
  clearCountry();
});

afterEach(() => {
  vi.unstubAllEnvs();
  clearCountry();
});

describe('unregulated regions', () => {
  test('loads both vendors without asking for consent', async () => {
    setCountry('US');
    renderGate();

    await waitFor(() => {
      expect(scriptMarkup()).toContain('googletagmanager.com');
    });

    expect(scriptMarkup()).toContain('clarity.ms');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('starts Google Analytics with analytics storage already granted', async () => {
    setCountry('US');
    renderGate();

    await waitFor(() => {
      expect(screen.getByTestId('ga-consent-default')).toBeTruthy();
    });

    expect(screen.getByTestId('ga-consent-default').textContent).toContain(
      "analytics_storage: 'granted'"
    );
  });

  test('never grants the three advertising signals', async () => {
    setCountry('US');
    renderGate();

    await waitFor(() => {
      expect(screen.getByTestId('ga-consent-default')).toBeTruthy();
    });

    const content = screen.getByTestId('ga-consent-default').textContent ?? '';
    expect(content).toContain("ad_storage: 'denied'");
    expect(content).toContain("ad_user_data: 'denied'");
    expect(content).toContain("ad_personalization: 'denied'");
  });
});

describe('mainland China', () => {
  test('loads neither vendor', async () => {
    setCountry('CN');
    const { container } = renderGate();

    await waitFor(() => {
      expect(container).toBeTruthy();
    });

    expect(scriptMarkup()).not.toContain('googletagmanager.com');
    expect(scriptMarkup()).not.toContain('clarity.ms');
  });

  test('does not show the consent banner', async () => {
    setCountry('CN');
    renderGate();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});

describe('regions that require consent', () => {
  test('shows the banner when no choice has been recorded', async () => {
    setCountry('DE');
    renderGate();

    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  test('starts Google Analytics with analytics storage denied', async () => {
    setCountry('DE');
    renderGate();

    await waitFor(() => {
      expect(screen.getByTestId('ga-consent-default')).toBeTruthy();
    });

    expect(screen.getByTestId('ga-consent-default').textContent).toContain(
      "analytics_storage: 'denied'"
    );
  });

  test('tells Clarity that consent has not been given', async () => {
    setCountry('DE');
    renderGate();

    await waitFor(() => {
      expect(screen.getByTestId('ms-clarity')).toBeTruthy();
    });

    expect(screen.getByTestId('ms-clarity').textContent).toContain(
      "clarity('consent', false)"
    );
  });

  test('accepting records the choice, notifies both vendors and hides the banner', async () => {
    const gtag = vi.fn();
    const clarity = vi.fn();
    Object.assign(window, { gtag, clarity });

    setCountry('GB');
    renderGate();

    const accept = await screen.findByRole('button', { name: 'Accept' });
    await userEvent.click(accept);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('granted');
    expect(gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'granted' })
    );
    expect(clarity).toHaveBeenCalledWith('consent', true);
  });

  test('declining records the choice and withdraws consent from both vendors', async () => {
    const gtag = vi.fn();
    const clarity = vi.fn();
    Object.assign(window, { gtag, clarity });

    setCountry('FR');
    renderGate();

    const decline = await screen.findByRole('button', { name: 'Decline' });
    await userEvent.click(decline);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('denied');
    expect(gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied' })
    );
    expect(clarity).toHaveBeenCalledWith('consent', false);
  });

  test('does not show the banner again once a choice exists', async () => {
    setCountry('DE');
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: 1, d: 'denied', t: Date.now() })
    );

    renderGate();

    await waitFor(() => {
      expect(screen.getByTestId('ga-consent-default')).toBeTruthy();
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('links to the localised privacy policy', async () => {
    setCountry('DE');
    renderGate();

    const link = await screen.findByRole('link', { name: 'Privacy Policy' });
    expect(link.getAttribute('href')).toBe('/en/privacy');
  });
});

describe('missing configuration', () => {
  test('renders no vendor scripts when both ids are unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', '');
    setCountry('US');

    const { container } = renderGate();

    await waitFor(() => {
      expect(container).toBeTruthy();
    });

    expect(scriptMarkup()).not.toContain('googletagmanager.com');
    expect(scriptMarkup()).not.toContain('clarity.ms');
  });

  test('still asks for consent in a regulated region only when a vendor is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', '');
    setCountry('DE');

    renderGate();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});

describe('unknown country', () => {
  test('loads vendors and does not ask for consent', async () => {
    renderGate();

    await waitFor(() => {
      expect(scriptMarkup()).toContain('googletagmanager.com');
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
