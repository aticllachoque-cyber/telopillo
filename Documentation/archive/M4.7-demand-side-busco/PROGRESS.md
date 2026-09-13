# M4.7 Progress Report

**Milestone:** Demand-Side Posting — "Busco/Necesito"  
**Status:** COMPLETE  
**Started:** February 18, 2026  
**Completed:** February 19, 2026  
**Actual Duration:** ~6 hours  
**Last Updated:** February 19, 2026

---

## Overall Progress

```
Phase 1: Database Schema & Types         ████████████████████ 100% ✅
Phase 2: Create Demand Post              ████████████████████ 100% ✅
Phase 3: List & Search                   ████████████████████ 100% ✅
Phase 4: Detail & Offer Flow             ████████████████████ 100% ✅
Phase 5: Dashboard & CTA Integration     ████████████████████ 100% ✅
Phase 6: Testing & Polish                ████████████████████ 100% ✅

Overall: ████████████████████ 100%
```

---

## Phase 1: Database Schema & Types — COMPLETE

- [x] Migration: create `demand_posts` table with constraints and indexes
- [x] Migration: create `demand_offers` table with UNIQUE constraint
- [x] HNSW index on `demand_posts.embedding`
- [x] RLS policies: 5 for demand_posts, 3 for demand_offers
- [x] `update_demand_offers_count()` trigger function
- [x] `expire_demand_posts()` cron function (SQL defined, needs pg_cron activation)
- [x] `updated_at` trigger (reuses existing `set_updated_at` function)
- [x] Update `types/database.ts` with `DemandPost`, `DemandOffer`, `SearchDemandPost` interfaces
- [x] Create `lib/validations/demand.ts` with Zod schemas
- [x] `stripHtml` transform on title, description, message fields
- [x] `search_demands_hybrid` RPC function for combined FTS + semantic search

**Files created/modified:**
- `supabase/migrations/20260218120000_create_demand_posts.sql`
- `types/database.ts`
- `lib/validations/demand.ts`

## Phase 2: Create Demand Post — COMPLETE

- [x] `app/busco/publicar/page.tsx` — create form page
- [x] `components/demand/DemandPostForm.tsx` — form component with react-hook-form + Zod
- [x] Auth guard: redirect unauthenticated users to login (middleware.ts)
- [x] Rate limit check: max 5 per user per 24h
- [x] Reuse `PRODUCT_CATEGORIES`, `CATEGORY_LABELS`, `BOLIVIA_DEPARTMENTS`
- [x] Embedding generation after INSERT (Edge Function DEMAND mode)
- [x] Success redirect to `/busco/[id]`
- [x] Mobile-responsive layout
- [x] Structural skeleton loading state (replaces spinner)
- [x] `text-balance` on heading, `text-pretty` on descriptive text

**Files created/modified:**
- `app/busco/publicar/page.tsx`
- `components/demand/DemandPostForm.tsx`
- `supabase/functions/generate-embedding/index.ts` (added DEMAND mode)
- `middleware.ts` (added `/busco/publicar` to protected prefixes)

## Phase 3: List & Search — COMPLETE

- [x] `app/busco/page.tsx` — demand posts listing page
- [x] `components/demand/DemandPostCard.tsx` — card component with aria-labels
- [x] `components/demand/DemandPostFilters.tsx` — responsive filter bar (2x2 mobile, inline desktop)
- [x] `components/demand/DemandStatusBadge.tsx` — status badge component
- [x] `app/api/search-demands/route.ts` — search API endpoint
- [x] PostgreSQL FTS on title + description (Spanish config)
- [x] Semantic search via embedding similarity
- [x] Hybrid search with RRF fusion (`search_demands_hybrid` RPC)
- [x] Filters: category, department, sort (newest, oldest, offers, price-asc, price-desc)
- [x] Pagination (12 per page)
- [x] Empty state with CTA
- [x] Structural skeleton loading state (grid placeholder)

**Files created/modified:**
- `app/busco/page.tsx`
- `app/api/search-demands/route.ts`
- `components/demand/DemandPostCard.tsx`
- `components/demand/DemandPostFilters.tsx`
- `components/demand/DemandStatusBadge.tsx`

## Phase 4: Detail & Offer Flow — COMPLETE

- [x] `app/busco/[id]/page.tsx` — demand post detail page with SEO metadata
- [x] `components/demand/DemandPostDetail.tsx` — detail component
- [x] Buyer info sidebar: avatar, name, verification badge, WhatsApp
- [x] Offers list: ProductCard components for offered products
- [x] `components/demand/OfferProductModal.tsx` — offer modal with product selection
- [x] Fetch seller's products for selection
- [x] Optional message field (max 500 chars)
- [x] Validation: no self-offer, no duplicate offers
- [x] "Mark as found" button for post owner
- [x] SEO: meta tags, Open Graph
- [x] `text-balance` on headings, `text-pretty` on body text
- [x] Structural skeleton for loading state in offer modal
- [x] CTA for sellers with no products to offer

**Files created/modified:**
- `app/busco/[id]/page.tsx`
- `components/demand/DemandPostDetail.tsx`
- `components/demand/OfferProductModal.tsx`
- `components/ui/dialog.tsx` (new shadcn/ui dialog component)

## Phase 5: Dashboard & CTA Integration — COMPLETE

- [x] `app/perfil/demandas/page.tsx` — user dashboard
- [x] Tabs: Active / Found / Expired
- [x] Actions: View, Mark as Found, Renew, Delete
- [x] Renew: reset expires_at, set status to active
- [x] CTA banner on `/buscar` search results (bottom of results)
- [x] CTA on empty search results ("Publicar lo que busco")
- [x] "Busco" link in desktop header navigation
- [x] "Busco / Necesito" and "Mis Solicitudes" links in mobile hamburger menu
- [x] Update `middleware.ts` protected routes
- [x] Structural skeleton loading states (page + tab content)
- [x] Tab-specific empty state CTAs (e.g., "Ver solicitudes activas", "Publicar nueva solicitud")
- [x] `text-balance` on headings

**Files created/modified:**
- `app/perfil/demandas/page.tsx`
- `app/buscar/page.tsx` (demand CTAs)
- `components/layout/Header.tsx` (navigation links, z-index fix)

## Phase 6: Testing & Polish — COMPLETE

- [x] `tests/e2e/demand-side/create-demand.spec.ts`
- [x] `tests/e2e/demand-side/search-demands.spec.ts`
- [x] `tests/e2e/demand-side/offer-flow.spec.ts`
- [x] `tests/e2e/demand-side/demand-lifecycle.spec.ts`
- [x] `tests/e2e/demand-side/demand-accessibility.spec.ts`
- [x] WCAG 2.2 AA compliance (aria-labels, focus management, keyboard nav)
- [x] Mobile responsiveness (375px viewport tested)
- [x] Touch targets >= 44px (filter selects use `h-11` on mobile)
- [x] No horizontal scroll
- [x] Performance: structural skeleton loaders, pagination
- [x] UX audit: text-balance/text-pretty typography, z-index consistency
- [x] Accessibility audit: all interactive elements have aria-labels
- [x] Monkey testing: no crashes, XSS-safe, responsive across viewports

**Files created:**
- `tests/e2e/demand-side/create-demand.spec.ts`
- `tests/e2e/demand-side/search-demands.spec.ts`
- `tests/e2e/demand-side/offer-flow.spec.ts`
- `tests/e2e/demand-side/demand-lifecycle.spec.ts`
- `tests/e2e/demand-side/demand-accessibility.spec.ts`

---

## Blockers

None. All phases completed successfully.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-15 | Promoted from Phase 2 (M12) to next milestone (M4.7) | Feature aligns with current capabilities; all dependencies met |
| 2026-02-15 | WhatsApp-first contact (no M5 dependency) | Matches Bolivian user behavior; chat deferred to future integration |
| 2026-02-15 | 30-day expiration with manual renewal | Prevents stale posts; user must actively choose to keep demand open |
| 2026-02-15 | Reuse existing embedding model and search infra | Same `paraphrase-multilingual-MiniLM-L12-v2` model; no new services |
| 2026-02-18 | Rate limit 5 posts per user per 24h | Prevents spam while allowing reasonable posting volume |
| 2026-02-19 | Structural skeletons over spinners | Better perceived performance, follows baseline UI constraints |
| 2026-02-19 | 2x2 mobile grid for filters | 44px touch targets, better use of horizontal space on mobile |
| 2026-02-19 | z-index standardization (z-50) | Replaced arbitrary z-[60]/z-[70] values per UI baseline constraints |

---

## UX/A11y Improvements Applied

| Category | Change | Files |
|----------|--------|-------|
| Typography | `text-balance` on headings, `text-pretty` on body text | All demand pages and components |
| Loading | Structural skeleton grids replace `Loader2` spinners | busco/page, busco/publicar, perfil/demandas, OfferProductModal |
| Empty states | Tab-specific CTAs ("Ver solicitudes activas", "Publicar nueva solicitud") | perfil/demandas |
| Accessibility | `aria-label` on all interactive elements | DemandPostCard, DemandPostFilters |
| Filters | Responsive 2x2 grid (mobile) / inline row (desktop) | DemandPostFilters |
| Touch targets | `h-11` (44px) minimum on mobile filter selects | DemandPostFilters |
| Navigation | z-index fixed from z-[60]/z-[70] to z-50 | Header.tsx |
| Form control | Price inputs controlled via `watch()` | DemandPostForm |
| CTA | "Publicar lo que busco" added to search results | buscar/page |

---

## Notes

- Migration `20260218120000_create_demand_posts.sql` needs `npx supabase db push` to deploy
- `pg_cron` activation needed on Supabase dashboard for automatic post expiration
- Edge Function `generate-embedding` was extended (not replaced) with DEMAND mode
- All pre-commit hooks pass (ESLint, Prettier, TypeScript)
