# M2: Product Listings — Technical Architecture

**Version:** 1.0  
**Date:** February 13, 2026  
**Author:** Alcides Cardenas  
**Status:** Design Document  
**Milestone:** M2 Product Listings

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Database Architecture](#3-database-architecture)
4. [Application Architecture](#4-application-architecture)
5. [API Design](#5-api-design)
6. [Image Architecture](#6-image-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Performance Architecture](#8-performance-architecture)
9. [Type System](#9-type-system)
10. [Migration Scripts](#10-migration-scripts)
11. [Code Examples](#11-code-examples)

---

## 1. Executive Summary

### 1.1 Overview

M2 implements the core product listing functionality for Telopillo.bo—the heart of the marketplace. Users create, view, edit, and manage product listings with multi-image upload, full validation, and mobile-first design. The architecture follows established M1 patterns: Supabase BaaS, RLS policies, Zod + React Hook Form, and serverless-first principles.

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data storage** | PostgreSQL + Supabase Storage | Serverless, RLS, auto-generated API, $0 MVP |
| **Image upload** | Client-side compression → Storage → DB | No backend server; upload before product INSERT |
| **Form validation** | Zod + React Hook Form | M1 pattern; type-safe, accessible |
| **Auth** | Supabase Auth (JWT) | M1 established; RLS uses auth.uid() |
| **Image format** | WebP (browser-image-compression) | 50% smaller than JPEG; mobile-first |
| **Storage path** | `product-images/{userId}/{timestamp}-{i}.webp` | No productId on create; simplifies flow |
| **Deferred to M3+** | search_vector, embedding, location_coordinates | MVP scope; add in Search/Maps milestones |

### 1.3 Scope Summary

- **In scope:** Products CRUD, 1-5 images, 8 categories, RLS, location (department/city), status (active/sold/inactive/deleted)
- **Out of scope (M2):** Search, embeddings, geolocation, favorites, chat

---

## 2. System Architecture Diagram

### 2.1 High-Level M2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    M2 PRODUCT LISTINGS FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                                           │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /publicar    │  │ /productos/  │  │ /perfil/     │  │ /productos/  │  │
│  │ (Create)     │  │ [id]        │  │ mis-productos│  │ [id]/editar  │  │
│  │              │  │ (Detail)     │  │ (My List)    │  │ (Edit)       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │                  │         │
│         │ ProductForm       │ Server fetch     │ Client fetch     │ ProductForm│
│         │ ImageUpload       │ ProductGallery   │ ProductGrid      │ + actions│
│         │ LocationSelector  │ SellerCard       │ ProductCard      │          │
└─────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │                  │
          │ 1. Upload       │ 2. GET product    │ 3. GET products   │ 4. PATCH
          │    images       │    by id         │    by user_id     │    product
          │ 2. INSERT       │ 3. Increment     │    filter/sort    │ 5. Actions
          │    product      │    views_count   │    paginate       │    (sold,
          │                 │                  │                  │    delete)
          ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPABASE (BaaS)                                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Storage: product-images                                             │   │
│  │  Path: {userId}/{timestamp}-{index}.webp                            │   │
│  │  RLS: INSERT/UPDATE/DELETE for path prefix = auth.uid()              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL: products                                                 │   │
│  │  RLS: SELECT (active OR owner), INSERT/UPDATE/DELETE (owner only)     │   │
│  │  Triggers: update_updated_at                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  PostgREST API (auto-generated) + Auth (JWT)                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Creation Flow (Detailed)

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Fill form (title, description, category, price, condition, location)
       │ 2. Select 1-5 images (drag-drop or file picker)
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  ProductForm (Client Component)                     │
│                                                     │
│  3. validateImageFile() × N images                  │
│  4. compressImage() × N (WebP, max 1920×1080)      │
│  5. Upload to Supabase Storage                     │
│     product-images/{userId}/{timestamp}-{i}.webp    │
│  6. Get public URLs from storage                    │
└──────┬──────────────────────────────────────────────┘
       │
       │ 7. onSubmit: { ...formData, images: urls[] }
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Supabase Client                                    │
│                                                     │
│  8. supabase.from('products').insert({              │
│       user_id: auth.uid(),                          │
│       title, description, category, subcategory,    │
│       price, condition, location, images            │
│     })                                              │
└──────┬──────────────────────────────────────────────┘
       │
       │ 9. PostgREST validates JWT, checks RLS
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  PostgreSQL                                         │
│                                                     │
│  10. INSERT products                                │
│  11. Trigger: update_updated_at                     │
│  12. Return inserted row (id, created_at)          │
└──────┬──────────────────────────────────────────────┘
       │
       │ 13. Redirect to /productos/[id]
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Product Detail Page                                │
└─────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture

### 3.1 Products Table Schema

```sql
-- =============================================================================
-- M2 Phase 1: Products table
-- =============================================================================
-- Products store product listings. user_id references profiles(id) which
-- equals auth.users(id). RLS uses auth.uid() for ownership checks.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  -- Primary key (gen_random_uuid built-in PostgreSQL 13+)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (profiles.id = auth.users.id)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Pricing (Bolivian Boliviano)
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'BOB' CHECK (currency = 'BOB'),

  -- Condition: new, used_like_new, used_good, used_fair
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair')),

  -- Location (department + city from LocationSelector)
  location_department TEXT NOT NULL,
  location_city TEXT NOT NULL,

  -- Images: array of public URLs from Supabase Storage
  images TEXT[] NOT NULL DEFAULT '{}',

  -- Status: active (visible), sold, inactive (hidden), deleted (soft delete)
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'sold', 'inactive', 'deleted')
  ),

  -- Metrics (denormalized for performance; can be updated by triggers later)
  views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  favorites_count INTEGER NOT NULL DEFAULT 0 CHECK (favorites_count >= 0),
  contacts_count INTEGER NOT NULL DEFAULT 0 CHECK (contacts_count >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),

  -- Constraints (1-5 images; empty array fails)
  CONSTRAINT products_images_count CHECK (
    array_length(images, 1) >= 1 AND array_length(images, 1) <= 5
  ),
  CONSTRAINT products_title_length CHECK (char_length(title) BETWEEN 10 AND 100),
  CONSTRAINT products_description_length CHECK (char_length(description) BETWEEN 50 AND 5000)
);

-- Add comment for documentation
COMMENT ON TABLE public.products IS 'Product listings for Telopillo.bo marketplace. M2 scope.';
COMMENT ON COLUMN public.products.images IS 'Array of public URLs from product-images bucket. 1-5 images.';
COMMENT ON COLUMN public.products.expires_at IS 'Auto-expire for cleanup. M2: no trigger; M9+ adds cron job.';
```

### 3.2 Index Strategy

```sql
-- =============================================================================
-- Indexes: Performance vs storage tradeoff
-- =============================================================================
-- M2 queries: by user_id (my products), by id (detail), by category,
-- by status, by created_at (sort), by price (range filter).
-- Defer: GIN on search_vector, GIST on location (M3, M7).
-- =============================================================================

-- User's products (my products page, filter)
CREATE INDEX idx_products_user_id ON public.products(user_id);

-- Category filter (browse by category - M3)
CREATE INDEX idx_products_category ON public.products(category);

-- Status filter (active products visible, owner sees all)
CREATE INDEX idx_products_status ON public.products(status);

-- Sort: newest first (default)
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- Price range filter (M3 search)
CREATE INDEX idx_products_price ON public.products(price);

-- Location filters (M3 search by department/city)
CREATE INDEX idx_products_location ON public.products(location_department, location_city);

-- Composite: active products by category (common browse query)
CREATE INDEX idx_products_status_category ON public.products(status, category)
  WHERE status = 'active';
```

### 3.3 RLS Policies (Detailed)

```sql
-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- SELECT: Anyone can view active products; owners can view their own (any status)
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  USING (
    status = 'active'
    OR user_id = auth.uid()
  );

-- INSERT: Authenticated users can insert; user_id must match auth.uid()
CREATE POLICY "products_insert_policy"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owner can update
CREATE POLICY "products_update_policy"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only owner can delete (hard delete)
CREATE POLICY "products_delete_policy"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### 3.4 Triggers

```sql
-- =============================================================================
-- Triggers (reuse update_updated_at from M1)
-- =============================================================================

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 3.5 Storage Bucket Configuration

```sql
-- =============================================================================
-- M2 Phase 1: product-images storage bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload/update/delete only in their own folder
DROP POLICY IF EXISTS "product_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_read_policy" ON storage.objects;

CREATE POLICY "product_images_upload_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "product_images_read_policy"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
```

### 3.6 Grants

```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.products TO postgres, service_role;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
```

---

## 4. Application Architecture

### 4.1 File Structure

```
app/
├── publicar/
│   └── page.tsx                 # Product creation (auth required)
├── productos/
│   └── [id]/
│       ├── page.tsx             # Product detail (public)
│       └── editar/
│           └── page.tsx         # Product edit (owner only)
└── perfil/
    └── mis-productos/
        └── page.tsx             # My products (auth required)

components/
├── products/
│   ├── ImageUpload.tsx          # Multi-image upload, drag-drop, reorder
│   ├── ProductForm.tsx         # Create/edit form (shared)
│   ├── ProductGallery.tsx      # Detail page image gallery
│   ├── ProductCard.tsx         # Card for grid/list
│   ├── ProductGrid.tsx         # Responsive grid layout
│   ├── ProductActions.tsx      # Mark sold, inactive, delete
│   └── SellerCard.tsx          # Seller info on detail page
└── profile/
    └── LocationSelector.tsx     # Reuse from M1

lib/
├── validations/
│   └── product.ts               # productSchema (Zod)
├── data/
│   └── categories.ts            # 8 categories + subcategories
├── utils/
│   └── image.ts                 # validateImageFile, compressImage
└── supabase/
    ├── client.ts
    └── server.ts

types/
└── database.ts                  # Generated from Supabase (optional)
```

### 4.2 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGES                                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  /publicar/page.tsx                                                          │
│  └── ProductForm                                                             │
│      ├── Input (title, description, price)                                   │
│      ├── Select (category, subcategory)                                      │
│      ├── RadioGroup (condition)                                              │
│      ├── LocationSelector (M1)                                               │
│      └── ImageUpload                                                         │
│                                                                             │
│  /productos/[id]/page.tsx (Server Component)                                 │
│  ├── ProductGallery                                                          │
│  │   └── Image (Next.js, lazy)                                              │
│  ├── Product info (title, price, condition, description)                    │
│  └── SellerCard                                                             │
│      └── Avatar, name, location, Contact button                               │
│                                                                             │
│  /perfil/mis-productos/page.tsx                                              │
│  ├── ProductGrid                                                             │
│  │   └── ProductCard[] (× N)                                                 │
│  │       ├── Image, title, price, status badge                               │
│  │       └── ProductActions (edit, sold, delete)                             │
│  └── Filters (status, sort), Pagination                                      │
│                                                                             │
│  /productos/[id]/editar/page.tsx                                             │
│  └── ProductForm (defaultValues from product)                                │
│      └── ImageUpload (existing + new)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Data Flow (Client vs Server)

| Page | Component Type | Data Fetching | Rationale |
|------|----------------|---------------|-----------|
| `/publicar` | Client | Client (auth check) | Form requires interactivity; redirect if not auth |
| `/productos/[id]` | Server | Server (fetch product) | SEO, fast initial load; views_count on client |
| `/productos/[id]/editar` | Client | Client (fetch + ownership check) | Form; 403 if not owner |
| `/perfil/mis-productos` | Client | Client (fetch + filters) | Filters, sort, pagination; auth required |

### 4.4 State Management Approach

- **No global state:** No React Context, Zustand, or Redux for M2
- **Local state:** React useState for form, filters, loading
- **Server state:** Direct Supabase queries; no React Query for MVP
- **Form state:** React Hook Form (controlled, with Zod resolver)

### 4.5 Error Handling Strategy

```typescript
// Pattern: try/catch + error state + user feedback
const [error, setError] = useState<string | null>(null)

try {
  const { error } = await supabase.from('products').insert(data)
  if (error) throw error
  router.push(`/productos/${data.id}`)
} catch (err) {
  setError(err instanceof Error ? err.message : 'Error al guardar')
} finally {
  setIsSubmitting(false)
}

// UI: role="alert" for error messages (aria-live)
{error && <p role="alert" className="text-destructive">{error}</p>}
```

### 4.6 Loading States Strategy

- **Form submit:** Loading spinner on button (disabled)
- **Image upload:** Per-image progress or global "Subiendo imágenes..."
- **Page load:** Skeleton for ProductGrid; spinner for ProductForm
- **Product detail:** Suspense boundary or skeleton for gallery + info

---

## 5. API Design

### 5.1 Supabase Queries (All Operations)

| Operation | Query | Auth | RLS |
|-----------|-------|------|-----|
| **Create product** | `INSERT` | Required | user_id = auth.uid() |
| **Get product by ID** | `SELECT` single | Optional | status=active OR owner |
| **Get user's products** | `SELECT` filtered | Required | Owner sees all |
| **Update product** | `PATCH` | Required | Owner only |
| **Delete product** | `DELETE` | Required | Owner only |
| **Increment views** | `PATCH` views_count | Optional | Owner or status=active |

### 5.2 Query Definitions

```typescript
// Create product
const { data, error } = await supabase
  .from('products')
  .insert({
    user_id: userId,
    title,
    description,
    category,
    subcategory: subcategory || null,
    price,
    condition,
    location_department,
    location_city,
    images,
  })
  .select('id')
  .single()

// Get product by ID (with seller profile)
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    profiles:user_id (
      id,
      full_name,
      avatar_url,
      location_city,
      location_department
    )
  `)
  .eq('id', productId)
  .single()

// Get user's products (paginated)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('user_id', userId)
  .eq('status', statusFilter)  // 'active' | 'sold' | 'inactive' | 'all'
  .order(sortColumn, { ascending: sortAsc })
  .range(offset, offset + limit - 1)

// Update product
const { error } = await supabase
  .from('products')
  .update({ title, description, ... })
  .eq('id', productId)
  .eq('user_id', userId)

// Update status (mark sold, inactive)
const { error } = await supabase
  .from('products')
  .update({ status: 'sold' })
  .eq('id', productId)
  .eq('user_id', userId)

// Increment views_count
const { error } = await supabase.rpc('increment_product_views', { product_id: productId })
// Or: raw UPDATE with views_count + 1 (requires RPC or raw SQL)
```

### 5.3 Server Actions vs Client Queries

| Use Case | Approach | Rationale |
|----------|----------|-----------|
| **Create product** | Client (supabase client) | Form submit; need auth.uid() from client |
| **Fetch product detail** | Server (createClient from server) | SEO, initial load |
| **Fetch my products** | Client | Filters, sort, pagination; auth required |
| **Update product** | Client | Form submit; ownership check |
| **Increment views** | Server Action or client | Avoid double-count; use server action |

### 5.4 Optimistic Updates (M2)

- **Not implemented:** M2 keeps it simple; full refresh after update
- **Future:** Mark sold → optimistic update in ProductGrid; revert on error

### 5.5 Caching Strategy

- **No explicit cache:** Supabase client does not cache by default
- **Next.js:** `revalidate` for product detail pages (e.g. 60s)
- **Future:** React Query cache for my products

---

## 6. Image Architecture

### 6.1 Upload Flow

```
User selects files
    → validateImageFile(file) [type, size ≤5MB]
    → compressImage(file) [WebP, max 1920×1080, quality 0.85]
    → supabase.storage.from('product-images').upload(path, blob)
    → getPublicUrl(path)
    → Add URL to form state (images array)
```

### 6.2 Compression Strategy

```typescript
// lib/utils/image.ts
import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85,
}

export async function compressImage(file: File): Promise<Blob> {
  return imageCompression(file, COMPRESSION_OPTIONS)
}
```

### 6.3 Storage Structure

```
product-images/
  {userId}/
    {timestamp}-{index}.webp

Example: a1b2c3d4-.../1739452800000-0.webp
```

### 6.4 CDN / Optimization

- Supabase Storage serves via CDN (public URLs)
- Next.js `<Image>` component: lazy loading, sizes, responsive
- WebP format (50% smaller than JPEG)

### 6.5 Fallback Images

```tsx
<Image
  src={product.images[0] || '/placeholder-product.png'}
  alt={product.title}
  fill
  onError={(e) => {
    e.currentTarget.src = '/placeholder-product.png'
  }}
/>
```

---

## 7. Security Architecture

### 7.1 RLS Policy Summary

| Policy | Table | Operation | Condition |
|--------|-------|-----------|-----------|
| products_select | products | SELECT | status='active' OR user_id=auth.uid() |
| products_insert | products | INSERT | auth.uid()=user_id |
| products_update | products | UPDATE | auth.uid()=user_id |
| products_delete | products | DELETE | auth.uid()=user_id |
| product_images_* | storage.objects | * | path prefix = auth.uid() |

### 7.2 Input Validation (Zod Schemas)

```typescript
// lib/validations/product.ts
export const productSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(5000),
  category: z.enum(['electronica', 'vehiculos', 'inmuebles', 'moda', 'hogar', 'deportes', 'servicios', 'otros']),
  subcategory: z.string().optional(),
  price: z.number().min(1).max(999999999),
  condition: z.enum(['new', 'used_like_new', 'used_good', 'used_fair']),
  location_department: z.string().min(1),
  location_city: z.string().min(1),
  images: z.array(z.string().url()).min(1).max(5),
})
```

### 7.3 Rate Limiting

- **M2:** No rate limiting (Supabase free tier)
- **Future:** Edge Function or Supabase middleware for product creation (e.g. 5/hour)

### 7.4 CSRF Protection

- Next.js handles CSRF for server actions
- Supabase uses JWT; no cookie-based auth for API

### 7.5 XSS Prevention

- React escapes by default
- No `dangerouslySetInnerHTML` for user content
- Description: render as plain text or sanitize if rich text later

---

## 8. Performance Architecture

### 8.1 Image Lazy Loading

```tsx
<Image
  src={url}
  alt={title}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 400px"
/>
```

### 8.2 Pagination Strategy

- **My products:** `limit 12`, `offset` for page
- **Future browse:** cursor-based pagination for large lists

### 8.3 Query Optimization

- Indexes on user_id, status, category, created_at, price
- Use `select()` only needed columns (avoid `*` for lists)

### 8.4 Bundle Size

- Dynamic import for ProductForm (heavy)
- ImageUpload: lazy load browser-image-compression

### 8.5 Mobile Performance

- Compress images aggressively (max 1MB)
- WebP format
- Reduce form fields; avoid unnecessary re-renders

---

## 9. Type System

### 9.1 Database Types (Supabase Generated)

```typescript
// types/database.ts (run: npx supabase gen types typescript)
export type Product = {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  subcategory: string | null
  price: number
  currency: string
  condition: 'new' | 'used_like_new' | 'used_good' | 'used_fair'
  location_department: string
  location_city: string
  images: string[]
  status: 'active' | 'sold' | 'inactive' | 'deleted'
  views_count: number
  favorites_count: number
  contacts_count: number
  created_at: string
  updated_at: string
  expires_at: string
}
```

### 9.2 Form Types

```typescript
// lib/validations/product.ts
export type ProductInput = z.infer<typeof productSchema>
```

### 9.3 Component Prop Types

```typescript
// ImageUpload
interface ImageUploadProps {
  userId: string
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  errors?: string
}

// ProductForm
interface ProductFormProps {
  defaultValues?: Partial<ProductInput>
  productId?: string
  onSubmit: (data: ProductInput) => Promise<void>
}
```

### 9.4 API Response Types

```typescript
// Product with seller
type ProductWithSeller = Product & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'location_city' | 'location_department'>
}
```

---

## 10. Migration Scripts

### 10.1 Migration 1: Products Table

**File:** `supabase/migrations/20260213130000_create_products_table.sql`

Includes: CREATE TABLE, indexes, RLS policies, update_updated_at trigger, increment_product_views RPC, grants.

### 10.2 Migration 2: Product Images Storage

**File:** `supabase/migrations/20260213130001_create_product_images_storage.sql`

Includes: product-images bucket (5MB limit, image/* MIME), RLS policies for INSERT/UPDATE/DELETE/SELECT.

### 10.3 Migration Order

1. `20260213130000_create_products_table.sql` (depends on profiles table from M1)
2. `20260213130001_create_product_images_storage.sql`

**Run migrations:**
```bash
npx supabase db push
# Or for local: npx supabase migration up
```

### 10.4 Rollback

```sql
-- Rollback products (if needed)
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TABLE IF EXISTS public.products;

-- Storage: delete bucket via Dashboard or API
```

---

## 11. Code Examples

### 11.1 Product Creation (ProductForm onSubmit)

```typescript
const onSubmit = async (data: ProductInput) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return router.push('/login')

  setIsSubmitting(true)
  setError(null)

  try {
    // Images already uploaded by ImageUpload; data.images = URLs
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        price: data.price,
        condition: data.condition,
        location_department: data.location_department,
        location_city: data.location_city,
        images: data.images,
      })
      .select('id')
      .single()

    if (error) throw error
    router.push(`/productos/${product.id}`)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al publicar')
  } finally {
    setIsSubmitting(false)
  }
}
```

### 11.2 Product Detail (Server Component)

```typescript
// app/productos/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'  // Server Component: async createClient()
import { notFound } from 'next/navigation'
import { ProductGallery } from '@/components/products/ProductGallery'
import { SellerCard } from '@/components/products/SellerCard'

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, location_city, location_department)
    `)
    .eq('id', params.id)
    .single()

  if (error || !product) notFound()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ProductGallery images={product.images} title={product.title} />
      <h1>{product.title}</h1>
      <p>{product.price} Bs</p>
      <SellerCard profile={product.profiles} />
    </div>
  )
}
```

### 11.3 Image Upload (ImageUpload component)

```typescript
const handleUpload = async (files: File[]) => {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const { valid, error } = validateImageFile(files[i])
    if (!valid) throw new Error(error)
    const compressed = await compressImage(files[i])
    const path = `${userId}/${Date.now()}-${i}.webp`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, compressed, { contentType: 'image/webp' })
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    urls.push(publicUrl)
  }
  onChange([...value, ...urls])
}
```

### 11.4 Categories Data

```typescript
// lib/data/categories.ts
export const CATEGORIES = [
  { id: 'electronica', name: 'Electrónica' },
  { id: 'vehiculos', name: 'Vehículos' },
  { id: 'inmuebles', name: 'Inmuebles' },
  { id: 'moda', name: 'Moda' },
  { id: 'hogar', name: 'Hogar' },
  { id: 'deportes', name: 'Deportes' },
  { id: 'servicios', name: 'Servicios' },
  { id: 'otros', name: 'Otros' },
] as const

export const SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  electronica: [
    { id: 'smartphones', name: 'Celulares' },
    { id: 'laptops', name: 'Laptops' },
    // ...
  ],
  // ...
}

export function getSubcategories(categoryId: string) {
  return SUBCATEGORIES[categoryId] ?? []
}
```

---

## Appendix A: Categories Reference

| ID | Display Name |
|----|--------------|
| electronica | Electrónica |
| vehiculos | Vehículos |
| inmuebles | Inmuebles |
| moda | Moda |
| hogar | Hogar |
| deportes | Deportes |
| servicios | Servicios |
| otros | Otros |

## Appendix B: Condition Options

| Value | Display (Spanish) |
|-------|-------------------|
| new | Nuevo |
| used_like_new | Usado como nuevo |
| used_good | Usado en buen estado |
| used_fair | Usado en estado regular |

## Appendix C: Status Values

| Value | Display | Visibility |
|-------|---------|------------|
| active | Activo | Public |
| sold | Vendido | Owner only |
| inactive | Inactivo | Owner only |
| deleted | Eliminado | Owner only (soft delete) |

---

**Document Version:** 1.0  
**Last Updated:** February 13, 2026  
**Next Review:** After Phase 1 completion
