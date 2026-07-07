# Better Bags Myanmar — Official Website

The official website of [Better Bags Myanmar](https://betterbagsmm.com), a premium
[OEM/ODM custom backpack manufacturer in Yangon, Myanmar](https://betterbagsmm.com/en).
Built with Next.js 15 and fully localized into **12 languages**, including Burmese.

**Live site:** [betterbagsmm.com](https://betterbagsmm.com)

## About Better Bags Myanmar

[Better Bags Myanmar](https://betterbagsmm.com/en) has manufactured custom backpacks,
travel bags, shoulder bags, and tote bags since 2003. With 600+ professional employees
at its Yangon factory and 15+ years of long-term partnerships with leading Japanese
brands such as Anello, the factory delivers Japanese-grade quality control — including
a strict [broken-needle control system](https://betterbagsmm.com/en/blog/danshin-needle-control-myanmar)
with 100% X-ray inspection and
[third-party inspection with I-pack](https://betterbagsmm.com/en/blog/ipack-third-party-inspection-myanmar) —
at Myanmar production costs.

Curious what the factory floor actually looks like? Take the
[virtual factory tour](https://betterbagsmm.com/en/blog/factory-tour-one-day-myanmar),
or browse the [backpack manufacturing glossary](https://betterbagsmm.com/en/glossary)
covering OEM/ODM, MOQ, AQL, and other sourcing terms.

## 12 Language Versions

Every page — UI, SEO metadata, forms, and long-form blog articles — is professionally
localized per market, not machine-translated word by word.

| Language | Live URL |
| --- | --- |
| English | [betterbagsmm.com/en](https://betterbagsmm.com/en) |
| 中文（简体） | [betterbagsmm.com/zh](https://betterbagsmm.com/zh) |
| 日本語 | [betterbagsmm.com/ja](https://betterbagsmm.com/ja) |
| 中文（繁體・台灣） | [betterbagsmm.com/zh-tw](https://betterbagsmm.com/zh-tw) |
| 한국어 | [betterbagsmm.com/ko](https://betterbagsmm.com/ko) |
| မြန်မာ (Burmese) | [betterbagsmm.com/my](https://betterbagsmm.com/my) |
| Deutsch | [betterbagsmm.com/de](https://betterbagsmm.com/de) |
| Français | [betterbagsmm.com/fr](https://betterbagsmm.com/fr) |
| Español | [betterbagsmm.com/es](https://betterbagsmm.com/es) |
| Português | [betterbagsmm.com/pt](https://betterbagsmm.com/pt) |
| Nederlands | [betterbagsmm.com/nl](https://betterbagsmm.com/nl) |
| Русский | [betterbagsmm.com/ru](https://betterbagsmm.com/ru) |

## Engineering Highlights

- **12-locale i18n architecture** (next-intl): locale-prefixed routing, Geo-IP +
  Accept-Language detection with cookie persistence, canonical hreflang
  (`zh-Hans` / `zh-Hant` / `x-default`) across pages and sitemap
- **AI-assisted translation pipeline** (`scripts/translate/`): terminology sheets and
  per-market briefs drive translation; every locale passes structure validation,
  native-reviewer cross-checks, and back-translation drift audits
  (reports in `docs/i18n/reports/`)
- **Per-language blog code splitting**: article bodies live in
  `content.{locale}.ts` modules loaded server-side via dynamic import — 12 languages
  of long-form content without bloating the client bundle
- **Per-locale font loading**: Noto Sans SC/TC/JP/KR/Myanmar loaded only for the
  matching locale, with Myanmar-script line-height corrections
- **Property-based testing** (fast-check): 1,000+ tests guard translation-file
  structure, ICU placeholders, hreflang completeness, and locale routing
- **72 statically generated pages** (12 locales × homepage, blog, 3 articles, glossary)

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript 5 (strict)
- **Styling**: Tailwind CSS 3.4
- **i18n**: next-intl (12 locales)
- **Forms**: React Hook Form + Zod, Cloudflare Turnstile, direct-to-R2 uploads
- **Email**: Resend (localized acknowledgment emails)
- **Testing**: Vitest + fast-check (property-based), Testing Library
- **Deployment**: Vercel + Cloudflare DNS

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/en` (or any locale prefix: `/zh`, `/ja`, `/my`, ...).

### Tests and Build

```bash
npm test              # full suite (1,000+ tests)
npm run test:coverage # coverage report
npm run build         # production build (72 SSG pages)
```

## Project Structure

```text
app/[locale]/        # localized routes (home, blog, glossary)
components/          # sections, layout, UI, SEO (JSON-LD)
lib/                 # blog data (per-language content), validations, i18n utils
locales/             # 12 translation files (structure-validated against en.json)
scripts/translate/   # translation / back-translation / review toolchain
docs/i18n/           # terminology sheet, market briefs, audit reports
tests/               # unit + property-based tests
```

## Documentation

- [Requirements](./requirements.md)
- [Design](./design.md)
- [Task list](./tasks.md)
- [Claude Code project guide](./CLAUDE.md)

## About

Maintained by [Better Bags Myanmar](https://betterbagsmm.com) — custom backpack
manufacturing partner for brands worldwide. For OEM/ODM inquiries, visit the
[contact page](https://betterbagsmm.com/en#contact) or email `jay@betterbagsmm.com`.
