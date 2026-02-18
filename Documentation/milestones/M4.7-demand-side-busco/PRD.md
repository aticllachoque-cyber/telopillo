# PRD - Milestone 4.7: Demand-Side Posting — "Busco/Necesito"

**Version:** 1.1  
**Date:** February 17, 2026  
**Author:** Alcides Cardenas  
**Status:** Approved — Ready for Implementation  
**Milestone Duration:** 12-16 working days  
**Priority:** P1 (High — marketplace differentiator, promoted from Phase 2)

---

## 1. Executive Summary

This milestone introduces **demand-side posting** to Telopillo.bo — a reverse marketplace flow where **buyers publish what they need** and **sellers respond with product offers**. This complements the existing supply-side model (seller lists → buyer finds) with a demand-side channel (buyer requests → seller offers).

**Success means:** Buyers can post "Busco iPhone 13 en buen estado" and receive offers from sellers who have matching products, contact them via WhatsApp, and mark the request as fulfilled — all with zero friction, reusing existing categories, locations, search, and embedding infrastructure.

> **Scope note:** This milestone delivers the MVP demand flow with WhatsApp contact. In-app chat integration (M5), seller notifications (email/push), and demand analytics are deferred to future milestones.

---

## 2. Problem Statement

### 2.1 Current State

- The marketplace is **one-directional**: sellers publish, buyers search
- Buyers who cannot find what they need have **no recourse** — they leave the platform
- In Bolivia, the "Busco X, alguien vende?" behavior is extremely common in WhatsApp groups and Facebook groups, but there is **no structured platform** for it
- Sellers have **no visibility into buyer demand** — they publish products blindly without knowing what people are actually looking for
- Search "no results" pages are a **dead end** with no actionable CTA

### 2.2 Desired State

- Buyers can publish structured "Busco" posts describing what they need (title, description, category, location, budget)
- Sellers can browse and search demand posts, filtered by their categories and service area
- Sellers can link one of their existing products as an offer to a demand post
- Buyers receive offers and contact sellers via WhatsApp to negotiate
- Buyers mark posts as "Encontrado" (found) when satisfied
- The search "no results" page becomes an on-ramp: "¿No encontraste? Publica lo que buscas"
- Demand data informs sellers about what to stock/promote (future analytics milestone)

### 2.3 Bolivian Market Context

- **Informal demand posting is already normalized**: Facebook groups like "Compra y Venta Santa Cruz" are full of "Busco..." posts
- **WhatsApp-first economy**: Buyers expect to negotiate directly via WhatsApp, not through in-app forms
- **Price negotiation culture**: Budget ranges (not fixed prices) align with how Bolivians shop
- **Multi-city demand**: A buyer in La Paz may accept offers from Cochabamba if the price is right

---

## 3. Goals & Objectives

### 3.1 Primary Goals

1. **Capture unmet demand**: Convert "no results" dead ends into demand posts that attract sellers
2. **Increase seller engagement**: Give sellers a reason to visit the platform beyond managing their own listings
3. **Marketplace differentiation**: Offer a feature that no competing Bolivian platform provides
4. **Reuse infrastructure**: Leverage existing categories, locations, semantic search, and embedding pipeline — zero new external services
5. **Foundation for demand analytics**: Structured demand data enables future insights for sellers and the platform

### 3.2 Success Metrics

- [ ] Buyers can create demand posts with all required fields
- [ ] Demand posts are discoverable via keyword and semantic search
- [ ] Sellers can browse demand posts filtered by category and location
- [ ] Sellers can link products as offers to demand posts
- [ ] Buyers can view offers and contact sellers via WhatsApp
- [ ] Buyers can mark posts as "Encontrado" to close them
- [ ] Posts auto-expire after 30 days with manual renewal option
- [ ] "¿No encontraste?" CTA displayed on search results
- [ ] All pages mobile-responsive (375px+)
- [ ] WCAG 2.2 AA compliance on all new components

### 3.3 Key Performance Indicators (KPIs)

- Demand posts created per week: target >10 within first month post-launch
- Offers per demand post: target average >1.5
- Demand-to-contact conversion rate: >30% (buyer contacts at least one seller)
- "Encontrado" resolution rate: >20% of demand posts marked as found
- CTA click-through rate on "no results" page: >15%
- Mobile usage: >70% of demand posts created from mobile

---

## 4. Scope

### 4.1 In Scope

#### 4.1.1 Demand Post Creation

**Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | Text | Yes | 5-100 chars, stripHtml |
| Description | Text | Yes | 20-1000 chars, stripHtml |
| Category | Select | Yes | Same as product categories (9 categories) |
| Subcategory | Select | No | Same as product subcategories |
| Department | Select | Yes | 9 Bolivia departments |
| City | Select | Yes | Fixed list from LocationSelector (same cities as products) |
| Minimum Price | Number | No | >= 0 BOB |
| Maximum Price | Number | No | >= min price BOB |

**Behavior:**
- Auth required to create
- Rate limit: max 5 demand posts per user per 24 hours
- Embedding generated automatically via DB trigger (pg_net → generate-embedding Edge Function) — same pattern as products
- `search_vector` (FTS, Spanish config) generated via separate DB trigger on same columns
- Expiration enforced by TTL: queries filter `expires_at > NOW()`. No cron job required.
- Owner can renew expired posts (sets `expires_at = NOW() + 30 days`)
- **No edit after creation** (MVP scope): posts are immutable once published

#### 4.1.2 Demand Post Discovery

- **List page** (`/busco`): Paginated grid of active demand posts
- **Filters**: Category, department, sort (newest / most offers / expiring soon)
- **Search**: Keyword (PostgreSQL full-text) + semantic (embedding similarity)
- **Card display**: Title, description snippet, category badge, location, relative date, offers count

#### 4.1.3 Offer Flow

- Sellers can link one of their **existing published products** to a demand post
- Each product can only be offered to a demand post once (UNIQUE constraint)
- Sellers cannot offer products to their own demand posts
- Optional short message (max 500 chars) accompanies the offer
- Buyer sees all offers on the demand post detail page as product cards
- Buyer contacts preferred seller via WhatsApp

#### 4.1.4 Demand Post Lifecycle

```
                  ┌──────────┐
     Create ─────►│  active   │◄──── Renew (resets 30-day timer)
                  └─────┬─────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        ┌──────────┐        ┌─────────┐
        │  found   │        │ deleted │
        └──────────┘        └─────────┘
         (by owner)          (by owner)

     Note: Expiration (expires_at < NOW()) is a computed
     state, not a stored status. Expired posts remain
     status='active' but are filtered from public listings.
     Owner can renew from dashboard.
```

**Stored statuses** (3 values in CHECK constraint):
- **active**: Default state. Visible in listings (when `expires_at > NOW()`), accepts offers
- **found**: Owner marks as resolved ("Encontrado"). Visible but no new offers accepted
- **deleted**: Soft delete by owner. Hidden from all views

**Computed state** (not stored in `status` column):
- **expired**: Posts where `status = 'active' AND expires_at < NOW()`. Hidden from public listings via TTL filter. Owner sees them in the "Expiradas" dashboard tab and can renew (resets `expires_at` to `NOW() + 30 days`) or delete.

#### 4.1.5 User Dashboard

- `/perfil/demandas` — user's demand posts organized in tabs:
  - **Activas**: `status = 'active' AND expires_at > NOW()`
  - **Encontradas**: `status = 'found'`
  - **Expiradas**: `status = 'active' AND expires_at < NOW()` (computed state)
- Actions: View, Mark as Found, Renew (expired only — resets 30-day timer), Delete
- **Edit is not in MVP scope** (immutable posts keep the flow simple and prevent gaming)
- **"Delete and repost" UX**: Delete confirmation dialog explains the user can create a new post. After delete, redirect with toast message guiding to `/busco/publicar`.
- Prominent **[+ Nueva solicitud]** button always visible at top of dashboard
- Accessible from profile/account navigation

#### 4.1.6 CTA Integration

- Search results page: Banner "¿No encontraste lo que buscas? Publica tu solicitud"
- Empty search results: Prominent CTA to create demand post
- Main navigation: "Busco" link added to header

#### 4.1.7 Database Schema

Two new tables:

- `demand_posts` — buyer's demand with category, location (fixed list), price range, embedding (trigger-generated), `search_vector` (FTS trigger), `expires_at` (TTL). Status CHECK: `('active', 'found', 'deleted')` — expiration is a computed state via TTL filter, not a stored status.
- `demand_offers` — junction table linking products to demand posts with optional message

**Key RLS decisions:**
- `demand_posts`: Public read for active, non-expired posts (`status = 'active' AND expires_at > NOW()`). Owners see their own regardless of status.
- `demand_offers`: Public read for offers on active, non-expired demand posts. Anyone can see how many and which products are offered.

Full SQL in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

### 4.2 Out of Scope (Deferred)

| Feature | Reason | Deferred To |
|---------|--------|-------------|
| Edit demand post | Immutable posts keep the flow simple; prevents gaming and "bump via edit" | Post-launch |
| Email/push notifications for new offers | Requires notification infrastructure | M5+ |
| In-app chat from demand post | Requires M5 (Chat) | After M5 |
| Demand alerts for sellers | Requires saved searches + notifications | Future |
| Demand analytics dashboard | Requires admin panel (M7) | M7+ |
| "Similar demands" recommendations | Nice-to-have, not MVP | Future |
| Bump/promote demand posts | Monetization feature | Future |
| Auto-match products to demands | Complex ML feature | Future |
| Image upload on demand posts | Adds complexity, text is sufficient for MVP | Future |
| Edit demand post | Immutable in MVP; "delete and repost" is the UX path (D5) | Post-launch |
| Cron-based expiration | Supabase free tier lacks pg_cron; TTL filter is sufficient. `status` stays `'active'`; expiration is computed (D3). | Post-launch (paid tier) |

---

## 5. User Stories

### 5.1 Buyer Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| B1 | As a buyer, I want to post what I need so sellers can offer me products | P0 | Can create a demand post with title, description, category, location, optional price range |
| B2 | As a buyer, I want to see offers from sellers on my post | P0 | Demand post detail page shows list of offered products with seller info |
| B3 | As a buyer, I want to contact sellers who offered | P0 | WhatsApp button on each offer opens pre-filled message |
| B4 | As a buyer, I want to close my post when I find what I need | P1 | "Encontrado" button changes status, stops new offers |
| B5 | As a buyer, I want to browse existing demands before creating a duplicate | P1 | Can search/browse demand posts at `/busco` |
| B6 | As a buyer, I want to manage my demand posts | P1 | Dashboard at `/perfil/demandas` with active/found/expired tabs |
| B7 | As a buyer, I want to renew an expired demand post | P2 | "Renew" button on expired posts resets 30-day timer |
| B8 | As a buyer, I want to be guided to post a demand when search fails | P1 | CTA on empty/poor search results links to `/busco/publicar` |

### 5.2 Seller Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| S1 | As a seller, I want to browse demand posts in my categories | P0 | Can filter demand posts by category and department |
| S2 | As a seller, I want to offer my product to a demand post | P0 | Can select from my published products and link to demand with optional message |
| S3 | As a seller, I want to contact the buyer directly | P1 | WhatsApp button on demand post opens pre-filled message to buyer |
| S4 | As a business seller, I want to see demand in my area | P1 | Department/city filters on demand listing |
| S5 | As a seller, I want to know how many offers a demand already has | P2 | Offers count badge visible on demand post card and detail |

---

## 6. UX Specifications

### 6.1 Page Map

```
/busco                    ← Demand posts listing (public)
/busco/publicar           ← Create demand post form (auth required)
/busco/[id]               ← Demand post detail + offers (public, offer requires auth)
/perfil/demandas          ← User's demand posts dashboard (auth required)
```

### 6.2 Create Demand Post (`/busco/publicar`)

**Layout:** Single-column centered form (max-width 640px)

```
┌──────────────────────────────────────────┐
│  ← Volver                                │
│                                          │
│  Publica lo que buscas                   │
│  Describe lo que necesitas y los         │
│  vendedores te contactarán               │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ ¿Qué estás buscando? *          │   │
│  │ [                              ] │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ Describe lo que necesitas *      │   │
│  │ [                              ] │   │
│  │ [                              ] │   │
│  │ [                              ] │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌───────────┐  ┌───────────────────┐   │
│  │ Categoría │  │ Subcategoría      │   │
│  │ [▼       ]│  │ [▼               ]│   │
│  └───────────┘  └───────────────────┘   │
│                                          │
│  ┌───────────┐  ┌───────────────────┐   │
│  │ Depto.    │  │ Ciudad            │   │
│  │ [▼       ]│  │ [               ] │   │
│  └───────────┘  └───────────────────┘   │
│                                          │
│  Presupuesto (opcional)                  │
│  ┌───────────┐  ┌───────────────────┐   │
│  │ Desde Bs. │  │ Hasta Bs.         │   │
│  │ [        ]│  │ [               ] │   │
│  └───────────┘  └───────────────────┘   │
│                                          │
│  [       Publicar solicitud        ]     │
│                                          │
└──────────────────────────────────────────┘
```

### 6.3 Demand Posts Listing (`/busco`)

**Layout:** Filter bar + responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)

```
┌──────────────────────────────────────────────────┐
│  Busco / Necesito                                 │
│  [🔍 Buscar solicitudes...        ] [Publicar +] │
│                                                    │
│  Categoría [▼]  Departamento [▼]  Orden [▼]      │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Busco    │ │ Necesito │ │ Busco    │          │
│  │ iPhone   │ │ sofá     │ │ laptop   │          │
│  │ 13...    │ │ esqu...  │ │ para...  │          │
│  │          │ │          │ │          │          │
│  │ 📍SCZ   │ │ 📍LPZ   │ │ 📍CBB   │          │
│  │ 🏷️Electr│ │ 🏷️Hogar │ │ 🏷️Electr│          │
│  │ 💬 3    │ │ 💬 0    │ │ 💬 1    │          │
│  │ ⏰ 2h   │ │ ⏰ 1d   │ │ ⏰ 3d   │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  [  1  ] [ 2 ] [ 3 ] [ → ]                       │
└──────────────────────────────────────────────────┘
```

### 6.4 Demand Post Detail (`/busco/[id]`)

**Layout:** Two-column on desktop (content + sidebar), single-column on mobile

```
┌────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────────────────────┐ ┌──────────────────────┐  │
│  │                              │ │ Publicado por         │  │
│  │ Busco iPhone 13 en buen     │ │ ┌──┐                  │  │
│  │ estado                       │ │ │👤│ Juan Pérez       │  │
│  │                              │ │ └──┘ 🟢 Vendedor     │  │
│  │ 🏷️ Electrónica              │ │      con Telefono     │  │
│  │ 📍 Santa Cruz               │ │                       │  │
│  │ 💰 Bs. 1,500 - 2,500       │ │ [📱 WhatsApp]         │  │
│  │ ⏰ Hace 2 horas             │ │                       │  │
│  │ Estado: 🟢 Activo           │ │ Expira en 28 días     │  │
│  │                              │ └──────────────────────┘  │
│  │ Estoy buscando un iPhone 13 │                            │
│  │ de 128GB o más, en buen     │                            │
│  │ estado, con batería arriba  │                            │
│  │ del 80%. Preferiblemente    │                            │
│  │ color negro o azul.         │                            │
│  │                              │                            │
│  └─────────────────────────────┘                            │
│                                                              │
│  ── Ofertas (3) ──────────────────────────────────────────  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 📷       │ │ 📷       │ │ 📷       │                    │
│  │ iPhone 13│ │ iPhone 13│ │ iPhone 12│                    │
│  │ 128GB    │ │ Pro 256  │ │ 64GB     │                    │
│  │ Bs.2,200 │ │ Bs.2,800 │ │ Bs.1,400 │                    │
│  │ [Contact]│ │ [Contact]│ │ [Contact]│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
│  [  Ofrecer mi producto  ] (sellers only)                   │
│                                                              │
│  [  Marcar como Encontrado  ] (owner only)                  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### 6.5 Search Results CTA

```
┌────────────────────────────────────────────────┐
│  (... search results or empty state ...)        │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  ¿No encontraste lo que buscas?          │  │
│  │  Publica lo que necesitas y deja que     │  │
│  │  los vendedores te contacten.            │  │
│  │                                           │  │
│  │  [ Publicar lo que busco → ]              │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## 7. Technical Requirements

### 7.1 Performance

| Metric | Target |
|--------|--------|
| Demand list page load | < 2s (LCP) |
| Search API response (keyword) | < 500ms |
| Search API response (semantic) | < 1s |
| Create demand post (including embedding) | < 3s total |
| Offer submission | < 500ms |

### 7.2 Security

- All write operations require authentication (Supabase RLS)
- `stripHtml` sanitization on title, description, and offer message (XSS prevention)
- Rate limiting: max 5 demand posts per user per 24 hours
- Sellers cannot offer products they don't own (RLS constraint)
- Sellers cannot offer to their own demand posts (application-level check)
- All user inputs validated with Zod schemas

### 7.3 Accessibility (WCAG 2.2 AA)

- All form inputs have visible labels
- Error messages linked with `aria-describedby`
- Keyboard navigation on all interactive elements
- Touch targets >= 44px on mobile
- Color contrast >= 4.5:1 for text, >= 3:1 for UI components
- Status changes (found, expired) announced to screen readers
- No horizontal scroll at 375px viewport

### 7.4 SEO

- Demand post detail pages have unique `<title>` and `<meta description>`
- Open Graph tags for social sharing
- Structured data: `WantAction` schema.org type (or fallback to generic `Action`)
- Canonical URLs for demand posts
- Listing page supports server-side rendering for crawlability

### 7.5 Internationalization

- UI strings in Spanish (Bolivian locale)
- All code, variable names, comments, and test files in English
- Dates displayed as relative time ("Hace 2 horas", "Hace 3 días")
- Currency displayed as "Bs." (Bolivianos)

---

## 8. Acceptance Criteria

### 8.1 Functional

- [ ] **AC-01**: Authenticated user can create a demand post with title, description, category, department, city
- [ ] **AC-02**: Optional price range (min/max) accepted and displayed
- [ ] **AC-03**: Demand post appears in `/busco` listing immediately after creation
- [ ] **AC-04**: Demand posts searchable by keyword (PostgreSQL FTS)
- [ ] **AC-05**: Demand posts searchable by semantic similarity (embedding)
- [ ] **AC-06**: Filters work: category, department, sort order
- [ ] **AC-07**: Seller can link one of their products to a demand post as an offer
- [ ] **AC-08**: Seller cannot offer same product twice to same demand (unique constraint)
- [ ] **AC-09**: Seller cannot offer products to their own demand post
- [ ] **AC-10**: Buyer sees all offers on demand post detail page
- [ ] **AC-11**: WhatsApp contact button on demand post opens pre-filled message
- [ ] **AC-12**: WhatsApp contact button on each offer opens seller contact
- [ ] **AC-13**: Owner can mark demand post as "Encontrado"
- [ ] **AC-14**: "Encontrado" posts stop accepting new offers
- [ ] **AC-15**: Posts with `expires_at < NOW()` are hidden from public listings (TTL filter; `status` stays `'active'`, expiration is computed — no cron required)
- [ ] **AC-16**: Owner can renew expired posts
- [ ] **AC-17**: Owner can delete demand posts (soft delete)
- [ ] **AC-18**: `/perfil/demandas` shows user's demand posts in tabs: Activas / Encontradas / Expiradas (computed: `status = 'active' AND expires_at < NOW()`)
- [ ] **AC-19**: "¿No encontraste?" CTA appears on search results page
- [ ] **AC-20**: Unauthenticated users redirected to login when trying to create/offer
- [ ] **AC-21a**: Delete confirmation dialog explains user can create a new post afterward
- [ ] **AC-21b**: After deleting a demand post, user is redirected with a toast guiding to create a new one

### 8.2 Non-Functional

- [ ] **AC-22**: All pages load in < 2s (LCP) on 3G mobile
- [ ] **AC-23**: No horizontal scroll at 375px viewport
- [ ] **AC-24**: Touch targets >= 44px on mobile
- [ ] **AC-25**: WCAG 2.2 AA compliance (axe-core zero critical/serious violations)
- [ ] **AC-26**: Form validation errors are accessible (aria-describedby)
- [ ] **AC-27**: Rate limit enforced: max 5 demand posts per user per 24h
- [ ] **AC-28**: All text inputs sanitized with stripHtml

---

## 9. Design Decisions

The following decisions were finalized during PM review on February 17, 2026:

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | Offer visibility | **Public** — anyone can see offers on active posts | Transparency builds trust; sellers see competition, buyers see options |
| D2 | Embedding strategy | **DB trigger** (same pattern as products) | Consistent with existing architecture; no client-side complexity |
| D3 | Expiration mechanism | **TTL filter** (`expires_at > NOW()`) — no cron; `status` stays `'active'`, expiration is computed | Supabase free tier lacks pg_cron; filter is simpler; 3-value status model (active/found/deleted) keeps every status tied to a user action |
| D4 | `location_city` input | **Fixed list** from `LocationSelector` | Consistent UX; prevents typos/variants; reuses existing constants |
| D5 | Edit demand post | **Deferred** — immutable posts in MVP | Simpler implementation; prevents gaming; reduces moderation complexity |

---

## 10. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | Spam demand posts | High | Medium | Rate limit (5/day), min account age, Zod validation, stripHtml |
| R2 | Low seller engagement with demands | Medium | High | Prominent placement in nav, email digest (future), homepage section (future) |
| R3 | Scam/fake offers | Medium | Medium | RLS prevents offering others' products; report button (basic); full moderation in M9 |
| R4 | Duplicate demand posts | Medium | Low | Search-before-create UX hint; "Similar demands" feature (future) |
| R5 | Empty state (no demands at launch) | High | Medium | Seed content, marketing, strategic CTA placement on search pages |
| R6 | Embedding API rate limits | Low | Low | One embedding per demand post; within Hugging Face free tier limits |
| R7 | Database complexity | Low | Low | Only 2 new tables; follows established patterns from products table |

---

## 11. Dependencies

| Dependency | Status | Impact |
|------------|--------|--------|
| M1: Authentication & Profiles | ✅ Complete | Auth guards, user profiles, WhatsApp contact |
| M2: Product Listings | ✅ Complete | Product cards in offer flow, category/location constants |
| M3: Search & Discovery | ✅ Complete | PostgreSQL full-text search, filter patterns |
| M4: Semantic Search | ✅ Complete | Embedding generation, hybrid search, RRF algorithm |
| M4.5: Account Types | ✅ Complete | Verification badges on demand posters, business seller identification |
| M5: Chat (optional) | ⏳ Not Started | In-app contact deferred; WhatsApp used for MVP |
| M9: Moderation (optional) | ⏳ Not Started | Basic report button for MVP; full moderation deferred |

---

## 12. Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | Day 1-2 | Database schema, migrations, types, validation schemas |
| Phase 2 | Day 3-4 | Create demand post page + embedding generation |
| Phase 3 | Day 5-7 | List page, search API, filters, cards |
| Phase 4 | Day 8-10 | Detail page, offer flow, offer modal |
| Phase 5 | Day 11-12 | User dashboard, CTA integration, navigation |
| Phase 6 | Day 13-16 | E2E tests, accessibility, mobile, polish |

**Total:** 12-16 working days

---

## 13. Future Enhancements (Not in This Milestone)

| Enhancement | Description | Prerequisite |
|-------------|-------------|--------------|
| Seller notifications | Email/push when new demand matches seller's categories | Notification infrastructure |
| In-app chat | Contact buyer/seller from demand post via chat | M5 (Chat) |
| Similar demands | Show "Similar requests" on detail page | Embedding similarity queries |
| Demand alerts | Sellers save category/location and get notified of new demands | Saved searches + notifications |
| Demand analytics | Dashboard showing demand trends by category and location | M7 (Admin) |
| Bump/promote | Pay to boost demand post visibility | Monetization milestone |
| Auto-match | Automatically suggest products to demand posts via embedding similarity | ML pipeline |
| Image upload | Allow buyers to upload reference images with demand posts | Storage expansion |
