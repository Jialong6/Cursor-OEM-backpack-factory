# Project Context: Better Bags Myanmar (One-Page OEM Website)

> **AI INSTRUCTIONS**: This file is the SOURCE OF TRUTH.
>
> 1. **Read before coding**: Always check "Current Status" and "Tech Stack".
> 2. **Update after coding**: Mark tasks as `[x]` and update "Current Project State" when a feature is done.
> 3. **Language**: Maintain documentation and commits in Simplified Chinese (简体中文).

## 1. Project Overview & Architecture

**Goal**: Build a premium, One-Page Scroll OEM factory website for "Better Bags Myanmar".
**Style**: Poster-style, Minimalist, High-end B2B.
**Core Features**: Bilingual (EN/ZH), Smooth Scroll, Contact Form (with file upload), Blog Section.

### Tech Stack (Non-Negotiable)

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS 3.4+ (Mobile First)
- **I18n**: `next-intl` (Routing: `/[locale]/...`)
- **State/Form**: React Hook Form + Zod
- **Testing**: Vitest + `fast-check` (Property-Based Testing is MANDATORY)
- **Services**: Resend/SendGrid (Email), mCaptcha (Security)
- **Deployment**: Vercel

### Design Tokens

- **Brand Colors**:
  - Primary Cyan: `#81C3D7`
  - Primary Blue: `#416788`
  - Secondary Grey: `#5a6d7c`
  - Dark Blue: `#2f6690`
- **Typography**: Fluid sizing using `clamp()` (Body: 14px-18px).

## 2. Directory Structure

```text
/
├── app/[locale]/       # Routes (layout, page, blog)
├── components/
│   ├── layout/         # Navbar, Footer, LanguageSwitcher
│   ├── sections/       # Hero, About, Features, Services, FAQ, Contact, Blog
│   └── ui/             # Reusable atoms (Button, Card, Accordion)
├── lib/                # validations.ts, utils.ts
├── locales/            # en.json, zh.json
└── tests/              # Property-based tests (Vitest)
3. Core Correctness Properties (Must be Verified)
See design.md for full definitions. All features must pass these Property Tests.

Language Consistency: Switching locale updates ALL text instantly.

Persistence: Refreshing page keeps the selected language.

Scroll Position: Switching language does not jump scroll position.

Responsive Nav: Hamburger menu appears < 768px; Links active based on scroll position.

Form Safety: Invalid data implies NO submission; Valid data implies success message.

A11y: All interactive elements must be keyboard accessible and focusable.

4. Current Project State
Phase: 🌑 Initialization Current Focus: Setting up the Next.js scaffold and Tailwind configuration.

Known Constraints & Rules
Git: Commit messages must be in Chinese (e.g., feat: 初始化项目结构).

Tests: No feature is "Done" until the corresponding Property Test is written and passing.

Performance: Images must use next/image with lazy loading.

5. Development Roadmap (Progress Tracking)
Phase 1: Initialization & Infrastructure
[ ] 1.1 Project Setup: Next.js + TS + Tailwind (Config colors & fonts).

[ ] 1.2 I18n Setup: next-intl, locales JSON structure, middleware.

[ ] 1.3 Test Setup: Vitest + fast-check env.

[ ] 1.4 Property Test: Language Persistence (Prop #2).

Phase 2: Layout & Navigation
[ ] 3.1 Navbar: Sticky, scroll spy, smooth scroll.

[ ] 3.2 Mobile Menu: Hamburger animation & logic.

[ ] 3.3 Footer: Quick links & company info.

[ ] 3.4 Language Switcher: Zero-layout-shift switching.

[ ] Test: Hamburger logic (Prop #6), Scroll preservation (Prop #3).

Phase 3: Home Page Sections (Static)
[ ] 5.1 Hero Banner: Fullscreen (100vh), CTA.

[ ] 5.3 About Us: Mission/Values/History.

[ ] 5.4 Features: 4 Core advantages + Customization list.

[ ] 5.5 Services: 6-step process (Responsive layout).

[ ] 5.6 FAQ: Accordion component with Schema.org.

[ ] Test: Accordion interaction (Prop #9).

Phase 4: Contact & Dynamic Features
[ ] 7.1 Form Validation: Zod schema (validations.ts).

[ ] 7.3 Contact UI: Form layout + File upload UI.

[ ] 7.4 API Route: /api/contact handling + Email.

[ ] Test: Form integrity (Prop #10, #11).

Phase 5: Blog & Final Polish
[ ] 9.1 Blog System: List view + Detail view + SEO.

[ ] 10.1 Integration: Final One-Page assembly.

[ ] 12.1 Polish: Fluid fonts, Responsive images, A11y checks.

[ ] 13.1 SEO: Metadata, Sitemap, OpenGraph.
