# M4.7 Progress Report

**Milestone:** Demand-Side Posting — "Busco/Necesito"  
**Status:** NOT STARTED  
**Last Updated:** February 15, 2026

---

## Overall Progress

```
Phase 1: Database Schema & Types         ░░░░░░░░░░░░░░░░░░░░   0%
Phase 2: Create Demand Post              ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: List & Search                   ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: Detail & Offer Flow             ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: Dashboard & CTA Integration     ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: Testing & Polish                ░░░░░░░░░░░░░░░░░░░░   0%

Overall: ░░░░░░░░░░░░░░░░░░░░ 0%
```

---

## Phase 1: Database Schema & Types — NOT STARTED

- [ ] Migration: create `demand_posts` table with constraints and indexes
- [ ] Migration: create `demand_offers` table with UNIQUE constraint
- [ ] HNSW index on `demand_posts.embedding`
- [ ] RLS policies: 5 for demand_posts, 3 for demand_offers
- [ ] `update_demand_offers_count()` trigger function
- [ ] `expire_demand_posts()` cron function
- [ ] `updated_at` trigger (reuse existing function)
- [ ] Update `types/database.ts` with `DemandPost` and `DemandOffer` interfaces
- [ ] Create `lib/validations/demand.ts` with Zod schemas
- [ ] `stripHtml` transform on title, description, message fields

## Phase 2: Create Demand Post — NOT STARTED

- [ ] `app/busco/publicar/page.tsx` — create form page
- [ ] `components/demand/DemandPostForm.tsx` — form component
- [ ] Auth guard: redirect unauthenticated users to login
- [ ] Rate limit check: max 5 per user per 24h
- [ ] Reuse `PRODUCT_CATEGORIES`, `CATEGORY_LABELS`, `BOLIVIA_DEPARTMENTS`
- [ ] Embedding generation after INSERT (Edge Function Mode 2)
- [ ] Success redirect to `/busco/[id]`
- [ ] Mobile-responsive layout

## Phase 3: List & Search — NOT STARTED

- [ ] `app/busco/page.tsx` — demand posts listing page
- [ ] `components/demand/DemandPostCard.tsx` — card component
- [ ] `components/demand/DemandPostFilters.tsx` — filter bar
- [ ] `components/demand/DemandStatusBadge.tsx` — status badge
- [ ] `app/api/search-demands/route.ts` — search API endpoint
- [ ] PostgreSQL FTS on title + description (Spanish config)
- [ ] Semantic search via embedding similarity
- [ ] Hybrid search with RRF fusion
- [ ] Filters: category, department, sort
- [ ] Pagination (12 per page)
- [ ] Empty state with CTA

## Phase 4: Detail & Offer Flow — NOT STARTED

- [ ] `app/busco/[id]/page.tsx` — demand post detail page
- [ ] `components/demand/DemandPostDetail.tsx` — detail component
- [ ] Buyer info sidebar: avatar, name, badge, WhatsApp
- [ ] Offers list: ProductCard components for offered products
- [ ] `components/demand/OfferProductModal.tsx` — offer modal
- [ ] Fetch seller's products for selection
- [ ] Optional message field (max 500 chars)
- [ ] Validation: no self-offer, no duplicate offers
- [ ] "Mark as found" button for post owner
- [ ] SEO: meta tags, Open Graph

## Phase 5: Dashboard & CTA Integration — NOT STARTED

- [ ] `app/perfil/demandas/page.tsx` — user dashboard
- [ ] Tabs: Active / Found / Expired
- [ ] Actions: View, Mark as Found, Renew, Delete
- [ ] Renew: reset expires_at, set status to active
- [ ] CTA banner on `/buscar` search results
- [ ] CTA on empty search results
- [ ] "Busco" link in header navigation
- [ ] Update `middleware.ts` protected routes

## Phase 6: Testing & Polish — NOT STARTED

- [ ] `tests/e2e/demand-side/create-demand.spec.ts`
- [ ] `tests/e2e/demand-side/search-demands.spec.ts`
- [ ] `tests/e2e/demand-side/offer-flow.spec.ts`
- [ ] `tests/e2e/demand-side/demand-lifecycle.spec.ts`
- [ ] `tests/e2e/demand-side/demand-accessibility.spec.ts`
- [ ] WCAG 2.2 AA compliance (axe-core)
- [ ] Mobile responsiveness (375px viewport)
- [ ] Touch targets >= 44px
- [ ] No horizontal scroll
- [ ] Performance: lazy loading, pagination
- [ ] Search API < 500ms keyword, < 1s semantic

---

## Blockers

None at this time.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-15 | Promoted from Phase 2 (M12) to next milestone (M4.7) | Feature aligns with current capabilities; all dependencies met |
| 2026-02-15 | WhatsApp-first contact (no M5 dependency) | Matches Bolivian user behavior; chat deferred to future integration |
| 2026-02-15 | 30-day expiration with manual renewal | Prevents stale posts; user must actively choose to keep demand open |
| 2026-02-15 | Reuse existing embedding model and search infra | Same `paraphrase-multilingual-MiniLM-L12-v2` model; no new services |

---

## Notes

- PROGRESS.md will be updated as implementation begins
- Each phase completion will include: files created/modified, tests passed, issues found
