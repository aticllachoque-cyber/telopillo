# M4.7 — Demand-Side Posting: Architecture Document

**Version:** 1.1  
**Date:** February 17, 2026  
**Author:** Alcides Cardenas  
**Status:** Design Document — Decisions Finalized  
**Milestone:** M4.7 — Demand-Side Posting ("Busco/Necesito")

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context](#2-system-context)
3. [Component Architecture](#3-component-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Database Schema Details](#5-database-schema-details)
6. [User Flow Architecture](#6-user-flow-architecture)
7. [URL Routing Architecture](#7-url-routing-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Search Architecture](#9-search-architecture)
10. [Embedding Pipeline](#10-embedding-pipeline)
11. [Performance Considerations](#11-performance-considerations)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Migration Strategy](#13-migration-strategy)

---

## 1. Executive Summary

### 1.1 Overview

Milestone 4.7 introduces a **demand-side posting** system to complement the existing supply-side marketplace. The architecture adds two new database tables (`demand_posts`, `demand_offers`), four new frontend pages, six new components, and extends the existing search and embedding infrastructure — all within the established Supabase BaaS architecture.

**Key architectural characteristics:**

- **Additive extension:** No modifications to existing tables. Two new tables follow the same patterns as `products`
- **Infrastructure reuse:** Same categories, locations, embedding model, search algorithms, and RLS patterns
- **3-value status model:** `active`, `found`, `deleted` — every stored status maps to a user action. Expiration is a computed state (TTL filter), not stored.
- **Stateless lifecycle:** Status transitions (active → found/deleted) managed via simple UPDATE operations
- **Trigger-driven counters:** `offers_count` maintained by database trigger, ensuring consistency without application-level tracking
- **TTL expiration:** No cron job. Expiration is enforced by `expires_at > NOW()` filter on all public queries. `status` stays `'active'`; the "expired" concept is computed at query time. (Supabase free tier lacks pg_cron)
- **Public offers:** All offers on active demand posts are publicly visible (transparency by design)

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Two separate tables** | `demand_posts` + `demand_offers` | Clean separation; junction table for many-to-many between demands and products |
| **Reuse `PRODUCT_CATEGORIES` taxonomy** | Yes | No new categories needed; demands mirror supply-side classification |
| **Embed demand posts using same model** | `paraphrase-multilingual-MiniLM-L12-v2` (384 dims) | Already handles Spanish; no new model needed |
| **Embedding generation strategy** | **DB trigger** (pg_net → Edge Function) | Same pattern as `products`; no client-side call needed; keeps UI responsive |
| **WhatsApp-first contact** | `wa.me` links | Matches Bolivian user behavior; defers M5 chat dependency |
| **Soft delete via `status = 'deleted'`** | Yes | Preserves data for analytics; no CASCADE side effects |
| **3-value status model** | `active`, `found`, `deleted` | Every stored status maps to a user action; expiration is computed via TTL filter, not stored |
| **`offers_count` denormalization** | Yes | Avoids COUNT(*) JOIN on every demand card render; trigger keeps it in sync |
| **30-day expiration mechanism** | **TTL filter** (`expires_at > NOW()`); `status` stays `'active'` | Supabase free tier lacks pg_cron; filter is sufficient; no ambiguity between stored and computed state |
| **`location_city` input** | **Fixed list** (LocationSelector) | Consistent UX; prevents typos/variants; reuses existing constants |
| **Offer visibility** | **Public** | Transparency; buyers see competition, sellers see market |
| **Edit demand post** | **Deferred** — immutable in MVP; "delete and repost" UX path | Simpler implementation; prevents gaming; reduces moderation surface |

### 1.3 Integration with Existing System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    M4.7 INTEGRATION POINTS                                   │
│                                                                             │
│  M0 (Infrastructure)  ──► Supabase Auth, PostgreSQL, pgvector              │
│  M1 (Profiles)        ──► profiles table (demand_posts.user_id FK)         │
│  M2 (Products)        ──► products table (demand_offers.product_id FK)     │
│  M3 (Search)          ──► PostgreSQL FTS patterns, filter UI patterns      │
│  M4 (Semantic)        ──► generate-embedding Edge Function, RRF algorithm  │
│  M4.5 (Accounts)      ──► VerificationBadge on demand post author          │
│                                                                             │
│  NEW: demand_posts, demand_offers, /busco/* pages, demand components       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Context

### 2.1 M4.7 in Overall Telopillo.bo Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TELOPILLO.BO PLATFORM                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (Next.js 16)                               │ │
│  │                                                                        │ │
│  │  M4.7 NEW:                         M4.7 MODIFIED:                     │ │
│  │  - /busco (list + search)          - /buscar (add CTA banner)         │ │
│  │  - /busco/publicar (create)        - Header (add "Busco" nav link)    │ │
│  │  - /busco/[id] (detail)            - middleware.ts (protected routes)  │ │
│  │  - /perfil/demandas (dashboard)                                        │ │
│  │  - DemandPostCard                                                      │ │
│  │  - DemandPostForm                                                      │ │
│  │  - DemandPostFilters                                                   │ │
│  │  - DemandStatusBadge                                                   │ │
│  │  - OfferProductModal                                                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    Supabase (BaaS)                                     │ │
│  │                                                                        │ │
│  │  M4.7 NEW:                         M4.7 REUSED:                       │ │
│  │  - demand_posts table              - profiles (FK, badges)            │ │
│  │  - demand_offers table             - products (FK, offer source)      │ │
│  │  - update_demand_offers_count()    - generate-embedding (direct text) │ │
│  │  - expire_demand_posts()           - pgvector HNSW index             │ │
│  │  - RLS policies (4 + 3)           - PostgreSQL FTS (spanish config)  │ │
│  │  - search_demands_semantic() RPC   - RRF algorithm pattern           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependencies

| Milestone | Dependency | Usage |
|-----------|------------|-------|
| **M0** | Supabase Auth, PostgreSQL, pgvector | Core infrastructure |
| **M1** | `profiles` table, VerificationBadge | FK for demand_posts.user_id; buyer identity display |
| **M2** | `products` table, ProductCard | FK for demand_offers.product_id; offer display |
| **M3** | PostgreSQL FTS, filter UI patterns | Keyword search on demand posts; reuse filter components |
| **M4** | `generate-embedding` Edge Function, RRF | Semantic search on demand posts; same embedding model |
| **M4.5** | Account types, business badges | Show badge on demand poster; identify business sellers in offers |

---

## 3. Component Architecture

### 3.1 Frontend Components

```
components/
├── demand/
│   ├── DemandPostCard.tsx        # Card for demand post list view
│   ├── DemandPostForm.tsx        # Create/edit demand post form
│   ├── DemandPostDetail.tsx      # Full detail view with offers section
│   ├── DemandPostFilters.tsx     # Category, location, sort filter bar
│   ├── DemandStatusBadge.tsx     # Active / Found / Expired status badge
│   └── OfferProductModal.tsx     # Modal: select product to offer
│
├── products/
│   └── ProductCard.tsx           # REUSED: display offered products
│
├── ui/
│   └── VerificationBadge.tsx     # REUSED: buyer/seller trust badge
│
└── layout/
    └── Header.tsx                # MODIFIED: add "Busco" nav link

app/
├── busco/
│   ├── page.tsx                  # List/search demand posts
│   ├── publicar/
│   │   └── page.tsx              # Create demand post form
│   └── [id]/
│       └── page.tsx              # Demand post detail + offers
│
├── perfil/
│   └── demandas/
│       └── page.tsx              # User's demand posts dashboard
│
├── buscar/
│   └── page.tsx                  # MODIFIED: add "¿No encontraste?" CTA
│
└── api/
    └── search-demands/
        └── route.ts              # Demand posts search API
```

### 3.2 Component Interaction: Create Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  /busco/publicar                                                      │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  DemandPostForm                                                  │ │
│  │  - title, description (textarea)                                 │ │
│  │  - category selector (reuse PRODUCT_CATEGORIES)                 │ │
│  │  - location selector (reuse BOLIVIA_DEPARTMENTS + city)         │ │
│  │  - price range (optional min/max)                               │ │
│  │  - Zod validation via demandPostSchema                          │ │
│  └──────────────────────┬──────────────────────────────────────────┘ │
│                          │                                            │
│                          │ INSERT INTO demand_posts                   │
│                          ▼                                            │
│              ┌──────────────────────────────────┐                    │
│              │  Supabase PostgreSQL               │                    │
│              │  demand_posts row created          │                    │
│              └──────────────┬───────────────────┘                    │
│                              │                                        │
│                              │ Invoke generate-embedding              │
│                              │ (Mode 2: direct text)                  │
│                              ▼                                        │
│              ┌──────────────────────────────────┐                    │
│              │  Edge Function                     │                    │
│              │  → Hugging Face API                │                    │
│              │  → 384-dim embedding               │                    │
│              └──────────────┬───────────────────┘                    │
│                              │                                        │
│                              │ UPDATE demand_posts                    │
│                              │ SET embedding = [...]                  │
│                              ▼                                        │
│              ┌──────────────────────────────────┐                    │
│              │  Redirect to /busco/[id]          │                    │
│              └──────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Interaction: Offer Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  /busco/[id]                                                          │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  DemandPostDetail      │  │  Buyer Info Sidebar                 │ │
│  │  - title, description  │  │  - avatar, name, badge              │ │
│  │  - category, location  │  │  - WhatsApp contact button          │ │
│  │  - price range         │  │  - expiration countdown             │ │
│  │  - DemandStatusBadge   │  └─────────────────────────────────────┘ │
│  └───────────────────────┘                                            │
│                                                                        │
│  ── Offers Section ────────────────────────────────────────────────── │
│  │ ProductCard[] (from demand_offers JOIN products)                  │ │
│  │ Each card: product image, title, price, seller info, [WhatsApp]  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [Ofrecer mi producto] ─── (authenticated sellers only) ──►          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  OfferProductModal (Dialog)                                    │    │
│  │                                                                │    │
│  │  Fetch: products WHERE user_id = auth.uid() AND status = active│    │
│  │                                                                │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐  (selectable grid)              │    │
│  │  │ Prod │ │ Prod │ │ Prod │                                   │    │
│  │  │  A   │ │  B   │ │  C   │                                   │    │
│  │  └──────┘ └──────┘ └──────┘                                   │    │
│  │                                                                │    │
│  │  Mensaje (optional, max 500 chars)                            │    │
│  │  [                                                    ]       │    │
│  │                                                                │    │
│  │  [ Cancelar ]  [ Enviar oferta ]                              │    │
│  └────────────────────────┬─────────────────────────────────────┘    │
│                            │                                          │
│                            │ INSERT INTO demand_offers                │
│                            │ (demand_post_id, product_id,            │
│                            │  seller_id, message)                    │
│                            ▼                                          │
│              Trigger: offers_count += 1                               │
│              Offer appears in offers list                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Architecture

### 4.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   profiles    │       │  demand_posts     │       │   products    │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │◄──FK──│ user_id           │       │ id (PK)      │
│ full_name    │       │ id (PK)           │       │ user_id      │
│ phone        │       │ title             │       │ title        │
│ avatar_url   │       │ description       │       │ price        │
│ ...          │       │ category          │       │ images       │
└──────────────┘       │ location_dept     │       │ ...          │
                       │ location_city     │       └──────┬───────┘
                       │ price_min/max     │              │
                       │ status            │              │
                       │ offers_count      │              │
                       │ embedding         │              │
                       │ expires_at        │              │
                       └────────┬─────────┘              │
                                │                         │
                                │ 1:N                     │ 1:N
                                ▼                         ▼
                       ┌──────────────────────────────────┐
                       │       demand_offers               │
                       │──────────────────────────────────│
                       │ id (PK)                           │
                       │ demand_post_id (FK) ──────────── │
                       │ product_id (FK) ─────────────── │
                       │ seller_id (FK → profiles)        │
                       │ message                           │
                       │ UNIQUE(demand_post_id, product_id)│
                       └──────────────────────────────────┘
```

### 4.2 Data Flow

```
                    ┌────────────────┐
                    │   Buyer creates │
                    │   demand post   │
                    └───────┬────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  demand_posts (active)   │
              │  + embedding generated   │
              └─────────┬───────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    Seller searches   Seller browses  expires_at < NOW()
    (semantic/kw)     (category/loc)  (TTL filter — computed state,
          │             │              status stays 'active')
          └──────┬──────┘             │
                 │                    ▼
                 │           Hidden from public listings
                 │           Owner sees in "Expiradas" dashboard tab
                 │           Owner can: Renew (reset 30d) or Delete
                 ▼
          Seller offers product
                 │
                 ▼
          ┌─────────────────────────┐
          │  demand_offers created   │
          │  offers_count += 1       │
          └─────────┬───────────────┘
                    │
                    ▼
          Buyer sees offers → WhatsApp → Transaction (off-platform)
                    │
                    ▼
          Buyer marks "Encontrado" → status = 'found'
```

---

## 5. Database Schema Details

### 5.1 `demand_posts` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | — | FK → profiles.id |
| `title` | TEXT | No | — | 5-100 chars |
| `description` | TEXT | No | — | 20-1000 chars |
| `category` | TEXT | No | — | Must match PRODUCT_CATEGORIES |
| `subcategory` | TEXT | Yes | NULL | Optional subcategory |
| `location_department` | TEXT | No | — | Must match BOLIVIA_DEPARTMENTS |
| `location_city` | TEXT | No | — | Fixed list from `LocationSelector` (same as products) |
| `price_min` | DECIMAL(10,2) | Yes | NULL | Minimum budget in BOB |
| `price_max` | DECIMAL(10,2) | Yes | NULL | Maximum budget in BOB |
| `status` | TEXT | No | `'active'` | One of: active, found, deleted. Expiration is computed via TTL (`expires_at < NOW()`), not stored. |
| `offers_count` | INTEGER | No | `0` | Denormalized count, trigger-maintained |
| `embedding` | vector(384) | Yes | NULL | Semantic search embedding (set by DB trigger) |
| `search_vector` | tsvector | Yes | NULL | FTS vector (set by DB trigger, Spanish config) |
| `expires_at` | TIMESTAMPTZ | No | `NOW() + 30 days` | TTL timestamp; queries filter `expires_at > NOW()` |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Indexes:**

| Index | Columns | Type | Purpose |
|-------|---------|------|---------|
| PK | `id` | B-tree | Primary key |
| `idx_demand_posts_user` | `user_id` | B-tree | User dashboard queries |
| `idx_demand_posts_category` | `category` | B-tree | Category filter |
| `idx_demand_posts_status` | `status` | B-tree | Status filter |
| `idx_demand_posts_location` | `location_department` | B-tree | Location filter |
| `idx_demand_posts_created` | `created_at DESC` | B-tree | Sort by newest |
| `idx_demand_posts_expires` | `expires_at` | B-tree | TTL expiration filter |
| `idx_demand_posts_active_list` | `(status, category, location_department)` | B-tree | Composite for active-list query |
| `idx_demand_posts_search_vector` | `search_vector` | GIN | Full-text search (Spanish) |
| `idx_demand_posts_embedding` | `embedding` | HNSW (cosine) | Semantic search |

**Constraints:**

- `demand_posts_title_length`: char_length(title) BETWEEN 5 AND 100
- `demand_posts_description_length`: char_length(description) BETWEEN 20 AND 1000
- `demand_posts_price_range`: price_max IS NULL OR price_min IS NULL OR price_max >= price_min
- `status` CHECK: IN ('active', 'found', 'deleted') — expiration is a computed state via TTL filter, not a stored status

### 5.2 `demand_offers` Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `demand_post_id` | UUID | No | — | FK → demand_posts.id (CASCADE) |
| `product_id` | UUID | No | — | FK → products.id (CASCADE) |
| `seller_id` | UUID | No | — | FK → profiles.id (CASCADE) |
| `message` | TEXT | Yes | NULL | Optional offer message |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Creation timestamp |

**Constraints:**

- UNIQUE(`demand_post_id`, `product_id`) — one product per demand post

**Indexes:**

| Index | Columns | Purpose |
|-------|---------|---------|
| PK | `id` | Primary key |
| `idx_demand_offers_post` | `demand_post_id` | Fetch offers for a demand |
| `idx_demand_offers_product` | `product_id` | Check if product already offered |
| `idx_demand_offers_seller` | `seller_id` | Seller's offers dashboard |

### 5.3 RLS Policy Summary

| Table | Policy | Operation | Rule |
|-------|--------|-----------|------|
| `demand_posts` | Anyone can view active | SELECT | `status = 'active' AND expires_at > NOW()` |
| `demand_posts` | Users see own (any status) | SELECT | `auth.uid() = user_id` |
| `demand_posts` | Auth users create | INSERT | `auth.uid() = user_id` |
| `demand_posts` | Owners update | UPDATE | `auth.uid() = user_id` |
| `demand_posts` | Owners delete | DELETE | `auth.uid() = user_id` |
| `demand_offers` | **Anyone** views offers on active posts | SELECT | `demand_post is active AND expires_at > NOW()` |
| `demand_offers` | Owners see offers on own posts (any status) | SELECT | `auth.uid() = demand_posts.user_id` |
| `demand_offers` | Auth users create for own products | INSERT | `auth.uid() = seller_id AND product_id IN own products` |
| `demand_offers` | Offer creators delete | DELETE | `auth.uid() = seller_id` |

### 5.4 Triggers & Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `update_demand_offers_count()` | AFTER INSERT OR DELETE ON demand_offers | Maintain `offers_count` on demand_posts |
| `update_updated_at_column()` | BEFORE UPDATE ON demand_posts | Auto-set `updated_at` (reuse existing function) |
| `update_demand_posts_search_vector()` | BEFORE INSERT OR UPDATE (title/desc/category) ON demand_posts | Generate `search_vector` (FTS, Spanish config) |
| `trigger_demand_post_embedding()` | AFTER INSERT OR UPDATE (title/desc/category) ON demand_posts | Call generate-embedding Edge Function via pg_net to set `embedding` |
| ~~`expire_demand_posts()`~~ | ~~pg_cron~~ | **Removed** — expiration handled by TTL filter (`expires_at > NOW()`) in all queries. `status` stays `'active'`; expiration is a computed state. |

---

## 6. User Flow Architecture

### 6.1 Create Demand Post

```
User → /busco/publicar
  │
  ├─ NOT authenticated → Redirect to /login?redirect=/busco/publicar
  │
  └─ Authenticated:
      │
      ├─ Check rate limit: SELECT count(*) FROM demand_posts
      │   WHERE user_id = auth.uid()
      │   AND created_at > NOW() - INTERVAL '24 hours'
      │   → If >= 5, show error "Maximum 5 requests per day"
      │
      └─ Show DemandPostForm
          │
          ├─ Client-side: Zod validation (demandPostSchema)
          │
          └─ Submit:
              ├─ INSERT INTO demand_posts (user_id, title, ...)
              │   ├─ DB trigger: search_vector generated synchronously
              │   └─ DB trigger: pg_net calls generate-embedding asynchronously
              │       → embedding set in background (does not block redirect)
              └─ Redirect to /busco/[new_id]
```

### 6.2 Search Demand Posts

```
User → /busco OR /busco?q=iphone&category=electronics
  │
  ├─ No query → Fetch recent active demand posts (paginated)
  │
  └─ With query:
      ├─ Keyword search: PostgreSQL FTS on title + description
      │   to_tsvector('spanish', title || ' ' || description)
      │   @@ plainto_tsquery('spanish', q)
      │
      ├─ Semantic search: Generate embedding for query text
      │   → Find similar demand_posts by cosine distance
      │
      └─ Hybrid: RRF fusion of keyword + semantic results
          │
          └─ Apply filters: category, department, status = 'active'
              │
              └─ Apply sort: newest | most_offers | expiring_soon
                  │
                  └─ Paginate (12 per page) → Return DemandPostCard[]
```

### 6.3 Offer Product to Demand

```
Seller → /busco/[id] → Click "Ofrecer mi producto"
  │
  ├─ NOT authenticated → Redirect to /login?redirect=/busco/[id]
  │
  ├─ Is demand post owner → Button hidden (cannot offer to self)
  │
  ├─ Demand status ≠ 'active' OR expires_at < NOW() → Button disabled
  │
  └─ Show OfferProductModal:
      │
      ├─ Fetch: SELECT * FROM products
      │         WHERE user_id = auth.uid() AND status = 'active'
      │
      ├─ User selects product + optional message
      │
      └─ Submit:
          ├─ INSERT INTO demand_offers
          │   (demand_post_id, product_id, seller_id, message)
          │
          ├─ Trigger: offers_count += 1
          │
          └─ Close modal, refresh offers list
```

---

## 7. URL Routing Architecture

### 7.1 New Routes

| Route | Type | Auth | SSR | Description |
|-------|------|------|-----|-------------|
| `/busco` | Page | Public | Yes | Demand posts listing with search/filters |
| `/busco/publicar` | Page | Required | No | Create demand post form |
| `/busco/[id]` | Page | Public | Yes | Demand post detail + offers |
| `/perfil/demandas` | Page | Required | No | User's demand posts dashboard |
| `/api/search-demands` | API Route | Public | — | Demand search endpoint |

### 7.2 Protected Routes (middleware.ts update)

Add to `PROTECTED_ROUTES` array:

```typescript
const PROTECTED_ROUTES = [
  '/profile',
  '/perfil',
  '/publicar',
  '/mensajes',
  '/busco/publicar',     // NEW: create demand post
  '/perfil/demandas',    // NEW: demand posts dashboard
]
```

### 7.3 Navigation Updates

```
Header navigation:
  [Inicio] [Buscar] [Busco ← NEW] [Publicar] [Mi Cuenta]
```

---

## 8. Security Architecture

### 8.1 Authentication & Authorization

| Operation | Auth Required | Authorization Rule |
|-----------|--------------|-------------------|
| View active demand posts | No | Public (RLS: status = 'active') |
| View own demand posts (any status) | Yes | RLS: auth.uid() = user_id |
| Create demand post | Yes | RLS: auth.uid() = user_id |
| Update own demand post | Yes | RLS: auth.uid() = user_id |
| Delete own demand post | Yes | RLS: auth.uid() = user_id |
| View offers on active demand posts | No (public) | RLS: demand_post is active AND expires_at > NOW() |
| View offers on own demand posts (any status) | Yes | RLS: auth.uid() = demand owner |
| Create offer | Yes | RLS: own product only |
| Delete own offer | Yes | RLS: auth.uid() = seller_id |

### 8.2 Input Sanitization

All user text inputs pass through:

1. **Zod schema validation** — length, type, format constraints
2. **`stripHtml()` transform** — removes HTML tags and stray angle brackets
3. **`.trim()`** — removes leading/trailing whitespace

Applied to: `title`, `description`, `message` (offer)

### 8.3 Rate Limiting

- **Demand creation**: Max 5 posts per user per 24 hours (application-level check)
- **Offer creation**: Constrained by UNIQUE(demand_post_id, product_id) — no duplicate offers
- **Self-offer prevention**: Application-level check (cannot offer to own demand)

### 8.4 Data Privacy

- Demand posts are public (active status) — buyers understand their request is visible
- Buyer's phone number is NOT displayed on the demand post (WhatsApp link uses profile phone)
- Offer messages are only visible to the demand post owner and the offer creator (RLS)
- Soft-deleted posts are hidden from all public views (RLS: status = 'active')

---

## 9. Search Architecture

### 9.1 Keyword Search

Reuses the same PostgreSQL full-text search configuration as product search:

```sql
-- Text search vector on demand posts
to_tsvector('spanish', demand_posts.title || ' ' || demand_posts.description)
@@
plainto_tsquery('spanish', :query)
```

Uses the existing Spanish dictionary with Bolivian synonym additions from M3.

### 9.2 Semantic Search

Same embedding model and distance function as product search:

- **Model**: `paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions)
- **Index**: HNSW with cosine distance on `demand_posts.embedding`
- **Query embedding**: Generated via `generate-embedding` Edge Function (Mode 2: direct text)

### 9.3 Hybrid Search (RRF)

Same Reciprocal Rank Fusion algorithm used for product search:

```
RRF_score(d) = Σ  1 / (k + rank_i(d))
```

Where `k = 60` and ranks come from keyword and semantic result sets.

### 9.4 Search RPC

```sql
CREATE OR REPLACE FUNCTION search_demands_hybrid(
  query_text TEXT,
  query_embedding vector(384) DEFAULT NULL,
  filter_category TEXT DEFAULT NULL,
  filter_department TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  page_size INT DEFAULT 12,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  location_department TEXT,
  location_city TEXT,
  price_min DECIMAL,
  price_max DECIMAL,
  status TEXT,
  offers_count INT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  rrf_score FLOAT
)
```

---

## 10. Embedding Pipeline

### 10.1 Demand Post Embedding Text

Constructed from demand post fields to maximize search relevance:

```typescript
const embeddingText = [
  `Busco: ${title}`,
  `Descripción: ${description}`,
  category ? `Categoría: ${categoryLabel}` : null,
  location_department ? `Ubicación: ${location_department}` : null,
].filter(Boolean).join('. ')
```

The "Busco:" prefix differentiates demand embeddings from product embeddings in the same vector space, though they use the same model.

### 10.2 Generation Flow

> **Decision (D2):** Embedding is generated via a **DB trigger** — same pattern as `products`. No client-side call needed.

```
INSERT INTO demand_posts (...)
  │
  └─ DB TRIGGER: trigger_demand_post_embedding
       │
       ├─ Builds text: "Busco: {title}. {description}. Categoría: {category}"
       │
       └─ pg_net.http_post(
            url  = supabase_url + '/functions/v1/generate-embedding',
            body = { type: 'DEMAND', record: { id, text } }
          )
               │
               └─ Edge Function handler (new DEMAND branch):
                    ├─ generateEmbedding(text) → Hugging Face API → 384-dim vector
                    └─ UPDATE demand_posts SET embedding = [...] WHERE id = record.id
```

**Edge Function change required:** Add `{ type: 'DEMAND', record: { id, text } }` handler to `supabase/functions/generate-embedding/index.ts`.

---

## 11. Performance Considerations

### 11.1 Query Optimization

| Query Pattern | Optimization |
|---------------|-------------|
| Active demand posts listing | Composite index on `(status, created_at DESC)` |
| Category + department filter | Individual indexes; PostgreSQL combines via bitmap scan |
| Offers for a demand post | Index on `demand_offers(demand_post_id)` |
| User's demand posts | Index on `demand_posts(user_id)` |
| Semantic search | HNSW index with cosine distance |
| Offers count | Denormalized column, no JOIN needed |

### 11.2 Frontend Performance

- **Demand post list**: Server-side rendered for first page; client-side pagination for subsequent
- **Product cards in offers**: Lazy loaded images via `next/image`
- **Offer modal**: Products fetched on modal open, not on page load
- **Search debounce**: 300ms debounce on search input

### 11.3 API Response Targets

| Endpoint | Target | Method |
|----------|--------|--------|
| GET /busco (no query) | < 200ms | Direct SELECT with indexes |
| GET /api/search-demands (keyword) | < 500ms | PostgreSQL FTS |
| GET /api/search-demands (semantic) | < 1s | Embedding generation + HNSW |
| POST demand_posts | < 500ms | INSERT (embedding async) |
| POST demand_offers | < 200ms | INSERT + trigger |

---

## 12. Scalability Considerations

### 12.1 Expected Scale (Year 1)

| Metric | Estimate |
|--------|----------|
| Demand posts created/month | 100-500 |
| Active demand posts at any time | 200-1,000 |
| Offers per demand post | 1-5 average |
| Total demand_offers rows | 1,000-5,000 |
| Embeddings stored | 500-2,000 vectors |

### 12.2 Scaling Triggers

| Threshold | Action |
|-----------|--------|
| > 10K active demand posts | Consider partitioning by status |
| > 50K embeddings | Evaluate IVFFlat index (faster build) vs HNSW (faster query) |
| > 100 offers/demand | Paginate offers on detail page |
| > 1M demand posts total | Archive expired/deleted posts to separate table |

### 12.3 Cost Impact

| Resource | Impact | Cost |
|----------|--------|------|
| PostgreSQL storage | +2 tables, minimal rows | $0 (within Supabase free tier) |
| pgvector storage | +384 dims per demand post | $0 (within 500MB limit) |
| Hugging Face API | +1 embedding per demand post | $0 (within 30K/month free tier) |
| Edge Function invocations | +1 per demand post creation | $0 (within 500K/month free tier) |

---

## 13. Migration Strategy

### 13.1 Migration Plan

Single migration file: `supabase/migrations/YYYYMMDD_create_demand_posts.sql`

**Contains:**
1. `demand_posts` table + constraints + indexes (scalar, composite, GIN FTS, HNSW)
2. `demand_offers` table + constraints + indexes
3. RLS policies for both tables (public offers on active posts)
4. `update_demand_offers_count()` trigger function (offers_count denormalization)
5. `update_demand_posts_search_vector()` trigger function (FTS, Spanish)
6. `trigger_demand_post_embedding()` trigger function (pg_net → Edge Function)
7. `updated_at` trigger (reuses existing function)
8. **No `expire_demand_posts()` or cron** — expiration is a TTL query filter

### 13.2 Rollback Plan

```sql
DROP TRIGGER IF EXISTS trg_demand_offers_count       ON demand_offers;
DROP TRIGGER IF EXISTS trg_demand_posts_search_vector ON demand_posts;
DROP TRIGGER IF EXISTS trg_demand_post_embedding      ON demand_posts;
DROP TRIGGER IF EXISTS set_demand_posts_updated_at    ON demand_posts;
DROP FUNCTION IF EXISTS update_demand_offers_count();
DROP FUNCTION IF EXISTS update_demand_posts_search_vector();
DROP FUNCTION IF EXISTS trigger_demand_post_embedding();
DROP TABLE IF EXISTS demand_offers;
DROP TABLE IF EXISTS demand_posts;
```

No existing tables are modified. Rollback is a clean DROP of new objects.

### 13.3 Data Seeding

For development/demo:

```sql
-- Seed 5 demand posts for testing
INSERT INTO demand_posts (user_id, title, description, category, location_department, location_city)
VALUES
  (:dev_user_id, 'Busco iPhone 13 128GB', 'Estoy buscando un iPhone 13 de 128GB o más, en buen estado, con batería arriba del 80%. Preferiblemente color negro.', 'electronics', 'Santa Cruz', 'Santa Cruz de la Sierra'),
  (:dev_user_id, 'Necesito sofá esquinero', 'Busco un sofá esquinero de 3 cuerpos, color gris o beige, en buen estado. Para departamento pequeño.', 'home', 'La Paz', 'La Paz'),
  (:dev_user_id, 'Busco bicicleta montañera', 'Necesito una bicicleta de montaña aro 29, marco de aluminio, cambios Shimano. Puede ser usada si está en buen estado.', 'sports', 'Cochabamba', 'Cochabamba'),
  (:dev_user_id, 'Necesito laptop para trabajo', 'Busco laptop con mínimo 16GB RAM, SSD 512GB, pantalla 14-15 pulgadas. Para uso de oficina y programación.', 'electronics', 'Santa Cruz', 'Santa Cruz de la Sierra'),
  (:dev_user_id, 'Busco material de construcción', 'Necesito 100 bolsas de cemento Viacha y 50 fierros de 12mm para construcción. Entrega en zona sur.', 'construction', 'La Paz', 'El Alto');
```
