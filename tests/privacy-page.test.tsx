/**
 * 隐私政策页测试
 *
 * 该页面是接入第三方分析的合规前提:同意条要链到它,GSC 和访客也要能读到
 * 我们收集什么、保留多久、交给了谁。这里验证 —— 文案取自 locales JSON
 * (不硬编码)、结构语义正确(单 h1 + 每节一个 h2)、12 个语言都有完整
 * 的键、以及「更改我的选择」入口存在。
 */
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { locales } from '@/i18n';

const enJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'locales', 'en.json'), 'utf-8')
);

interface PrivacySection {
  heading: string;
  paragraphs: ReadonlyArray<string>;
}

const enPrivacy = enJson.privacy as {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: ReadonlyArray<PrivacySection>;
  contactHeading: string;
  contactBody: string;
  choiceHeading: string;
  choiceReset: string;
};

function getPath(obj: Record<string, unknown>, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (cur, part) =>
        cur && typeof cur === 'object'
          ? (cur as Record<string, unknown>)[part]
          : undefined,
      obj
    );
}

vi.mock('next-intl/server', () => ({
  getRequestConfig: (fn: unknown) => fn,
  getTranslations: async ({ namespace }: { namespace?: string } = {}) => {
    const source: Record<string, unknown> =
      namespace === 'metadata.privacy'
        ? (enJson.metadata.privacy as Record<string, unknown>)
        : namespace === 'nav'
          ? (enJson.nav as Record<string, unknown>)
          : (enJson.privacy as Record<string, unknown>);

    const t = (key: string, values?: Record<string, unknown>) => {
      const value = getPath(source, key);

      if (typeof value !== 'string') {
        return key;
      }

      return values
        ? value.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''))
        : value;
    };

    (t as unknown as { raw: (key: string) => unknown }).raw = (key: string) =>
      getPath(source, key);

    return t;
  },
}));

// 客户端孤岛 ConsentResetButton 也读 privacy 文案,用同一份 en.json 供给,
// 这样断言可以直接比对线上文案而不是键名
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => {
    const source = (namespace === 'privacy'
      ? enJson.privacy
      : {}) as Record<string, unknown>;

    const t = (key: string, values?: Record<string, unknown>) => {
      const value = getPath(source, key);

      if (typeof value !== 'string') {
        return key;
      }

      return values
        ? value.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''))
        : value;
    };

    t.raw = (key: string) => getPath(source, key);
    return t;
  },
  useLocale: () => 'en',
}));

import PrivacyPage from '@/app/[locale]/privacy/page';

async function renderPage() {
  const ui = await PrivacyPage({ params: Promise.resolve({ locale: 'en' }) });
  return render(ui);
}

describe('隐私政策页结构', () => {
  it('恰好一个 h1,内容取自 locales JSON', async () => {
    const { container } = await renderPage();
    const headings = container.querySelectorAll('h1');

    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(enPrivacy.title);
  });

  it('每个小节渲染成一个 h2', async () => {
    const { container } = await renderPage();
    const h2 = Array.from(container.querySelectorAll('h2')).map(
      (node) => node.textContent
    );

    for (const section of enPrivacy.sections) {
      expect(h2).toContain(section.heading);
    }

    expect(h2).toContain(enPrivacy.contactHeading);
    expect(h2).toContain(enPrivacy.choiceHeading);
  });

  it('渲染每一段正文', async () => {
    const { container } = await renderPage();
    const text = container.textContent ?? '';

    for (const section of enPrivacy.sections) {
      for (const paragraph of section.paragraphs) {
        expect(text).toContain(paragraph);
      }
    }
  });

  it('披露 IP 只以不可逆形式存储', async () => {
    const { container } = await renderPage();
    expect(container.textContent).toContain('irreversible fingerprint');
  });

  it('给出联系邮箱', async () => {
    const { container } = await renderPage();
    expect(container.textContent).toContain('jay@betterbagsmm.com');
  });

  it('提供更改 cookie 选择的入口', async () => {
    // 该入口是客户端孤岛,挂载后的 effect 里才读到浏览器状态。
    // 受管制地区才显示按钮,这里把 geo_cc 设成德国。
    document.cookie = 'geo_cc=DE; path=/';

    const { container } = await renderPage();

    await waitFor(() => {
      expect(container.textContent).toContain(enPrivacy.choiceReset);
    });

    document.cookie = 'geo_cc=; path=/; max-age=0';
  });

  it('对不受管制地区的访客改为说明没有可撤回的选择', async () => {
    document.cookie = 'geo_cc=US; path=/';

    const { container } = await renderPage();

    await waitFor(() => {
      expect(container.textContent).toContain(
        (enJson.privacy as { choiceUnavailable: string }).choiceUnavailable
      );
    });

    expect(container.textContent).not.toContain(enPrivacy.choiceReset);
    document.cookie = 'geo_cc=; path=/; max-age=0';
  });

  it('输出 BreadcrumbList 结构化数据', async () => {
    const { container } = await renderPage();
    const scripts = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]')
    ).map((node) => JSON.parse(node.textContent ?? '{}'));

    expect(scripts.some((s) => s['@type'] === 'BreadcrumbList')).toBe(true);
  });
});

describe('12 个语言的隐私文案完整性', () => {
  const required = [
    'title',
    'lastUpdated',
    'intro',
    'contactHeading',
    'contactBody',
    'choiceHeading',
    'choiceCurrent',
    'choiceGranted',
    'choiceDenied',
    'choiceUnset',
    'choiceReset',
    'choiceUnavailable',
  ];

  const consentKeys = ['label', 'message', 'accept', 'decline', 'privacyLink'];

  it.each(locales)('%s 的 privacy 命名空间键齐全', (locale) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'locales', `${locale}.json`), 'utf-8')
    );

    expect(json.privacy).toBeDefined();

    for (const key of required) {
      expect(typeof json.privacy[key]).toBe('string');
      expect(json.privacy[key].length).toBeGreaterThan(0);
    }
  });

  it.each(locales)('%s 的 privacy 小节数量与英文一致', (locale) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'locales', `${locale}.json`), 'utf-8')
    );

    expect(json.privacy.sections).toHaveLength(enPrivacy.sections.length);

    json.privacy.sections.forEach((section: PrivacySection, index: number) => {
      expect(typeof section.heading).toBe('string');
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.paragraphs).toHaveLength(
        enPrivacy.sections[index].paragraphs.length
      );
    });
  });

  it.each(locales)('%s 的 consent 命名空间键齐全', (locale) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'locales', `${locale}.json`), 'utf-8')
    );

    expect(json.consent).toBeDefined();

    for (const key of consentKeys) {
      expect(typeof json.consent[key]).toBe('string');
      expect(json.consent[key].length).toBeGreaterThan(0);
    }
  });

  it.each(locales)('%s 的 metadata.privacy 存在且长度合规', (locale) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'locales', `${locale}.json`), 'utf-8')
    );

    expect(json.metadata.privacy).toBeDefined();
    expect(json.metadata.privacy.title.length).toBeGreaterThan(0);
    expect(json.metadata.privacy.title.length).toBeLessThanOrEqual(60);
    expect(json.metadata.privacy.description.length).toBeLessThanOrEqual(150);
  });

  it.each(locales)('%s 的页脚有隐私政策链接文案', (locale) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'locales', `${locale}.json`), 'utf-8')
    );

    expect(typeof json.footer.privacy).toBe('string');
    expect(json.footer.privacy.length).toBeGreaterThan(0);
  });
});
