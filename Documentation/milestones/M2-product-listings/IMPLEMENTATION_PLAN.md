# Implementation Plan - Milestone 2: Product Listings

**Version:** 1.0  
**Date:** February 13, 2026  
**Author:** Alcides Cardenas  
**Estimated Duration:** 6-8 days (based on M1 velocity: ~14h actual vs 10d estimated)  
**Status:** Ready to Start

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Phase-by-Phase Plan](#3-phase-by-phase-plan)
4. [Risk Analysis & Mitigation](#4-risk-analysis--mitigation)
5. [Testing Strategy](#5-testing-strategy)
6. [Success Criteria](#6-success-criteria)
7. [Rollout Plan](#7-rollout-plan)

---

## 1. Executive Summary

### 1.1 Overview

M2 implements the core product listing functionality for Telopillo.bo—the heart of the marketplace. Users will create, view, edit, and manage product listings with multi-image upload, full validation, and mobile-first design.

### 1.2 Key Metrics

| Metric | Target |
|--------|--------|
| **Estimated Duration** | 6-8 days (48-64 hours) |
| **M1 Velocity Reference** | ~14h actual vs 10d estimated (1.4x faster) |
| **Phases** | 7 phases, sequential with some parallelization |
| **Critical Path** | Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 |

### 1.3 Dependencies

- **M1 (Authentication & Profiles):** ✅ Complete at 93%
- **Supabase:** Configured, profiles table exists, avatars bucket exists
- **Established Patterns:** LocationSelector, Zod + React Hook Form, AvatarUpload, RLS policies

### 1.4 Deliverables Summary

| Phase | Key Deliverables | Est. Hours |
|-------|------------------|------------|
| 1 | products table, product-images bucket, RLS | 2-3 |
| 2 | ImageUpload component, image utils | 3-4 |
| 3 | /publicar page, ProductForm, validation | 5-6 |
| 4 | /productos/[id], ProductGallery, SellerCard | 4-5 |
| 5 | /perfil/mis-productos, ProductGrid, ProductCard | 4-5 |
| 6 | /productos/[id]/editar, ProductActions | 5-6 |
| 7 | Testing, polish, documentation | 5-6 |

**Total:** 28-35 hours (~4-5 working days at M1 velocity)

---

## 2. Technical Architecture

### 2.1 Database Schema (MVP Scope)

**Simplified for M2** — Defer to later milestones:
- `embedding` (VECTOR) → M3 Search
- `search_vector` (TSVECTOR) → M3 Search  
- `location_coordinates` (GEOGRAPHY) → M7 Geolocation
- `is_featured`, `featured_until` → Premium (Phase 2+)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BOB',
  condition TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_department TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);
```

### 2.2 Categories (MVP - 8 Categories)

From M2 README, aligned with Bolivian marketplace:

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

Subcategories: Use CATEGORIES.md as reference; implement subset per category for MVP. Can expand to full 14-category taxonomy later.

### 2.3 Image Upload Flow

**Critical:** Product ID is generated on INSERT, but we need image URLs for the product. Flow:

1. **User selects images** → Client-side validation (type, size, count 1-5)
2. **On form submit** → Upload images first to `product-images/{userId}/{timestamp}-{index}.webp`
3. **Get public URLs** → From Supabase Storage
4. **INSERT product** → With title, description, images (URLs), etc.

**Path convention:** `product-images/{userId}/{timestamp}-{index}.webp` (no productId in path—simplifies create flow)

### 2.4 Reusable Patterns from M1

| M1 Component | M2 Reuse | Notes |
|--------------|----------|-------|
| LocationSelector | ✅ Direct reuse | Same props: department, city, onDepartmentChange, onCityChange, errors |
| Zod + React Hook Form | ✅ Same pattern | productSchema in lib/validations/product.ts |
| AvatarUpload patterns | ✅ Adapt for ImageUpload | File validation, Supabase upload, loading states, error handling |
| RLS policy structure | ✅ Same pattern | Owner-based policies for products, storage |

---

## 3. Phase-by-Phase Plan

---

### Phase 1: Database Schema

**Duration:** 2-3 hours  
**Dependencies:** None (M1 complete)  
**Critical Path:** Yes

#### 1.1 Create Products Table Migration

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.1.1 | Run `npx supabase migration new create_products_table` | 5 min | - |
| 1.1.2 | Write products table SQL (schema above) | 30 min | - |
| 1.1.3 | Add indexes: user_id, category, status, price, location_department, location_city, created_at | 15 min | 1.1.2 |
| 1.1.4 | Add update_updated_at trigger (reuse from profiles) | 10 min | 1.1.2 |
| 1.1.5 | Add RLS policies (SELECT, INSERT, UPDATE, DELETE) | 20 min | 1.1.2 |

**RLS Policy Details:**
- SELECT: `status = 'active' OR user_id = auth.uid()` (owners see their own inactive/sold)
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

#### 1.2 Create Product Images Storage Bucket

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.2.1 | Create migration `create_product_images_storage` | 5 min | - |
| 1.2.2 | Insert product-images bucket (public, 5MB limit, image/* MIME) | 15 min | - |
| 1.2.3 | RLS: INSERT/UPDATE/DELETE for path `product-images/{auth.uid()}/*` | 20 min | - |
| 1.2.4 | RLS: SELECT for public (anyone can view) | 5 min | - |

#### 1.3 Push & Verify

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.3.1 | Run `npx supabase db push` | 5 min | 1.1, 1.2 |
| 1.3.2 | Verify tables in Supabase Dashboard | 5 min | 1.3.1 |
| 1.3.3 | Test RLS: create product as user, verify policies | 20 min | 1.3.1 |

**Phase 1 Deliverables:**
- `supabase/migrations/XXXXXX_create_products_table.sql`
- `supabase/migrations/XXXXXX_create_product_images_storage.sql`

**Phase 1 Success Criteria:**
- [ ] products table exists with correct schema
- [ ] product-images bucket exists and is public
- [ ] RLS prevents unauthorized insert/update/delete
- [ ] Authenticated users can insert products with their user_id

---

### Phase 2: Image Upload Component

**Duration:** 3-4 hours  
**Dependencies:** Phase 1 (storage bucket)  
**Critical Path:** Yes

#### 2.1 Image Utilities

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 2.1.1 | Create `lib/utils/image.ts` | 30 min | - |
| 2.1.2 | Add `validateImageFile(file): { valid, error? }` (type, size ≤5MB) | 15 min | - |
| 2.1.3 | Add `compressImage(file): Promise<Blob>` using browser-image-compression | 30 min | - |
| 2.1.4 | Install `browser-image-compression` package | 5 min | - |

**Compression config:** WebP, max 1920x1080, quality 0.85, maxSizeMB 1

#### 2.2 ImageUpload Component

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 2.2.1 | Create `components/products/ImageUpload.tsx` | 20 min | - |
| 2.2.2 | Implement drag-and-drop zone (use native HTML5 or @dnd-kit) | 45 min | - |
| 2.2.3 | Implement file input fallback, multi-file (1-5) | 20 min | - |
| 2.2.4 | Add preview grid with remove button per image | 30 min | - |
| 2.2.5 | Add image reordering (drag to reorder) | 30 min | 2.2.4 |
| 2.2.6 | Integrate compression before upload | 15 min | 2.1, 2.2 |
| 2.2.7 | Upload to Supabase Storage `product-images/{userId}/{timestamp}-{i}.webp` | 30 min | Phase 1 |
| 2.2.8 | Loading states, progress, error handling | 20 min | - |
| 2.2.9 | Accessibility: aria-labels, role, keyboard support | 15 min | - |

**Props interface:**
```typescript
interface ImageUploadProps {
  userId: string
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  errors?: string
}
```

**Phase 2 Deliverables:**
- `lib/utils/image.ts`
- `components/products/ImageUpload.tsx`

**Phase 2 Success Criteria:**
- [ ] Drag-and-drop works
- [ ] 1-5 images validated
- [ ] Compression reduces file size
- [ ] Upload to Supabase succeeds
- [ ] Reorder and remove work
- [ ] Loading and error states display correctly

---

### Phase 3: Product Creation Form

**Duration:** 5-6 hours  
**Dependencies:** Phase 1, Phase 2  
**Critical Path:** Yes

#### 3.1 Validation Schema

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.1.1 | Create `lib/validations/product.ts` | 20 min | - |
| 3.1.2 | Define productSchema with Zod | 30 min | - |
| 3.1.3 | Export ProductInput type | 5 min | - |

**Schema:**
```typescript
title: z.string().min(10).max(100)
description: z.string().min(50).max(5000)
category: z.enum([...])
subcategory: z.string().optional()
price: z.number().min(1).max(999999999)
condition: z.enum(['new', 'used_like_new', 'used_good', 'used_fair'])
location_department: z.string().min(1)
location_city: z.string().min(1)
images: z.array(z.string()).min(1).max(5)
```

#### 3.2 Categories Data

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.2.1 | Create `lib/data/categories.ts` with 8 categories + subcategories | 30 min | - |
| 3.2.2 | Export CATEGORIES, getSubcategories(categoryId) | 15 min | - |

#### 3.3 ProductForm Component

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.3.1 | Create `components/products/ProductForm.tsx` | 20 min | - |
| 3.3.2 | Integrate React Hook Form + zodResolver | 15 min | 3.1 |
| 3.3.3 | Add title Input (with char counter 10/100) | 20 min | - |
| 3.3.4 | Add description Textarea (char counter 50/5000) | 20 min | - |
| 3.3.5 | Add category Select, subcategory Select (conditional) | 30 min | 3.2 |
| 3.3.6 | Add price Input (number, BOB, min 1) | 15 min | - |
| 3.3.7 | Add condition RadioGroup (4 options) | 20 min | - |
| 3.3.8 | Add LocationSelector (reuse from M1) | 10 min | - |
| 3.3.9 | Add ImageUpload component | 15 min | Phase 2 |
| 3.3.10 | Wire form state for images (controlled) | 20 min | - |
| 3.3.11 | onSubmit: upload images → create product → redirect | 45 min | Phase 1 |
| 3.3.12 | Loading state during submit | 10 min | - |
| 3.3.13 | Error handling, toast/alert on failure | 20 min | - |
| 3.3.14 | Inline validation, error messages | 15 min | - |

#### 3.4 Publicar Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.4.1 | Create `app/publicar/page.tsx` | 15 min | - |
| 3.4.2 | Add auth guard (redirect to login if not authenticated) | 15 min | - |
| 3.4.3 | Render ProductForm | 10 min | 3.3 |
| 3.4.4 | Add page title, meta, breadcrumbs | 10 min | - |
| 3.4.5 | Add "Publicar" CTA in header/nav (optional) | 10 min | - |

**Phase 3 Deliverables:**
- `lib/validations/product.ts`
- `lib/data/categories.ts`
- `components/products/ProductForm.tsx`
- `app/publicar/page.tsx`

**Phase 3 Success Criteria:**
- [ ] Form validates all fields
- [ ] Category/subcategory cascade works
- [ ] LocationSelector works (reused)
- [ ] Images upload and attach to product
- [ ] Product created in DB on submit
- [ ] Redirect to product detail on success
- [ ] Unauthenticated users redirected to login

---

### Phase 4: Product Detail Page

**Duration:** 4-5 hours  
**Dependencies:** Phase 1, Phase 3  
**Critical Path:** Yes

#### 4.1 Product Gallery

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.1.1 | Create `components/products/ProductGallery.tsx` | 30 min | - |
| 4.1.2 | Main image + thumbnails, click to switch | 30 min | - |
| 4.1.3 | Lazy loading for images | 15 min | - |
| 4.1.4 | Handle single image, multiple images | 10 min | - |
| 4.1.5 | Accessibility: alt text, aria-labels | 10 min | - |

#### 4.2 Seller Card

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.2.1 | Create `components/products/SellerCard.tsx` | 30 min | - |
| 4.2.2 | Fetch seller profile (join or separate query) | 20 min | - |
| 4.2.3 | Display avatar, name, location, rating (if available) | 20 min | - |
| 4.2.4 | "Contactar Vendedor" button (WhatsApp link or placeholder) | 20 min | - |

#### 4.3 Product Detail Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.3.1 | Create `app/productos/[id]/page.tsx` | 20 min | - |
| 4.3.2 | Fetch product by ID (Supabase) | 20 min | - |
| 4.3.3 | Handle 404 (notFound) | 15 min | - |
| 4.3.4 | Layout: gallery left, info right (desktop) / stacked (mobile) | 30 min | - |
| 4.3.5 | Display title, price, condition, category, description | 25 min | - |
| 4.3.6 | Display location | 10 min | - |
| 4.3.7 | Integrate ProductGallery, SellerCard | 15 min | 4.1, 4.2 |
| 4.3.8 | Increment views_count (useEffect or server action) | 20 min | - |
| 4.3.9 | Breadcrumbs (Inicio > Categoría > Producto) | 15 min | - |
| 4.3.10 | Share buttons (WhatsApp, Facebook) - basic links | 20 min | - |
| 4.3.11 | "Reportar" button (placeholder/modal) | 15 min | - |
| 4.3.12 | SEO: metadata, Open Graph, title | 20 min | - |

**Phase 4 Deliverables:**
- `components/products/ProductGallery.tsx`
- `components/products/SellerCard.tsx`
- `app/productos/[id]/page.tsx`

**Phase 4 Success Criteria:**
- [ ] Product loads by ID
- [ ] 404 for invalid ID
- [ ] Gallery displays all images
- [ ] Seller info displays
- [ ] Contact button works (WhatsApp with pre-filled message)
- [ ] views_count increments
- [ ] Mobile responsive
- [ ] Meta tags for sharing

---

### Phase 5: Product Listing Page (My Products)

**Duration:** 4-5 hours  
**Dependencies:** Phase 1, Phase 3, Phase 4  
**Critical Path:** Yes

#### 5.1 Product Card

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 5.1.1 | Create `components/products/ProductCard.tsx` | 30 min | - |
| 5.1.2 | Display image, title, price, status badge | 25 min | - |
| 5.1.3 | Display stats: views, favorites, contacts | 15 min | - |
| 5.1.4 | Quick actions: Edit, Mark sold, Delete (icons) | 25 min | - |
| 5.1.5 | Link to product detail | 5 min | - |
| 5.1.6 | Status badge (active, sold, inactive) | 10 min | - |

#### 5.2 Product Grid & Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 5.2.1 | Create `components/products/ProductGrid.tsx` | 20 min | - |
| 5.2.2 | Grid layout (responsive: 1 col mobile, 2-3 desktop) | 15 min | - |
| 5.2.3 | Create `app/perfil/mis-productos/page.tsx` | 20 min | - |
| 5.2.4 | Auth guard | 10 min | - |
| 5.2.5 | Fetch user's products (filter by user_id) | 25 min | - |
| 5.2.6 | Status filter (active, sold, inactive) | 25 min | - |
| 5.2.7 | Sort (newest, oldest, price asc/desc) | 25 min | - |
| 5.2.8 | Pagination (limit 12, offset) | 30 min | - |
| 5.2.9 | Empty state ("No tienes productos", CTA to /publicar) | 15 min | - |
| 5.2.10 | "Publicar Nuevo" button | 5 min | - |
| 5.2.11 | Add link in profile menu/sidebar | 10 min | - |

**Phase 5 Deliverables:**
- `components/products/ProductCard.tsx`
- `components/products/ProductGrid.tsx`
- `app/perfil/mis-productos/page.tsx`

**Phase 5 Success Criteria:**
- [ ] User sees only their products
- [ ] Filters and sort work
- [ ] Pagination works
- [ ] Empty state displays
- [ ] Quick actions visible (implementation in Phase 6)

---

### Phase 6: Product Management

**Duration:** 5-6 hours  
**Dependencies:** Phase 3, Phase 4, Phase 5  
**Critical Path:** Yes

#### 6.1 Edit Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 6.1.1 | Create `app/productos/[id]/editar/page.tsx` | 20 min | - |
| 6.1.2 | Fetch product, verify ownership (auth.uid() === user_id) | 25 min | - |
| 6.1.3 | Redirect 404 if not found, 403 if not owner | 15 min | - |
| 6.1.4 | Reuse ProductForm with defaultValues | 20 min | Phase 3 |
| 6.1.5 | Pre-fill form (title, description, category, etc.) | 20 min | - |
| 6.1.6 | ImageUpload: show existing images, allow add/remove/reorder | 45 min | Phase 2 |
| 6.1.7 | onSubmit: update product (PATCH) | 30 min | - |
| 6.1.8 | Handle image updates (new uploads + keep existing) | 30 min | - |
| 6.1.9 | Redirect to product detail on success | 5 min | - |

#### 6.2 Product Actions

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 6.2.1 | Create `components/products/ProductActions.tsx` | 20 min | - |
| 6.2.2 | "Mark as Sold" → update status to 'sold' | 20 min | - |
| 6.2.3 | "Mark as Inactive" → update status to 'inactive' | 15 min | - |
| 6.2.4 | "Delete" → soft delete (status='deleted') or hard delete | 25 min | - |
| 6.2.5 | Confirmation dialogs (AlertDialog) for sold, inactive, delete | 30 min | - |
| 6.2.6 | Integrate into ProductCard, ProductDetail | 20 min | Phase 5, 4 |
| 6.2.7 | Refresh list / redirect after action | 15 min | - |

**Phase 6 Deliverables:**
- `app/productos/[id]/editar/page.tsx`
- `components/products/ProductActions.tsx`

**Phase 6 Success Criteria:**
- [ ] Owner can edit product
- [ ] Non-owner gets 403
- [ ] Images can be added/removed/reordered on edit
- [ ] Mark as sold works
- [ ] Mark as inactive works
- [ ] Delete works with confirmation
- [ ] All actions redirect/refresh appropriately

---

### Phase 7: Testing & Polish

**Duration:** 5-6 hours  
**Dependencies:** Phases 1-6  
**Critical Path:** Yes

#### 7.1 Manual Testing

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.1.1 | Create product flow (happy path) | 30 min | - |
| 7.1.2 | Image upload: multiple, validation errors, reorder | 30 min | - |
| 7.1.3 | Edit product flow | 20 min | - |
| 7.1.4 | Delete, mark sold, mark inactive | 20 min | - |
| 7.1.5 | View product detail (logged in, logged out) | 15 min | - |
| 7.1.6 | View my products, filters, sort | 20 min | - |
| 7.1.7 | RLS: verify non-owner cannot edit | 15 min | - |

#### 7.2 Security & Performance

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.2.1 | RLS policy verification (SQL tests or manual) | 30 min | - |
| 7.2.2 | Input validation (XSS, SQL injection - Supabase handles) | 10 min | - |
| 7.2.3 | Image upload performance (<5s for 3 images) | 15 min | - |
| 7.2.4 | Page load times (Lighthouse) | 15 min | - |

#### 7.3 UI/UX & Accessibility

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.3.1 | Responsive design check (mobile, tablet, desktop) | 30 min | - |
| 7.3.2 | Loading states, skeletons | 20 min | - |
| 7.3.3 | Error handling, user feedback | 15 min | - |
| 7.3.4 | WCAG 2.2 AA: focus, contrast, labels | 30 min | - |
| 7.3.5 | Keyboard navigation | 15 min | - |

#### 7.4 Code Quality & Documentation

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.4.1 | Run ESLint, fix all issues | 20 min | - |
| 7.4.2 | Run TypeScript check | 5 min | - |
| 7.4.3 | Update PROGRESS.md | 15 min | - |
| 7.4.4 | Create TESTING_CHECKLIST.md | 30 min | - |
| 7.4.5 | Update README links | 5 min | - |

**Phase 7 Deliverables:**
- `Documentation/milestones/M2-product-listings/TESTING_CHECKLIST.md`
- Updated PROGRESS.md
- Zero ESLint/TypeScript errors

**Phase 7 Success Criteria:**
- [ ] All manual test cases pass
- [ ] RLS policies verified
- [ ] Lighthouse Performance > 85, Accessibility > 90
- [ ] 0 ESLint errors, 0 TypeScript errors
- [ ] Documentation updated

---

## 4. Risk Analysis & Mitigation

### 4.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Image compression fails on some browsers | Low | Medium | Use browser-image-compression (widely supported); fallback to original if compression errors |
| Storage quota exceeded (1GB free tier) | Medium | High | Monitor usage; optimize image size (WebP, 85% quality); document upgrade path |
| RLS policy too restrictive | Medium | High | Test policies early in Phase 1; use service role for admin if needed |
| Form submission race (images not ready) | Low | High | Sequential flow: upload images first, then create product; disable submit until uploads complete |
| Category/subcategory mismatch with DB | Low | Medium | Use shared constants in lib/data/categories.ts; validate on backend if needed |

### 4.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Long image upload on slow connections | High | Medium | Show progress; allow form fill while uploading; compress aggressively |
| Form abandonment | Medium | Medium | Save draft (Phase 2+); clear CTAs; minimize required fields |
| Mobile keyboard covers inputs | Low | Low | Use inputMode, scrollIntoView on focus |

### 4.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Unauthorized product edit | Low | High | RLS enforces user_id; verify ownership in edit page |
| Malicious image upload | Low | Medium | Validate MIME type, size; Supabase validates |
| Rate limiting (product creation spam) | Medium | Medium | Defer to Phase 2; document as future Edge Function |

---

## 5. Testing Strategy

### 5.1 Unit / Integration (Optional for M2)

- Zod schema: validate productSchema with valid/invalid inputs
- Image utils: validate validateImageFile, compressImage

### 5.2 Manual Testing Checklist

See Phase 7. Create `TESTING_CHECKLIST.md` with:

1. **Create Product**
   - [ ] All fields validate
   - [ ] Images upload (1-5)
   - [ ] Product appears in DB
   - [ ] Redirect to detail page

2. **Edit Product**
   - [ ] Pre-filled form
   - [ ] Image add/remove/reorder
   - [ ] Update persists

3. **Product Actions**
   - [ ] Mark sold
   - [ ] Mark inactive
   - [ ] Delete with confirmation

4. **Access Control**
   - [ ] Non-owner cannot edit
   - [ ] Unauthenticated cannot create

5. **Responsive & A11y**
   - [ ] Mobile layout
   - [ ] Keyboard nav
   - [ ] Screen reader basics

### 5.3 RLS Verification

```sql
-- As authenticated user A: insert product with user_id = A's id ✓
-- As authenticated user B: update product owned by A ✗
-- As anon: select active product ✓
-- As anon: select inactive product ✗ (unless owner)
```

---

## 6. Success Criteria

### 6.1 Phase Completion

Each phase is complete when:
- All tasks done
- Deliverables created
- Success criteria checked
- No blocking bugs

### 6.2 Milestone Completion

M2 is complete when:
- [ ] User can create product in < 2 minutes
- [ ] Image upload works (< 5s for 3 images)
- [ ] Product detail loads in < 1s
- [ ] All forms have validation
- [ ] Mobile-responsive
- [ ] WCAG 2.2 AA compliance (audit)
- [ ] 0 ESLint, 0 TypeScript errors

---

## 7. Rollout Plan

### 7.1 Deployment Order

1. **Phase 1** → Push migrations to Supabase (staging/production)
2. **Phases 2-6** → Deploy frontend (Vercel)
3. **Phase 7** → Final verification, then mark M2 complete

### 7.2 Rollback Plan

| Scenario | Rollback Action |
|----------|-----------------|
| Migration fails | Revert migration: `npx supabase db reset` (local) or manual rollback (remote) |
| Critical bug in create flow | Feature flag to hide /publicar link; fix and redeploy |
| Storage issues | Disable image upload temporarily; use placeholder |
| RLS too strict | Add permissive policy temporarily; fix and tighten |

### 7.3 Post-M2

- M3: Search & Discovery (keyword search, filters)
- Add embedding + search_vector in M3
- Consider rate limiting for product creation
- Expand categories from CATEGORIES.md if needed

---

## Appendix A: Task Dependency Graph

```
Phase 1 ─┬─ Phase 2 ─┬─ Phase 3 ─┬─ Phase 4
         │           │            │
         │           │            └─ Phase 5 ─ Phase 6 ─ Phase 7
         │           │
         └───────────┴───────────────────────────────
```

**Critical Path:** 1 → 2 → 3 → 4 → 5 → 6 → 7

**Parallelization:** Phase 4 and 5 can overlap slightly (both need Phase 3). Phase 6 needs 4 and 5.

---

## Appendix B: File Structure (Target)

```
app/
  publicar/page.tsx
  productos/
    [id]/
      page.tsx
      editar/page.tsx
  perfil/
    mis-productos/page.tsx

components/
  products/
    ImageUpload.tsx
    ProductForm.tsx
    ProductGallery.tsx
    ProductCard.tsx
    ProductGrid.tsx
    ProductActions.tsx
    SellerCard.tsx

lib/
  validations/product.ts
  data/categories.ts
  utils/image.ts

supabase/
  migrations/
    XXXXXX_create_products_table.sql
    XXXXXX_create_product_images_storage.sql
```

---

## Appendix C: Time Estimate Summary

| Phase | Low (h) | High (h) |
|-------|---------|----------|
| 1 | 2 | 3 |
| 2 | 3 | 4 |
| 3 | 5 | 6 |
| 4 | 4 | 5 |
| 5 | 4 | 5 |
| 6 | 5 | 6 |
| 7 | 5 | 6 |
| **Total** | **28** | **35** |

At M1 velocity (~1.4x faster), expect **4-5 working days** for full M2 completion.

---

**Last Updated:** February 13, 2026  
**Next Review:** After Phase 1 completion
