import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fc from 'fast-check';
import FactoryMapEmbed from '@/components/content/FactoryMapEmbed';
import { FACTORY_INFO } from '@/lib/factory-info';
import { locales } from '@/i18n';

const messages = {
  contact: {
    map: {
      title: 'Map of Better Bags Myanmar factory location',
    },
  },
};

function renderWithLocale(locale: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FactoryMapEmbed />
    </NextIntlClientProvider>
  );
}

describe('FactoryMapEmbed', () => {
  it('renders an interactive map iframe centered on the factory coordinates', () => {
    const { container } = renderWithLocale('en');
    const iframe = container.querySelector('iframe');

    expect(iframe).not.toBeNull();
    const src = iframe!.getAttribute('src')!;
    expect(src).toContain(String(FACTORY_INFO.geo.latitude));
    expect(src).toContain(String(FACTORY_INFO.geo.longitude));
    expect(src).toContain('output=embed');
  });

  it('lazy-loads the iframe and provides an accessible title', () => {
    const { container } = renderWithLocale('en');
    const iframe = container.querySelector('iframe');

    expect(iframe!.getAttribute('loading')).toBe('lazy');
    expect(iframe!.getAttribute('title')).toBe(messages.contact.map.title);
  });

  it('does not render the map for zh (Google Maps is blocked in mainland China)', () => {
    const { container } = renderWithLocale('zh');
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('Property: every locale except zh renders the map with a matching hl parameter', () => {
    fc.assert(
      fc.property(fc.constantFrom(...locales), (locale) => {
        cleanup();
        const { container } = renderWithLocale(locale);
        const iframe = container.querySelector('iframe');

        if (locale === 'zh') {
          expect(iframe).toBeNull();
          return;
        }

        expect(iframe).not.toBeNull();
        const url = new URL(iframe!.getAttribute('src')!);
        const expectedHl = locale === 'zh-tw' ? 'zh-TW' : locale;
        expect(url.searchParams.get('hl')).toBe(expectedHl);
        expect(url.searchParams.get('output')).toBe('embed');
      }),
      { numRuns: 100 }
    );
  });
});
