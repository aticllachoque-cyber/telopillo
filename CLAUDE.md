# Telopillo.bo - Claude Code Instructions

**Project:** Telopillo.bo - Bolivian Online Marketplace
**Version:** MVP Development Phase
**Last Updated:** February 16, 2026

---

## 🎯 Project Overview

Telopillo.bo is a Bolivian marketplace platform that connects buyers and sellers. The key differentiator is **semantic search** that understands Bolivian Spanish, synonyms, typos, and natural language queries.

### Current State
- **Milestone M4.5 Complete**: Account types, business profiles, seller pages, E2E testing
- **Active Development**: Authentication, product listings, semantic search
- **Next Up**: Real-time chat (M5), favorites/ratings (M6)

### Tech Stack
- **Frontend**: Next.js 16.1.6 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL 15 + Auth + Storage + Realtime + Edge Functions)
- **Search**: Hybrid FTS + semantic embeddings (pgvector + Hugging Face API)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)
- **Testing**: Playwright (E2E), accessibility testing with @axe-core/playwright
- **CI/CD**: Husky + lint-staged for pre-commit hooks

---

## 📁 Project Structure

```
telopillo.com/
├── app/                         # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, register, callback)
│   ├── (marketplace)/          # Main marketplace pages
│   ├── api/                    # API routes
│   ├── auth/callback/          # OAuth callback handler
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── perfil/                 # Profile pages
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Header, Footer, UserMenu
│   ├── products/               # Product-related components
│   ├── auth/                   # Auth forms
│   ├── profile/                # Profile components
│   └── providers/              # React context providers
├── lib/
│   ├── supabase/              # Supabase clients (client, server, admin)
│   ├── validations/           # Zod schemas + sanitization
│   ├── utils/                 # Utility functions
│   └── constants.ts           # App constants
├── types/                      # TypeScript type definitions
├── supabase/
│   ├── migrations/            # Database migrations (numbered .sql files)
│   ├── functions/             # Edge Functions (Deno runtime)
│   └── config.toml            # Supabase configuration
├── tests/                      # E2E tests (Playwright)
├── Documentation/
│   ├── milestones/            # Detailed milestone docs
│   └── PRD.md                 # Product Requirements
└── .cursor/                    # Cursor/Claude Code configuration
    ├── agents/                # Custom agent definitions
    └── skills/                # Custom skills
```

---

## 🔐 Authentication & Authorization

### Supabase Auth Setup
- **Methods**: Email/password, Google OAuth, Facebook OAuth (configured in Supabase Dashboard)
- **Session Management**: JWT tokens in httpOnly cookies via `@supabase/ssr`
- **Protected Routes**: `/profile/edit`, `/perfil`, `/publicar`, `/mensajes`
- **Middleware**: `middleware.ts` handles session refresh and route protection

### Supabase Client Creation
```typescript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server-side (Server Components, API Routes)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Admin operations (ONLY when service role is needed)
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

### Row Level Security (RLS)
- **CRITICAL**: Every table with user data MUST have RLS enabled
- All tables have policies enforcing `auth.uid() = user_id` checks
- Storage buckets have path-scoped policies: `{userId}/*`
- Service role (`SUPABASE_SERVICE_ROLE_KEY`) bypasses ALL RLS - use sparingly

---

## 🛡️ Security Requirements

### MUST Follow These Rules

1. **English Code Only**
   - All code, variables, functions, classes, comments, commit messages MUST be in English
   - Spanish allowed ONLY in `Documentation/` or `docs/` folders
   - Use the `english-code-only` skill when writing code

2. **No Debug Routes in Production**
   - `/api/debug-auth` - MUST be removed before deployment
   - `/api/test-*` routes - MUST be removed before deployment
   - Check for `NEXT_PUBLIC_DISABLE_AUTH` - MUST be false in production

3. **Input Validation & Sanitization**
   - ALWAYS use Zod schemas from `lib/validations/` for form validation
   - ALWAYS sanitize HTML with `stripHtml()` from `lib/validations/sanitize.ts`
   - Never trust client-side validation - always validate on server

4. **RLS Policy Checklist**
   - When creating new tables: ENABLE ROW LEVEL SECURITY
   - When creating new tables: CREATE policies for SELECT, INSERT, UPDATE, DELETE
   - Test policies: Can user A access user B's data? (Answer should be NO)
   - Storage policies: Enforce user-scoped paths `{userId}/*`

5. **Service Role Key Usage**
   - ONLY use `createAdminClient()` when absolutely necessary
   - NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client
   - Document why service role is needed in code comments
   - Common valid uses: Edge Functions, background jobs, embedding generation

6. **File Upload Security**
   - Enforce file size limits (5MB max)
   - Validate MIME types: `image/jpeg`, `image/png`, `image/webp`
   - Use user-scoped storage paths: `{userId}/{filename}`
   - Compress images client-side with `browser-image-compression`
   - Check upload logic in `lib/utils/image.ts`

7. **API Route Security**
   - EVERY API route MUST validate authentication unless explicitly public
   - Public routes MUST be documented as public with a comment
   - Sanitize all user inputs
   - Return generic error messages (don't leak sensitive info)

---

## 💻 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Link to Supabase project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Start dev server
npm run dev
```

### Common Commands
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
npm run test:auth        # Run auth E2E tests
npm run test:auth:headed # Run auth tests with UI
```

### Git Workflow
- Husky pre-commit hook runs: ESLint + Prettier + type-check
- Commit messages: Use conventional commits format
- Branch strategy: Feature branches from `main`
- Always test locally before committing

---

## 🗄️ Database Patterns

### Migrations
- **Location**: `supabase/migrations/`
- **Naming**: `YYYYMMDDHHMMSS_description.sql`
- **Always Include**:
  - `ENABLE ROW LEVEL SECURITY` on new tables
  - `CREATE POLICY` statements for all operations
  - Indexes on foreign keys and frequently queried columns
  - Triggers for auto-updating `updated_at` columns

### Common Patterns
```sql
-- Standard table setup
CREATE TABLE my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- User-scoped read policy
CREATE POLICY "Users can view own records"
ON my_table FOR SELECT
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### Existing Tables
- `profiles`: User profiles (1:1 with auth.users)
- `business_profiles`: Business account info (optional, 1:1 with profiles)
- `products`: Product listings (many:1 with profiles)
- `app_config`: Global app configuration (singleton table)

---

## 🔍 Search Implementation

### Hybrid Search (Keyword + Semantic)
- **Keyword Search**: PostgreSQL Full-Text Search with `to_tsvector` and `plainto_tsquery`
- **Semantic Search**: pgvector + embeddings via Hugging Face API
- **Ranking**: Reciprocal Rank Fusion (RRF) combines both scores

### Search Flow
1. User enters query in search bar
2. Frontend calls `/api/search?q=query`
3. API route generates embedding via Edge Function `generate-embedding`
4. Database function `rrf_hybrid_search` runs both searches and merges results
5. Results returned with relevance scores

### Edge Function: generate-embedding
- **Location**: `supabase/functions/generate-embedding/index.ts`
- **Model**: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **API**: Hugging Face Inference API (free tier: 30K requests/month)
- **CORS**: Currently set to `*` - should be restricted to production domain

---

## 🎨 UI/UX Patterns

### Component Guidelines
- Use shadcn/ui components from `components/ui/`
- Follow Tailwind CSS v4 conventions
- Maintain accessibility (WCAG 2.2 AA compliance)
- Use semantic HTML elements
- Test with keyboard navigation and screen readers

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Test on: mobile (375px), tablet (768px), desktop (1440px)

### Colors & Branding
- Primary colors defined in Tailwind config
- Bolivian cultural elements in design language
- Accessible color contrasts (4.5:1 minimum for text)

### Loading States
- Use skeleton loaders for content
- Show loading spinners for actions
- Provide user feedback for async operations

---

## 🧪 Testing Strategy

### E2E Testing (Playwright)
- **Location**: `tests/`
- **Run**: `npm run test:auth` or `npm run test:auth:headed`
- **Coverage**: Auth flows, profile management, product CRUD, search

### Accessibility Testing
- Automated checks with `@axe-core/playwright`
- Manual testing with keyboard navigation
- Screen reader compatibility (NVDA, JAWS)

### Test Structure
```typescript
test('feature description', async ({ page }) => {
  // 1. Setup
  await page.goto('/page')

  // 2. Action
  await page.fill('input[name="field"]', 'value')
  await page.click('button[type="submit"]')

  // 3. Assert
  await expect(page.locator('.success')).toBeVisible()
})
```

---

## 🚀 Deployment

### Environment Variables
```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only

# Optional (set to actual values in production)
NEXT_PUBLIC_APP_URL=https://telopillo.bo
NEXT_PUBLIC_DISABLE_AUTH=false  # MUST be false in production

# Edge Functions
HUGGINGFACE_API_KEY=            # For generate-embedding function
```

### Deployment Checklist
- [ ] Remove debug/test API routes
- [ ] Set `NEXT_PUBLIC_DISABLE_AUTH=false`
- [ ] Configure security headers in `next.config.ts`
- [ ] Set up custom domain in Vercel
- [ ] Configure OAuth redirect URLs in Supabase
- [ ] Deploy Edge Functions: `npx supabase functions deploy`
- [ ] Run database migrations: `npx supabase db push`
- [ ] Test production build locally: `npm run build && npm start`

---

## 📋 Common Tasks

### Adding a New Feature
1. Check relevant milestone doc in `Documentation/milestones/`
2. Read existing code patterns in similar features
3. Create database migration if needed (with RLS policies)
4. Implement backend logic (API routes, Edge Functions)
5. Create Zod validation schemas in `lib/validations/`
6. Build UI components
7. Add E2E tests
8. Update documentation

### Adding a New Table
1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_table_name.sql`
2. Include:
   - Table definition with proper types
   - Foreign keys with ON DELETE CASCADE
   - Indexes on frequently queried columns
   - `ENABLE ROW LEVEL SECURITY`
   - CREATE POLICY statements (SELECT, INSERT, UPDATE, DELETE)
   - Triggers (e.g., `updated_at`)
3. Test locally: `npx supabase db reset` (resets and re-runs all migrations)
4. Push to remote: `npx supabase db push`

### Adding a New API Route
1. Create file in `app/api/route-name/route.ts`
2. Implement with proper auth check:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

### Adding a New UI Component
1. Create component in appropriate folder: `components/feature/ComponentName.tsx`
2. Use TypeScript with proper types
3. Follow shadcn/ui patterns for consistency
4. Include accessibility attributes (aria-label, role, etc.)
5. Add loading and error states
6. Export from index file if creating component library

---

## 🎯 Best Practices

### TypeScript
- Use strict mode (already configured)
- Define types for all props and function parameters
- Use type inference where clear
- Create reusable types in `types/` folder
- Avoid `any` - use `unknown` if necessary

### React Patterns
- Prefer Server Components (default in App Router)
- Use Client Components only when needed: `'use client'`
- Client Component triggers: hooks, event handlers, browser APIs, Context
- Separate business logic from UI components
- Use React Hooks for side effects

### Error Handling
- Always handle errors from async operations
- Show user-friendly error messages
- Log errors for debugging (without sensitive data)
- Provide recovery options when possible

### Performance
- Use Next.js Image component for images
- Implement lazy loading for heavy components
- Optimize database queries (use indexes, limit results)
- Cache static data when possible
- Compress and optimize images

---

## 🌍 Bolivian Context

### Language
- UI: Spanish (Bolivian dialect)
- Code: English (strictly enforced)
- Search: Understands Bolivian synonyms (e.g., "chompa" = "sudadera")

### Location
- Departments: La Paz, Santa Cruz, Cochabamba, Oruro, Potosí, Tarija, Chuquisaca, Beni, Pando
- Cities: Use official names, allow user input

### Currency
- Bolivianos (BOB, Bs.)
- Format: Bs. 1.234,56 (period for thousands, comma for decimals)

### Phone Numbers
- Format: +591 X XXXX XXXX (X = area code)
- WhatsApp integration common

### Business
- NIT: Bolivian tax ID (treat as sensitive PII)
- Business accounts have separate profiles

---

## 🚨 Critical Reminders

1. **NEVER bypass RLS without explicit justification**
   - Service role = ALL access, use only when needed
   - Document why service role is required

2. **ALWAYS validate and sanitize user input**
   - Zod schemas for structure
   - `stripHtml()` for text content
   - Never trust client-side validation

3. **ALWAYS write code in English**
   - Variables, functions, comments, commit messages
   - Use `/english-code-only` skill

4. **ALWAYS test authentication flows**
   - Run E2E tests before committing auth changes
   - Test both authenticated and unauthenticated states

5. **NEVER commit secrets or API keys**
   - Use `.env.local` for local development
   - Use Vercel environment variables for production

6. **ALWAYS enable RLS on new tables**
   - No exceptions
   - Create policies immediately after table creation

---

## 📚 Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Playwright Testing](https://playwright.dev/)

---

## 🤝 Working with Claude Code

### Proactive Agent Usage
Claude Code has specialized agents that should be used proactively:

- **security-engineer**: Use for RLS policies, auth changes, API routes, file uploads
- **accessibility-expert**: Use for UI components, forms, navigation
- **software-architect**: Use for architectural decisions, database schema, API design
- **ux-designer**: Use for user flows, interface design, usability
- **project-manager**: Use for feature planning, sprint planning, roadmap

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(auth): add Google OAuth login
fix(search): resolve semantic search ranking issue
refactor(api): simplify product listing endpoint
docs(readme): update installation instructions
test(profile): add E2E tests for avatar upload
```

Co-author commits with:
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 📝 Notes

- This is an active MVP development project
- Target: 1,000 users in first 3 months
- Focus: Marketplace core features + semantic search
- Cost target: $0/month during MVP phase
- Launch target: Q2 2026

---

**Last updated**: February 16, 2026
**Maintained by**: Alcides Cardenas
**Questions?** Check Documentation/milestones/ or create an issue
