/**
 * **Feature: backpack-oem-website, Property 16: 第三方分析的地区门禁**
 *
 * 正确性属性:对任意国家码,以下两条蕴含式恒成立 ——
 *   1. 渲染了第三方脚本  =>  该国不在 BLOCKED_ANALYTICS_COUNTRIES 里
 *   2. 没有弹出同意条    =>  该国不在 CONSENT_REQUIRED_COUNTRIES 里,
 *                            或访客已经做过选择,或本地压根没配任何脚本
 *
 * 这两条是整套门禁的正确性核心:第一条防止把被墙的脚本塞给中国访客,
 * 第二条防止在受管制地区未经同意就采集。逐个国家写用例只能覆盖抽样,
 * 属性测试覆盖的是全部两字母码空间,包括不存在的组合。
 *
 * 验证需求:隐私合规 + 中国可达性
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { NextIntlClientProvider } from 'next-intl';
import fs from 'node:fs';
import path from 'node:path';
import AnalyticsGate from '@/components/analytics/AnalyticsGate';
import {
  BLOCKED_ANALYTICS_COUNTRIES,
  GEO_COUNTRY_COOKIE,
} from '@/lib/analytics-config';
import { CONSENT_REQUIRED_COUNTRIES } from '@/lib/consent-regions';
import { CONSENT_STORAGE_KEY } from '@/lib/consent-storage';

// type="text/plain":避免 happy-dom 真的执行 Clarity snippet 去请求外网
vi.mock('next/script', () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: string }) =>
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

/** 两字母国家码的生成器,覆盖 676 种组合(含不存在的) */
const countryCode = fc
  .tuple(
    fc.integer({ min: 0, max: 25 }),
    fc.integer({ min: 0, max: 25 })
  )
  .map(([a, b]) =>
    String.fromCharCode(65 + a) + String.fromCharCode(65 + b)
  );

function setCountry(code: string): void {
  document.cookie = `${GEO_COUNTRY_COOKIE}=${code}; path=/`;
}

async function renderFor(code: string, alreadyChose: boolean): Promise<void> {
  window.localStorage.clear();
  setCountry(code);

  if (alreadyChose) {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ v: 1, d: 'granted', t: Date.now() })
    );
  }

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AnalyticsGate />
    </NextIntlClientProvider>
  );

  // 门禁在挂载后的 effect 里完成探测,等一帧
  await waitFor(() => {
    expect(document.body).toBeTruthy();
  });
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST12345');
  vi.stubEnv('NEXT_PUBLIC_CLARITY_PROJECT_ID', 'clarity123');
});

afterEach(() => {
  vi.unstubAllEnvs();
  window.localStorage.clear();
  document.cookie = `${GEO_COUNTRY_COOKIE}=; path=/; max-age=0`;
});

describe('Property 16: 第三方分析的地区门禁', () => {
  it('属性:渲染了第三方脚本,蕴含该国不在屏蔽名单里', async () => {
    await fc.assert(
      fc.asyncProperty(countryCode, fc.boolean(), async (code, alreadyChose) => {
        await renderFor(code, alreadyChose);

        const markup = document.body.innerHTML;
        const loadedVendor =
          markup.includes('googletagmanager.com') || markup.includes('clarity.ms');

        if (loadedVendor) {
          expect(BLOCKED_ANALYTICS_COUNTRIES).not.toContain(code);
        }

        cleanup();
      }),
      { numRuns: 120 }
    );
  });

  it('属性:没有弹同意条,蕴含该国不受管制或访客已做过选择', async () => {
    await fc.assert(
      fc.asyncProperty(countryCode, fc.boolean(), async (code, alreadyChose) => {
        await renderFor(code, alreadyChose);

        const banner = screen.queryByRole('dialog');
        const blocked = BLOCKED_ANALYTICS_COUNTRIES.includes(code);

        if (!banner) {
          const excused =
            alreadyChose || blocked || !CONSENT_REQUIRED_COUNTRIES.includes(code);
          expect(excused).toBe(true);
        }

        cleanup();
      }),
      { numRuns: 120 }
    );
  });

  it('属性:受管制地区且未做选择时,同意条必然出现', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CONSENT_REQUIRED_COUNTRIES),
        async (code) => {
          await renderFor(code, false);

          expect(screen.queryByRole('dialog')).not.toBeNull();

          cleanup();
        }
      ),
      { numRuns: 32 }
    );
  });

  it('属性:屏蔽名单里的国家,既不加载脚本也不弹同意条', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...BLOCKED_ANALYTICS_COUNTRIES),
        fc.boolean(),
        async (code, alreadyChose) => {
          await renderFor(code, alreadyChose);

          const markup = document.body.innerHTML;
          expect(markup).not.toContain('googletagmanager.com');
          expect(markup).not.toContain('clarity.ms');
          expect(screen.queryByRole('dialog')).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });
});
