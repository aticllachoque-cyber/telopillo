# Milestone 4.7: Demand-Side Posting — "Busco/Necesito"

**Priority:** HIGH (Next implementation milestone)  
**Duration:** 12-16 days (~2.5-3 weeks)  
**Dependencies:** M1 (Auth) ✅, M2 (Products) ✅, M3 (Search) ✅, M4 (Semantic Search) ✅  
**Status:** Not Started  
**PRD Reference:** Section 7.2 ("Publicaciones de Busco"), Timeline Fase 3 (Month 8-12)  
**Note:** Promoted from Phase 2 to next implementation phase. Contact flow uses WhatsApp (no M5 chat dependency for MVP). Moderation handled via basic report button (no M9 dependency for MVP).

---

## Documentation

- **[PRD](./PRD.md)** — Complete requirements, user stories, UX specs, and acceptance criteria
- **[Architecture](./ARCHITECTURE.md)** — Technical design, data model, search integration, security
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** — Phased implementation guide with code
- **[Progress](./PROGRESS.md)** — Progress report and task tracking

---

## Overview

Enable **buyer-initiated demand posts** — a reverse marketplace flow where buyers publish what they need and sellers/businesses respond with offers. This complements the existing supply-side model (seller publishes -> buyer finds) with a demand-side model (buyer requests -> seller offers).

This is a **key differentiator** for Telopillo.bo. Neither Mercado Libre, OLX, nor Facebook Marketplace offer this in Bolivia, yet the behavior already exists informally in WhatsApp and Facebook groups ("Busco iPhone 13, alguien vende?").

---

## Goals

1. Buyers can create "Busco" posts describing what they need
2. Sellers can browse and search demand posts filtered by category and location
3. Sellers can link one of their existing products as an offer to a demand post
4. Buyers see offers on their posts and contact sellers via WhatsApp (or chat when M5 is ready)
5. Demand posts expire after 30 days (renewable)
6. Buyers can mark posts as "Encontrado" (found) to stop new offers
7. Reuse existing infrastructure: categories, locations, semantic search, embeddings
8. No new monetization gating — all users can post demands and offer products

---

## User Flows

### Flow A: Buyer Posts a Demand

```
Buyer searches for product → No results / not what they want
  → CTA: "¿No encontraste? Publica lo que buscas"
  → Buyer fills form: title, description, category, location, price range (optional)
  → Demand post created (status: active)
  → Visible in /busco listing and searchable
  → Buyer receives offers from sellers
  → Buyer contacts preferred seller via WhatsApp
  → Buyer marks post as "Encontrado"
```

### Flow B: Seller Responds to Demand

```
Seller browses /busco → Filters by category, location
  → Finds relevant demand post
  → Links one of their products as an offer
  → Optional: adds a short message
  → Buyer is notified of new offer
  → Buyer reviews offer and contacts seller
```

---

## User Stories

### Buyer (Demand Poster)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| B1 | As a buyer, I want to post what I need so sellers can offer me products | Can create a "Busco" post with title, description, category, location, optional price range |
| B2 | As a buyer, I want to see offers from sellers on my post | Offer list on demand post detail page shows linked products |
| B3 | As a buyer, I want to contact sellers who offered | WhatsApp contact button on each offer |
| B4 | As a buyer, I want to close my post when I find what I need | Can mark post as "Encontrado" to stop new offers |
| B5 | As a buyer, I want to browse existing demand posts before creating a duplicate | Search/browse demand posts at `/busco` |

### Seller (Offer Provider)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| S1 | As a seller, I want to browse demand posts in my categories | Can filter by category, location, date |
| S2 | As a seller, I want to offer my product to a demand post | Can link one of my published products with optional message |
| S3 | As a seller, I want to be notified when someone posts what I might have | Notification for relevant new demand posts (future: M5 chat) |
| S4 | As a seller, I want to contact the buyer directly | WhatsApp button on demand post |
| S5 | As a business, I want to see demand in my area | Can filter demand posts by department/city |

---

## Database Schema

### New Table: `demand_posts`

```sql
CREATE TABLE demand_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  location_department TEXT NOT NULL,
  location_city TEXT NOT NULL,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'found', 'expired', 'deleted')),
  offers_count INTEGER NOT NULL DEFAULT 0,
  embedding vector(384),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT demand_posts_title_length
    CHECK (char_length(title) BETWEEN 5 AND 100),
  CONSTRAINT demand_posts_description_length
    CHECK (char_length(description) BETWEEN 20 AND 1000)
);

CREATE INDEX idx_demand_posts_user ON demand_posts(user_id);
CREATE INDEX idx_demand_posts_category ON demand_posts(category);
CREATE INDEX idx_demand_posts_status ON demand_posts(status);
CREATE INDEX idx_demand_posts_location ON demand_posts(location_department);
CREATE INDEX idx_demand_posts_created ON demand_posts(created_at DESC);
CREATE INDEX idx_demand_posts_embedding ON demand_posts
  USING hnsw (embedding vector_cosine_ops);
```

### New Table: `demand_offers`

```sql
CREATE TABLE demand_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_post_id UUID NOT NULL REFERENCES demand_posts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(demand_post_id, product_id)
);

CREATE INDEX idx_demand_offers_post ON demand_offers(demand_post_id);
CREATE INDEX idx_demand_offers_product ON demand_offers(product_id);
CREATE INDEX idx_demand_offers_seller ON demand_offers(seller_id);
```

### RLS Policies

```sql
-- demand_posts: anyone can read active posts
ALTER TABLE demand_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active demand posts"
  ON demand_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create demand posts"
  ON demand_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their demand posts"
  ON demand_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their demand posts"
  ON demand_posts FOR DELETE
  USING (auth.uid() = user_id);

-- demand_offers: visible to post owner and offer creator
ALTER TABLE demand_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post owner and offer creator can view offers"
  ON demand_offers FOR SELECT
  USING (
    auth.uid() = seller_id
    OR auth.uid() = (SELECT user_id FROM demand_posts WHERE id = demand_post_id)
  );

CREATE POLICY "Authenticated users can create offers for their products"
  ON demand_offers FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
  );

CREATE POLICY "Offer creators can delete their offers"
  ON demand_offers FOR DELETE
  USING (auth.uid() = seller_id);
```

### Auto-Increment Trigger

```sql
-- Auto-update offers_count on demand_posts
CREATE OR REPLACE FUNCTION update_demand_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE demand_posts SET offers_count = offers_count + 1
    WHERE id = NEW.demand_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE demand_posts SET offers_count = offers_count - 1
    WHERE id = OLD.demand_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demand_offers_count
  AFTER INSERT OR DELETE ON demand_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_demand_offers_count();
```

---

## Implementation Phases

### Phase 1: Database & Types (Day 1-2)

- [ ] Migration: create `demand_posts` table with indexes
- [ ] Migration: create `demand_offers` table with indexes
- [ ] RLS policies for both tables
- [ ] Auto-increment trigger for `offers_count`
- [ ] Expiration: scheduled function or cron to mark expired posts
- [ ] Update `types/database.ts` with new types
- [ ] Zod validation schemas (`lib/validations/demand.ts`)
- [ ] `stripHtml` transform on title and description

### Phase 2: Create Demand Post (Day 3-4)

- [ ] `/busco/publicar` page — form with title, description, category, location, price range
- [ ] Reuse existing category/location constants from `lib/validations/product.ts`
- [ ] Auth guard: require login to post
- [ ] Generate embedding on creation (reuse `generate-embedding` Edge Function)
- [ ] Success redirect to demand post detail
- [ ] Mobile-responsive form

### Phase 3: List & Search Demand Posts (Day 5-7)

- [ ] `/busco` page — paginated list of active demand posts
- [ ] `DemandPostCard` component (title, description snippet, category badge, location, date, offers count)
- [ ] Filters: category, location/department, date range
- [ ] Keyword search (reuse PostgreSQL full-text search)
- [ ] Semantic search (reuse hybrid search with embedding)
- [ ] Sort: newest, most offers, expiring soon
- [ ] Empty state with CTA to create first demand post
- [ ] Mobile-responsive grid

### Phase 4: Demand Post Detail & Offer Flow (Day 8-10)

- [ ] `/busco/[id]` page — full demand post detail
- [ ] Buyer info section (avatar, name, badge, WhatsApp contact)
- [ ] Offers list: product cards linked to this demand
- [ ] "Offer your product" button for sellers (opens modal to select from their products)
- [ ] `OfferProductModal` component — select product + optional message
- [ ] "Mark as found" button for post owner
- [ ] Offer count badge
- [ ] SEO: meta tags for demand posts
- [ ] Mobile-responsive layout

### Phase 5: User Dashboard & CTA Integration (Day 11-12)

- [ ] `/perfil/demandas` — user's demand posts (active, found, expired)
- [ ] Status management: renew expired posts, delete posts
- [ ] CTA on search results page: "¿No encontraste? Publica lo que buscas"
- [ ] CTA on empty search results
- [ ] Navigation: add "Busco" link to main nav / header
- [ ] Notification stub: prepare for email/push notifications (full implementation with M5)

### Phase 6: Testing & Polish (Day 13-16)

- [ ] E2E tests: create demand post
- [ ] E2E tests: search/filter demand posts
- [ ] E2E tests: offer product to demand post
- [ ] E2E tests: mark as found, renew, delete
- [ ] E2E tests: auth guards (login required to post/offer)
- [ ] Accessibility: WCAG 2.2 AA compliance
- [ ] Mobile responsiveness testing (375px viewport)
- [ ] Touch targets >= 44px
- [ ] Performance: lazy loading, pagination

---

## Integration with Existing Features

| Existing Feature | Integration |
|-----------------|-------------|
| **Categories** | Same `PRODUCT_CATEGORIES` taxonomy |
| **Locations** | Same `BOLIVIA_DEPARTMENTS` and city fields |
| **Semantic Search** | Same `generate-embedding` Edge Function for demand post embeddings |
| **Keyword Search** | PostgreSQL full-text search on demand_posts.title + description |
| **WhatsApp Contact** | Buyer's phone from profile for "Contactar comprador" |
| **Auth & Profiles** | Demand posts linked to profiles, badges shown |
| **Product Cards** | Reuse `ProductCard` in offer list |
| **Moderation (M9)** | Report flow for demand posts and offers |
| **Chat (M5)** | When available, offer in-app contact from demand posts |
| **Ratings (M6)** | Rate seller after transaction from demand flow |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Spam demand posts | High | Medium | Rate limit: max 5 posts/day per user; min account age |
| Low seller engagement | Medium | High | Seller notifications, homepage visibility, email digest |
| Scam offers | Medium | High | Reuse M9 moderation + report flow |
| Duplicate demand posts | Medium | Low | "Similar demands" check before creation |
| Empty state (no demands) | High | Medium | Seed content, marketing, clear CTA placement |
| Embedding cost increase | Low | Low | One embedding per demand post; within HF free limits |

---

## Pages & Components

### New Pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/busco` | List/search demand posts | Public |
| `/busco/publicar` | Create demand post form | Required |
| `/busco/[id]` | Demand post detail + offers | Public (offer requires auth) |
| `/perfil/demandas` | User's demand posts dashboard | Required |

### New Components

| Component | Purpose |
|-----------|---------|
| `DemandPostCard` | Card for list view (title, snippet, category, location, offers count) |
| `DemandPostForm` | Create/edit demand post form |
| `DemandPostDetail` | Detail view with buyer info and offers |
| `DemandPostFilters` | Category, location, date filters |
| `OfferProductModal` | Modal to select product and send offer |
| `DemandStatusBadge` | Active / Found / Expired badge |

### Modified Components

| Component | Changes |
|-----------|---------|
| `Header/Navigation` | Add "Busco" link |
| Search results page | Add CTA "¿No encontraste?" |
| Empty search state | Add CTA to create demand post |

---

## MVP vs Full Vision

### MVP (This Milestone)

- Create, list, search, filter demand posts
- Offer flow: link product to demand
- WhatsApp contact for buyer
- Expiration (30 days) with manual renewal
- Basic moderation (report button)

### Full Vision (Future Enhancements)

- Email/push notifications for new offers and matching demands
- In-app chat from demand post (after M5)
- "Similar demands" recommendations
- Demand alerts for sellers (saved category/location)
- Analytics: demand trends by category and location
- Bump/promote demand posts (monetization)
- Auto-suggest products to demand posts based on embedding similarity

---

## Success Criteria

- [ ] Buyers can create demand posts with title, description, category, location
- [ ] Demand posts are searchable by keyword and semantic search
- [ ] Sellers can browse/filter demand posts by category and location
- [ ] Sellers can link their products as offers to demand posts
- [ ] Buyers see offers and can contact sellers via WhatsApp
- [ ] Buyers can mark posts as "Encontrado" to close them
- [ ] Posts auto-expire after 30 days
- [ ] "¿No encontraste?" CTA appears on search results
- [ ] Mobile-responsive for all new pages (375px+)
- [ ] WCAG 2.2 AA compliance
- [ ] E2E test coverage for all user flows
