# M4.7 Implementation Plan: Demand-Side Posting

**Estimated Duration:** 12-16 days  
**Prerequisites:** M1 (Auth) ✅, M2 (Products) ✅, M3 (Search) ✅, M4 (Semantic Search) ✅

---

## Phase 1: Database & Types (Day 1-2)

### 1.1 Migration: `demand_posts` Table

**File:** `supabase/migrations/YYYYMMDD_create_demand_posts.sql`

```sql
-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

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

-- Indexes
CREATE INDEX idx_demand_posts_user ON demand_posts(user_id);
CREATE INDEX idx_demand_posts_category ON demand_posts(category);
CREATE INDEX idx_demand_posts_status ON demand_posts(status);
CREATE INDEX idx_demand_posts_location ON demand_posts(location_department);
CREATE INDEX idx_demand_posts_created ON demand_posts(created_at DESC);
CREATE INDEX idx_demand_posts_embedding ON demand_posts
  USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE demand_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active demand posts"
  ON demand_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view their own demand posts (any status)"
  ON demand_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create demand posts"
  ON demand_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their demand posts"
  ON demand_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their demand posts"
  ON demand_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_demand_posts_updated_at
  BEFORE UPDATE ON demand_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Migration: `demand_offers` Table

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

-- RLS
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

### 1.3 Offers Count Trigger

```sql
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

### 1.4 Expiration Function

```sql
-- Cron-friendly function to expire old demand posts
CREATE OR REPLACE FUNCTION expire_demand_posts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE demand_posts
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
```

> **Note:** Schedule via Supabase pg_cron or Edge Function cron. Run daily.

### 1.5 TypeScript Types

**File:** `types/database.ts` — add to existing generated types:

```typescript
export interface DemandPost {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  location_department: string
  location_city: string
  price_min: number | null
  price_max: number | null
  status: 'active' | 'found' | 'expired' | 'deleted'
  offers_count: number
  embedding: number[] | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface DemandOffer {
  id: string
  demand_post_id: string
  product_id: string
  seller_id: string
  message: string | null
  created_at: string
}
```

### 1.6 Validation Schema

**File:** `lib/validations/demand.ts`

```typescript
import { z } from 'zod'
import { stripHtml } from './sanitize'
import { PRODUCT_CATEGORIES, BOLIVIA_DEPARTMENTS } from './product'

export const demandPostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .trim()
    .transform(stripHtml),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .transform(stripHtml),

  category: z.enum(PRODUCT_CATEGORIES, {
    message: 'Select a category',
  }),

  subcategory: z.string().optional(),

  location_department: z.enum(BOLIVIA_DEPARTMENTS, {
    message: 'Select a department',
  }),

  location_city: z
    .string()
    .min(1, 'City is required')
    .max(100)
    .trim(),

  price_min: z
    .number()
    .min(0, 'Minimum price must be >= 0')
    .optional(),

  price_max: z
    .number()
    .min(0, 'Maximum price must be >= 0')
    .optional(),
}).refine(
  (data) => {
    if (data.price_min != null && data.price_max != null) {
      return data.price_max >= data.price_min
    }
    return true
  },
  { message: 'Maximum price must be >= minimum price', path: ['price_max'] }
)

export type DemandPostInput = z.infer<typeof demandPostSchema>

export const demandOfferSchema = z.object({
  demand_post_id: z.string().uuid(),
  product_id: z.string().uuid(),
  message: z
    .string()
    .max(500, 'Message cannot exceed 500 characters')
    .trim()
    .transform(stripHtml)
    .optional(),
})

export type DemandOfferInput = z.infer<typeof demandOfferSchema>
```

---

## Phase 2: Create Demand Post (Day 3-4)

### 2.1 Create Page

**File:** `app/busco/publicar/page.tsx`

- Auth guard: redirect to `/login?redirect=/busco/publicar` if not authenticated
- Form fields: title, description, category selector, location (department + city), optional price range (min/max)
- Reuse `PRODUCT_CATEGORIES`, `CATEGORY_LABELS`, `BOLIVIA_DEPARTMENTS` from `lib/validations/product.ts`
- On submit: validate with `demandPostSchema`, insert into `demand_posts`, call `generate-embedding` Edge Function
- Success: redirect to `/busco/[id]`
- Rate limit: check user's demand posts count in last 24h (max 5)

### 2.2 Embedding Generation

Extend the existing `generate-embedding` Edge Function to accept demand posts:

```typescript
// Add a new mode to the Edge Function body handler:
// { type: 'DEMAND', record: { id, title, description, category, subcategory } }
```

Or call the existing "direct text" mode from the client after insert:

```typescript
const text = `Busco: ${title}. ${description}. Categoría: ${category}`
const { data } = await supabase.functions.invoke('generate-embedding', {
  body: { text }
})
// Then update demand_posts.embedding with the result
```

---

## Phase 3: List & Search (Day 5-7)

### 3.1 Demand Posts List Page

**File:** `app/busco/page.tsx`

- Paginated grid of active demand posts (12 per page)
- `DemandPostCard` component: title, description snippet (first 120 chars), category badge, location, relative date, offers count badge
- Filter bar: category dropdown, department dropdown, sort (newest / most offers / expiring soon)
- Search input with keyword search (PostgreSQL full-text) and semantic search (embedding similarity)
- Empty state: "No demands yet. Be the first to post!"
- CTA button: "Publicar lo que busco"

### 3.2 Search API

**File:** `app/api/search-demands/route.ts`

- Accept query params: `q` (keyword), `category`, `department`, `sort`, `page`
- Keyword: `to_tsvector('spanish', title || ' ' || description) @@ plainto_tsquery('spanish', q)`
- Semantic: same hybrid approach as product search (RRF fusion)
- Return paginated results with total count

---

## Phase 4: Detail & Offer Flow (Day 8-10)

### 4.1 Demand Post Detail Page

**File:** `app/busco/[id]/page.tsx`

- Full demand post info: title, description, category, location, price range, date, status
- Buyer info sidebar: avatar, name, verification badge, WhatsApp contact button
- Offers section: list of `ProductCard` components for offered products
- "Offer your product" button (visible to authenticated sellers, hidden for post owner)
- "Mark as found" button (visible only to post owner)
- Meta tags for SEO

### 4.2 Offer Product Modal

**File:** `components/demand/OfferProductModal.tsx`

- Fetch seller's published products
- Grid of selectable product cards
- Optional message input
- Submit: insert into `demand_offers`
- Validation: cannot offer to own demand post, cannot offer same product twice

---

## Phase 5: Dashboard & CTA Integration (Day 11-12)

### 5.1 User Demands Dashboard

**File:** `app/perfil/demandas/page.tsx`

- Tabs: Active / Found / Expired
- Actions per post: View, Edit, Mark as Found, Renew (expired), Delete
- Renew: reset `expires_at` to NOW() + 30 days, set status back to 'active'

### 5.2 CTA Integration

- **Search results page** (`app/buscar/page.tsx`): Add banner at bottom of results: "¿No encontraste lo que buscas? [Publica tu solicitud](/busco/publicar)"
- **Empty search results**: Replace generic empty state with demand post CTA
- **Header navigation**: Add "Busco" link between "Buscar" and "Publicar"

---

## Phase 6: Testing & Polish (Day 13-16)

### 6.1 E2E Tests

**Directory:** `tests/e2e/demand-side/`

| Test File | Coverage |
|-----------|----------|
| `create-demand.spec.ts` | Form validation, successful creation, auth guard, rate limit |
| `search-demands.spec.ts` | Keyword search, filters, sort, pagination, empty state |
| `offer-flow.spec.ts` | Link product, message, duplicate prevention, view offers |
| `demand-lifecycle.spec.ts` | Mark as found, renew expired, delete |
| `demand-accessibility.spec.ts` | WCAG 2.2 AA, touch targets, mobile viewport |

### 6.2 Accessibility Checklist

- [ ] All form inputs have labels
- [ ] Error messages linked with `aria-describedby`
- [ ] Keyboard navigation works on all interactive elements
- [ ] Touch targets >= 44px on mobile
- [ ] Color contrast ratios meet AA
- [ ] Screen reader announces status changes (found, expired)
- [ ] No horizontal scroll at 375px viewport

### 6.3 Performance

- [ ] Demand post list: lazy load cards below fold
- [ ] Images in offer cards: `next/image` with proper sizing
- [ ] Search API: response < 500ms for keyword, < 1s for semantic
- [ ] Pagination: no full-table scans

---

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_create_demand_posts.sql` | Tables, indexes, RLS, triggers |
| `lib/validations/demand.ts` | Zod schemas for demand posts and offers |
| `app/busco/page.tsx` | Demand posts list/search |
| `app/busco/publicar/page.tsx` | Create demand post form |
| `app/busco/[id]/page.tsx` | Demand post detail + offers |
| `app/perfil/demandas/page.tsx` | User's demand posts dashboard |
| `app/api/search-demands/route.ts` | Search API for demand posts |
| `components/demand/DemandPostCard.tsx` | Card component for list view |
| `components/demand/DemandPostForm.tsx` | Create/edit form component |
| `components/demand/DemandPostDetail.tsx` | Detail view component |
| `components/demand/DemandPostFilters.tsx` | Filter bar component |
| `components/demand/DemandStatusBadge.tsx` | Status badge (active/found/expired) |
| `components/demand/OfferProductModal.tsx` | Modal to select product and offer |
| `tests/e2e/demand-side/*.spec.ts` | E2E tests (5 files) |

### Modified Files

| File | Changes |
|------|---------|
| `types/database.ts` | Add DemandPost, DemandOffer types |
| `app/buscar/page.tsx` | Add "¿No encontraste?" CTA |
| `components/layout/Header.tsx` (or equivalent) | Add "Busco" nav link |
| `middleware.ts` | Add `/busco/publicar` and `/perfil/demandas` to protected routes |
| `supabase/functions/generate-embedding/index.ts` | Support demand post embedding (optional) |
