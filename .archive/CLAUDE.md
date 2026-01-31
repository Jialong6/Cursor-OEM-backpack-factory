# Better Bags Myanmar - Project Guide

Official CLAUDE.md for Better Bags Myanmar OEM backpack factory website project.

## Project Overview

**Better Bags Myanmar** is a Next.js 14+ multilingual website for an OEM backpack factory, featuring:

- Single-page scrolling design with multiple sections (Hero, About, Features, Services, FAQ, Contact, Blog)
- Chinese/English internationalization (next-intl)
- Property-based testing (fast-check) with 178 tests
- Responsive design with Tailwind CSS
- Form handling with React Hook Form + Zod validation
- SEO optimization with structured data (JSON-LD)
- Accessibility (WCAG AA compliance)

**Tech Stack**: Next.js 15.1+, React 19, TypeScript 5, Tailwind CSS 3.4, next-intl, Zod, Vitest, fast-check

## Critical Rules

### 1. Code Organization (MANDATORY)

- **MANY SMALL FILES** over few large files
- High cohesion, low coupling
- **200-400 lines typical, 800 max per file**
- Current files: Contact (250 lines), Blog (338 lines), OptimizedImage (257 lines) - all compliant
- Organize by feature/domain, not by type
- Extract utilities when files exceed 400 lines

### 2. Code Style (ENFORCED)

- **NO emojis** in code, comments, or documentation
- **Immutability always** - NEVER mutate objects or arrays (use spread operator)
- **NO console.log** in production code (hooks will warn)
- Proper error handling with try/catch
- Input validation with Zod schemas
- TypeScript strict mode enabled

```typescript
// ✅ GOOD: Immutable update
const updatedUser = { ...user, name: 'New Name' }
const updatedArray = [...items, newItem]

// ❌ BAD: Mutation
user.name = 'New Name'
items.push(newItem)
```

### 3. Testing (TDD REQUIRED)

- **TDD workflow**: RED (write failing test) → GREEN (implement) → REFACTOR
- **80% minimum coverage** (currently 178 tests passing)
- Property-based tests with fast-check (12 properties defined)
- Unit tests for utilities and components
- Integration tests for forms and validation
- Mock external dependencies properly

**Test Structure**:

```text
tests/
├── properties/          # Property-based tests (fast-check)
│   ├── language-consistency.test.tsx
│   ├── navigation-scroll.test.tsx
│   ├── form-validation.test.tsx
│   └── ...
├── component.test.tsx   # Component unit tests
├── metadata.test.ts     # Metadata/SEO tests
└── semantic-html.test.tsx
```

### 4. Security (NON-NEGOTIABLE)

- **NO hardcoded secrets** (use environment variables)
- Environment variables for sensitive data (Resend API, mCaptcha)
- **Validate all user inputs** with Zod schemas
- CSRF protection enabled in forms
- File upload validation (size, type, malware check)
- Hooks will block commits with exposed secrets

## File Structure

```text
/
├── app/                     # Next.js App Router
│   ├── [locale]/           # Internationalized routes
│   │   ├── page.tsx        # Homepage (all sections)
│   │   ├── blog/           # Blog pages
│   │   └── layout.tsx      # Root layout
│   ├── api/                # API routes
│   │   └── contact/        # Contact form API
│   ├── globals.css         # Global styles
│   └── sitemap.ts          # SEO sitemap
├── components/             # React components
│   ├── layout/             # Layout components (Navbar, Footer)
│   ├── sections/           # Page sections (HeroBanner, Contact, etc.)
│   └── ui/                 # Reusable UI (Accordion, OptimizedImage)
├── lib/                    # Utilities and configurations
│   ├── blog-data.ts        # Blog content data
│   ├── metadata.ts         # SEO metadata generator
│   └── validations.ts      # Zod validation schemas
├── locales/                # i18n translations
│   ├── zh.json             # Chinese translations
│   └── en.json             # English translations
├── public/                 # Static assets
├── tests/                  # Test suites
├── commands/               # Claude Code commands (/tdd, /code-review, etc.)
├── skills/                 # Reusable skills
├── subagents/              # Specialized agents (tdd-guide, code-reviewer)
├── rules/                  # Coding rules and patterns
└── hooks/                  # Git hooks and automation
```

## Key Patterns

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Success
return NextResponse.json({
  success: true,
  data: result
})

// Error
return NextResponse.json({
  success: false,
  error: 'User-friendly message'
}, { status: 400 })
```

### Form Validation Pattern (Zod)

```typescript
import { z } from 'zod'

const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message too short')
})

// Validate in component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(ContactFormSchema)
})
```

### Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Property-Based Testing Pattern

```typescript
import fc from 'fast-check'

test('Property: Any viewport width should keep body font in 14-18px range', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 320, max: 3840 }), // viewport width
      (viewportWidth) => {
        const fontSize = calculateResponsiveFont(viewportWidth)
        expect(fontSize).toBeGreaterThanOrEqual(14)
        expect(fontSize).toBeLessThanOrEqual(18)
      }
    ),
    { numRuns: 100 }
  )
})
```

## Environment Variables

```bash
# Required for Production
RESEND_API_KEY=re_***           # Email service
MCAPTCHA_SECRET=***             # Human verification
MCAPTCHA_SITE_KEY=***

# Optional
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=https://betterbagsmyanmar.com
```

**Note**: Never commit `.env` files. Use `.env.example` as template.

## Available Commands

Commands are defined in `commands/` folder and can be invoked as `/command-name`:

- `/tdd` - Test-driven development workflow (use for ALL new features)
- `/plan` - Create implementation plan before coding
- `/code-review` - Comprehensive code review (security + quality)
- `/build-fix` - Fix build errors
- `/e2e` - Run E2E tests (Playwright)
- `/test-coverage` - Generate coverage report
- `/update-docs` - Update documentation
- `/checkpoint` - Verify all tests pass

## Subagents

Specialized agents in `subagents/` folder for specific tasks:

- **tdd-guide** - TDD specialist (write tests first, RED-GREEN-REFACTOR)
- **code-reviewer** - Security and quality reviewer
- **architect** - System design and architecture
- **build-error-resolver** - Fix compilation and build errors
- **e2e-runner** - Playwright E2E testing specialist

## Skills

Reusable skills in `skills/` folder provide best practices:

- **tdd-workflow** - Test-driven development guidelines
- **coding-standards** - TypeScript/React best practices
- **frontend-patterns** - Common React patterns
- **security-review** - Security checklist

## Git Workflow

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Never commit to main directly
- All commits include Co-Authored-By: Claude
- **All tests must pass** before merge (178 tests minimum)
- Pre-commit hooks check for console.log and TypeScript errors
- Use `/code-review` before committing

## Test Coverage Requirements

- **Minimum 80% coverage** (branch, function, line, statement)
- All new features require tests written FIRST (TDD)
- Property-based tests for critical logic (forms, navigation, responsive design)
- Unit tests for utilities and components
- Integration tests for API endpoints

**Current Status**: 178 tests passing, 2 skipped (documented)

## Performance Standards

- First Load JS < 200 kB (current: 185 kB homepage)
- Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- Images optimized (WebP/AVIF, lazy loading, responsive sizes)
- CSS tree-shaking enabled (Tailwind)
- No blocking scripts (JSON-LD only)

## Accessibility (WCAG AA)

- All colors meet WCAG AA contrast ratio (4.5:1)
- Keyboard navigation fully supported
- Screen reader friendly (ARIA labels, semantic HTML)
- Focus indicators visible
- Form labels properly associated
- Skip navigation link

## Internationalization (i18n)

- Supported languages: Chinese (zh), English (en)
- Translations in `locales/zh.json` and `locales/en.json`
- Use `useTranslations()` hook from next-intl
- All user-facing text must be translatable
- SEO metadata in both languages

## Development Workflow

1. **Before coding**: Run `/plan` to design approach
2. **Write tests first**: Use `/tdd` for TDD workflow
3. **Implement feature**: Follow coding standards
4. **Run tests**: `npm test` (must pass 100%)
5. **Review code**: Use `/code-review` for quality check
6. **Build**: `npm run build` (must succeed)
7. **Commit**: Use conventional commit format

## Important Notes

- **Property tests are critical** - they validate invariants across all inputs
- **Immutability is non-negotiable** - mutations break React optimizations
- **Tests before code** - TDD is the only acceptable workflow
- **No emojis** - keeps code professional and searchable
- **File size limits** - extract utilities when approaching 400 lines
- **Hooks will warn/block** - console.log, TypeScript errors, exposed secrets

## Quick Reference

```bash
# Development
npm run dev              # Start dev server (use tmux)
npm test                 # Run all tests
npm run test:watch       # Watch mode for TDD
npm run test:coverage    # Generate coverage report
npm run build            # Production build
npm run lint             # ESLint check

# Testing Commands
/tdd                     # Start TDD session
/test-coverage           # Check coverage report
/e2e                     # Run Playwright tests

# Code Quality
/code-review             # Review uncommitted changes
/build-fix               # Fix build errors
/checkpoint              # Verify all tests pass
```

**Remember**: Quality is not optional. All code must be tested, readable, and secure before merging.
