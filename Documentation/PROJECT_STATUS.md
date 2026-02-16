# Telopillo.bo - Project Status

**Last Updated:** February 16, 2026  
**Project Start:** February 12, 2026

---

## Overall Progress

```
M0:   Foundation & Setup          ████████████████████ 100% ✅
M1:   Authentication & Profiles   ███████████████████░  93% ✅ (Code Complete)
M2:   Product Listings            ████████████████████ 100% ✅
M3:   Search & Discovery          ████████████████████ 100% ✅
M4:   Semantic Search             ████████████████████ 100% ✅
M4.5: Account Types & Minimal KYC ████████████████████ 100% ✅
E2E:  Test Infrastructure         ████████████████████ 100% ✅
M4.7: Demand-Side "Busco"          ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (NEXT)
M5:   Chat & Messaging            ░░░░░░░░░░░░░░░░░░░░   0% ⏳
M6:   Ratings & Reviews           ░░░░░░░░░░░░░░░░░░░░   0% ⏳
M7:   Admin Dashboard             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
M8:   Payments & Orders           ░░░░░░░░░░░░░░░░░░░░   0% ⏳

Overall Project: ████████████░░░░░░░░ 60%
```

---

## Completed Milestones

### ✅ M0: Foundation & Setup (COMPLETE)

**Status:** 100% Complete  
**Duration:** ~7.5 hours (estimated 5-7 days)  
**Completed:** February 12, 2026

**Achievements:**
- Next.js 14 with TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase integration (client, server, middleware)
- Development tools (ESLint, Prettier, Husky, lint-staged)
- Base layout with responsive Header and Footer
- Landing page with search-first hero
- Accessibility (WCAG 2.2 AA compliant)
- Mobile UX (slide-in drawer menu, accordion footer)

**Documentation:** [M0 README](../milestones/M0-foundation-setup/README.md)

---

### ✅ M1: Authentication & User Profiles (CODE COMPLETE)

**Status:** 93% Complete (All code done, manual OAuth testing pending)  
**Started:** February 13, 2026  
**Completed:** February 13, 2026 (Code)  
**Actual Duration:** ~14 hours

**Phases (7/7 complete):**
1. Database Setup - `profiles` table, RLS, triggers, `avatars` storage bucket
2. OAuth Configuration - Google & Facebook OAuth
3. Authentication Pages - Login, Register, Forgot/Reset Password (Zod + react-hook-form)
4. Profile Management - Profile Edit/View, LocationSelector (Bolivia departments/cities)
5. Avatar Upload - Upload to Supabase Storage, compression, validation
6. Protected Routes - Middleware, UserMenu, auth bypass for dev
7. Testing & Polish - 45/45 automated tests passed, manual OAuth pending

**Key Deliverables:**
- 6 database migrations (profiles, avatars)
- Authentication pages (login, register, forgot-password, reset-password)
- Profile management (edit, view)
- Protected route middleware
- 45 automated test cases passed

**Documentation:** [M1 README](../milestones/M1-authentication-profiles/README.md)

---

### ✅ M2: Product Listings (COMPLETE)

**Status:** 100% Complete  
**Started:** February 13, 2026  
**Completed:** February 14, 2026  
**Actual Duration:** ~12 hours

**Phases (7/7 complete):**
1. Database Schema - `products` table, 7 indexes, 4 RLS policies, `product-images` storage
2. Image Upload - Multi-image drag-and-drop, WebP compression, Supabase Storage integration
3. Product Creation Form - `/publicar` page, 8 categories with subcategories, Zod validation
4. Product Detail Page - `/productos/[id]`, image gallery, SellerCard, WhatsApp contact, SEO metadata
5. Product Listing Page - `/perfil/mis-productos`, status filters, sort options, quick actions
6. Product Management - Edit page, Mark as Sold/Inactive, Delete with confirmation, AlertDialog
7. Testing & Polish - UX/Accessibility review, 28 test cases, axe-core audit (0 violations)

**Key Deliverables:**
- Products database schema with full-text search support
- ImageUpload component (drag-and-drop, reorder, WebP compression)
- ProductForm (create + edit modes)
- ProductGallery with navigation
- SellerCard with WhatsApp integration
- ProductCard, ProductGrid, ProductActions components
- ShareButton, ToastProvider for accessible notifications
- 28 automated test cases, 0 axe-core violations

**Documentation:** [M2 PROGRESS](../milestones/M2-product-listings/PROGRESS.md)

---

### ✅ M3: Search & Discovery - Keyword (COMPLETE)

**Status:** 100% Complete  
**Started:** February 14, 2026  
**Completed:** February 14, 2026  
**Actual Duration:** ~2 hours 10 minutes

**Phases (7/7 complete):**
1. Database Schema (FTS) - `search_vector` TSVECTOR column, GIN index, `search_products` RPC
2. Search API - `/api/search` route with filters, sort, pagination
3. Search Bar Component - Integrated into Header (desktop + mobile), URL sync
4. Search Results Page - `/buscar` with loading/error/empty states
5. Filters & Sort - Category, condition, department, price range, relevance/price/date sort
6. Category Browsing - `/categorias` page with 9 categories and icons
7. Empty States & Testing - All empty states, 8 test cases passed

**Key Deliverables:**
- PostgreSQL Full-Text Search with Spanish config and weighted ranking
- `search_products()` RPC function with all filters
- SearchBar, SearchFilters, SearchSort components
- `/buscar` search results page with responsive filters
- `/categorias` category browsing page

**Documentation:** [M3 PROGRESS](../milestones/M3-search-keyword/PROGRESS.md)

---

### ✅ M4: Semantic Search - Embeddings (COMPLETE)

**Status:** 100% Complete  
**Started:** February 14, 2026  
**Completed:** February 14, 2026  
**Actual Duration:** ~6 hours

**Phases (9/9 complete):**
1. Database (pgvector) - `embedding vector(384)` column, HNSW index
2. Feature Flag System - `app_config` table, env var + DB toggle
3. Edge Function (HF) - `generate-embedding` with Hugging Face API, retry logic
4. Hybrid Search RPC (RRF) - `search_products_semantic()` with adaptive RRF weights (k=60)
5. API Route + Fallback - Hybrid search with transparent fallback to keyword-only
6. Auto-embed + Backfill - PostgreSQL trigger via `pg_net`, backfill script
7. Performance Optimizations - In-memory embedding cache (5min TTL, 2.8x speedup)
8. Search Quality Tuning - Title boost, adaptive RRF, 10/10 ranking accuracy
9. E2E Testing - 5 Playwright tests, all passing

**Key Deliverables:**
- pgvector extension with HNSW cosine index
- `generate-embedding` Supabase Edge Function (Deno)
- Hybrid search: keyword FTS top 50 + semantic top 50, merged via RRF
- Feature flag system (env var priority over DB)
- Auto-embedding trigger on product insert/update
- Embedding cache (340ms cached vs 940ms uncached)
- 10/10 search quality on test suite (Spanish + English queries)

**Documentation:** [M4 PROGRESS](../milestones/M4-search-semantic/PROGRESS.md)

---

### ✅ M4.5: Account Types & Minimal KYC (COMPLETE)

**Status:** 100% Complete  
**Started:** February 15, 2026  
**Completed:** February 15, 2026  
**Actual Duration:** ~10 hours

**Architecture:** "Business as Add-on" model - all users have a base personal profile, business profile is an optional, non-mutually-exclusive extension.

**Phases (9/9 complete):**
1. Database Schema & Types - `business_profiles` table, `verification_level`, `phone_verified` on profiles
2. Registration Flow - Single-step form with optional collapsible business section
3. Profile Edit & Trust Badge - VerificationBadge component, business profile management
4. Business Storefront Page - `/negocio/[slug]` with SEO, JSON-LD, breadcrumbs
5. Personal Seller Profile - `/vendedor/[id]` with SEO, JSON-LD, cross-navigation
6. Search & Product Integration (6a + 6b) - Seller info in search RPC, SellerCard updates
7. Testing & Polish - UX/Accessibility audit, 42 E2E tests (28 functional + 7 a11y + 7 mobile)

**Key Architectural Decisions:**
- Business profile = add-on (not mutually exclusive with personal)
- `business_profiles` row existence is source of truth (not `account_type` enum)
- Minimal KYC: email (Level 0), phone (Level 1), descriptive badges (no gating)
- Strong KYC deferred to future milestone

**Key Deliverables:**
- `business_profiles` table with RLS, `business-logos` storage bucket
- VerificationBadge with accessible tooltip (keyboard + hover)
- Business storefront (`/negocio/[slug]`) with BusinessHeader, BusinessInfoSidebar
- Personal seller profile (`/vendedor/[id]`) with SellerProfileHeader
- BusinessProfileForm with BusinessHoursEditor, logo upload
- Updated search RPCs with seller info (full_name, avatar, business_name)
- Cross-navigation between business storefront and personal profile
- 42 Playwright tests: 0 failures, 0 WCAG 2.2 AA violations
- i18n: Spanish user-facing strings, English code/documentation

**Documentation:** [M4.5 PROGRESS](../milestones/M4.5-account-types-kyc/PROGRESS.md) | [M4.5 PRD](../milestones/M4.5-account-types-kyc/PRD.md)

---

### ✅ E2E Test Infrastructure (COMPLETE)

**Status:** 100% Complete  
**Started:** February 15, 2026  
**Completed:** February 16, 2026  
**Actual Duration:** ~4 hours

**Architecture:** Organized E2E test suite by business flows, with structured plans consumable by automation agents.

**What was built:**
1. **E2E Test Planner subagent** — Custom Cursor subagent (`.cursor/agents/e2e-test-planner.md`) that produces structured test plans for other agents to automate
2. **Folder structure** — 7 test domains organized by complete business flows
3. **29 spec files** — 229 test cases covering all implemented routes and flows
4. **Test plans** — Machine-readable PLAN.md per folder with step-by-step selectors, assertions, and error scenarios
5. **Shared fixture/helper designs** — Plans for reusable auth, test data, and a11y helpers (implementation pending)

**Test Suite Structure:**

| Folder | Files | Tests | Coverage |
|--------|-------|-------|----------|
| `auth/` | 3 | 39 | Registration, login, password recovery, redirects |
| `buyer-journey/` | 5 | 44 | Homepage → search → product → seller → contact |
| `seller-journey/` | 4 | 28 | Create → manage → edit → sell/delete products |
| `business-seller/` | 3 | 16 | Business registration, storefront, complete flow |
| `search-discovery/` | 5 | 35 | Keyword, semantic, filters, categories, API |
| `account-management/` | 4 | 31 | Profile view/edit, avatar, product management |
| `cross-cutting/` | 5 | 48 | Accessibility, mobile, navigation, SEO, errors |
| **Total** | **29** | **229** | **All implemented routes covered** |

**Known Issues Found:**
- Product detail page has ~12px horizontal overflow at 375px viewport (responsive bug)
- Business storefront WhatsApp button is 40px height vs 44px WCAG touch target recommendation

**Legacy Tests:** 11 older spec files remain in `tests/` root from M1–M4.5 (pre-reorganization).

---

## Pending Milestones

### ⏳ M4.7: Demand-Side Posting — "Busco/Necesito" (NEXT)

**Status:** 0% Complete  
**Estimated Duration:** 12-16 days  
**Dependencies:** M1 (Auth) ✅, M2 (Products) ✅, M3 (Search) ✅, M4 (Semantic Search) ✅

**Planned Features:**
- Buyers post what they need ("Busco" posts)
- Sellers browse/search demand posts by category and location
- Sellers offer their products to demand posts
- WhatsApp contact between buyer and seller
- Post expiration (30 days) with renewal
- Semantic search on demand posts (reuse embeddings)
- "¿No encontraste?" CTA on search results

**Documentation:** [M4.7 README](../milestones/M4.7-demand-side-busco/README.md)

---

### ⏳ M5: Chat & Messaging

**Status:** 0% Complete  
**Estimated Duration:** 10-12 days  
**Dependencies:** M1 (Auth) ✅, M2 (Products) ✅

**Planned Features:**
- Real-time chat (Supabase Realtime WebSocket)
- Conversation list with unread counts
- Chat interface with message bubbles
- Typing indicators and presence
- Push notifications (future)
- Read receipts

---

### ⏳ M6: Ratings & Reviews

**Status:** 0% Complete  
**Estimated Duration:** 7-10 days  
**Dependencies:** M1 (Auth) ✅, M2 (Products) ✅

**Planned Features:**
- 1-5 star ratings with comments
- Seller reputation system
- Auto-update rating_average/rating_count on profiles
- Review moderation
- Display on seller profiles and product pages

---

### ⏳ M7: Admin Dashboard

**Status:** 0% Complete  
**Estimated Duration:** 10-14 days  
**Dependencies:** All previous milestones

**Planned Features:**
- Admin panel for content moderation
- User management
- Product moderation (approve, flag, remove)
- Reports system
- Analytics dashboard

---

### ⏳ M8: Payments & Orders

**Status:** 0% Complete  
**Estimated Duration:** 14-21 days  
**Dependencies:** M5 (Chat) ✅, M6 (Ratings) ✅

**Planned Features:**
- Payment gateway integration
- Order tracking
- Transaction history
- Escrow system (future)
- Premium seller features

---

## Project Metrics

### Time Tracking

| Milestone | Estimated | Actual | Status |
|-----------|-----------|--------|--------|
| M0: Foundation & Setup | 5-7 days | ~7.5 hours | ✅ Complete |
| M1: Authentication & Profiles | 10 days | ~14 hours | ✅ Code Complete |
| M2: Product Listings | 10-12 days | ~12 hours | ✅ Complete |
| M3: Search & Discovery (Keyword) | 10-12 days | ~2.1 hours | ✅ Complete |
| M4: Semantic Search (Embeddings) | 7-10 days | ~6 hours | ✅ Complete |
| M4.5: Account Types & KYC | 5-7 days | ~10 hours | ✅ Complete |
| E2E: Test Infrastructure | 2-3 days | ~4 hours | ✅ Complete |
| **Total** | **~60 days** | **~55.6 hours** | **60% complete** |

### Code Statistics

- **Source files (TS/TSX):** 77
- **Database migrations (SQL):** 12
- **Test spec files:** 40 (29 organized in `tests/e2e/` + 11 legacy in `tests/`)
- **Total lines of source code:** ~11,700+
- **Documentation pages:** 49+
- **AI subagents:** 9 (`.cursor/agents/`)

### Quality Metrics

- **TypeScript errors:** 0 ✅
- **ESLint errors:** 0 ✅
- **Prettier issues:** 0 ✅
- **WCAG 2.2 AA:** Compliant ✅
- **Playwright E2E tests:** 229 test cases across 29 spec files (organized by business flow)
- **Legacy E2E tests:** 75+ test cases across 11 spec files (pre-reorganization)

### Database Tables

| Table | Milestone | Purpose |
|-------|-----------|---------|
| `profiles` | M1 | User profiles (extends auth.users) |
| `products` | M2 | Product listings with FTS + embeddings |
| `business_profiles` | M4.5 | Business profile add-on |
| `app_config` | M4 | Feature flags and configuration |

### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Private | User profile avatars |
| `product-images` | Public | Product listing images |
| `business-logos` | Public | Business profile logos |

### Supabase Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-embedding` | Auto-generate product embeddings via Hugging Face API |

### Key Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing page with search hero |
| `/login` | Public | Login page (email + OAuth) |
| `/register` | Public | Registration with optional business |
| `/buscar` | Public | Search results with filters |
| `/categorias` | Public | Category browsing |
| `/productos/[id]` | Public | Product detail page |
| `/negocio/[slug]` | Public | Business storefront page |
| `/vendedor/[id]` | Public | Personal seller profile |
| `/publicar` | Protected | Create new product listing |
| `/productos/[id]/editar` | Protected | Edit product listing |
| `/profile/edit` | Protected | Edit user profile |
| `/perfil/mis-productos` | Protected | My products management |
| `/api/search` | API | Search endpoint (keyword + semantic) |

---

## Next Actions

### Immediate

1. **Fix known UI issues** found by E2E tests:
   - Product detail horizontal overflow at 375px (~12px)
   - Business storefront WhatsApp button touch target (40px vs 44px WCAG)
2. **Decide next milestone priority:**
   - M5 (Chat & Messaging) — enables buyer-seller communication
   - M6 (Ratings & Reviews) — builds trust, leverages seller profiles
3. **Consider PRD for next milestone** — Analyze with PM agent before implementation

### Short-term

1. Implement shared fixtures and helpers (`tests/fixtures/`, `tests/helpers/`) to reduce test duplication
2. Decide on legacy test files in `tests/` root (keep, migrate, or remove)
3. Complete next milestone (M5 or M6)
4. Consider git commit strategy for all uncommitted changes

### Medium-term

1. Admin Dashboard (M7) for content moderation
2. Production deployment to Vercel
3. User testing with real users in Bolivia

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5+, Tailwind CSS v4, shadcn/ui |
| **Backend (BaaS)** | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| **Database** | PostgreSQL 15 + pgvector + Full-Text Search (Spanish) |
| **Search** | Hybrid: Keyword FTS + Semantic (embeddings) with RRF fusion |
| **Embeddings** | Hugging Face Inference API (`paraphrase-multilingual-MiniLM-L12-v2`) |
| **Auth** | Supabase Auth (Email, Google OAuth, Facebook OAuth) |
| **Testing** | Playwright 1.58+ (E2E + accessibility via axe-core), 229 test cases |
| **Dev Tools** | ESLint, Prettier, Husky, lint-staged, Hatch |
| **AI Agents** | 9 custom Cursor subagents (quality-gate, code-reviewer, e2e-test-planner, etc.) |
| **Hosting** | Vercel (planned), Supabase Cloud |

---

## Quick Links

### Live App

- **Development:** http://localhost:3000
- **Production:** TBD

### Supabase

- **Dashboard:** https://supabase.com/dashboard
- **Project Ref:** apwpsjjzcbytnvtnmmru

### Documentation

- [Project README](../README.md)
- [Architecture](./ARCHITECTURE.md)
- [PRD](./PRD.md)
- [M0 Documentation](../milestones/M0-foundation-setup/)
- [M1 Documentation](../milestones/M1-authentication-profiles/)
- [M2 Documentation](../milestones/M2-product-listings/)
- [M3 Documentation](../milestones/M3-search-keyword/)
- [M4 Documentation](../milestones/M4-search-semantic/)
- [M4.5 Documentation](../milestones/M4.5-account-types-kyc/)

---

## Notes

### Key Decisions

1. **Supabase BaaS:** $0/month MVP, PostgreSQL + pgvector for hybrid search
2. **TypeScript strict mode:** Type safety across entire codebase
3. **shadcn/ui:** Accessible, customizable component library
4. **Mobile-first:** All components designed for mobile first
5. **WCAG 2.2 AA:** Accessibility compliance from M0 onward
6. **Business as Add-on (M4.5):** Business profiles are non-mutually-exclusive extensions of personal profiles
7. **Minimal KYC (M4.5):** Phone collection for trust signals, strong KYC deferred
8. **i18n Policy:** Spanish for user-facing text, English for code and documentation
9. **Hybrid Search:** Keyword FTS + Semantic embeddings merged via Reciprocal Rank Fusion

### Challenges & Lessons Learned

1. **M0:** Port conflict (3000 in use) - switched to 3003, later back to 3000
2. **M0:** Mobile menu CSS stacking context - fixed with React Portal
3. **M1:** Supabase CLI global install unsupported - installed as dev dependency
4. **M2:** React controlled/uncontrolled input warnings - resolved with useEffect sync
5. **M3:** Search vector auto-update required careful trigger design
6. **M4:** Hugging Face API URL migration (api-inference -> router.huggingface.co)
7. **M4:** Adaptive RRF weights needed for cross-language queries (English -> Spanish)
8. **M4.5:** Mutually exclusive account types refactored to add-on model after PM review
9. **M4.5:** PostgREST join limitations required separate queries for business_profiles
10. **M4.5:** Playwright test stability - dev server warm-up and client-side navigation handling
11. **Testing:** UX and accessibility reviews catch real issues early - always audit before polish
12. **E2E:** Organizing tests by business flow (not by page) makes coverage gaps obvious
13. **E2E:** AI subagents (e2e-test-planner) accelerate test plan creation — structured plans enable other agents to automate
14. **E2E:** Real mobile/responsive issues found by 375px viewport tests (product detail overflow)

---

**Last Updated:** February 16, 2026  
**Next Review:** After next milestone decision
