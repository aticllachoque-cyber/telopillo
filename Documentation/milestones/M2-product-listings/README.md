# M2: Product Listings

**Status:** 🚧 IN PROGRESS  
**Started:** February 13, 2026  
**Estimated Duration:** 10-12 days  
**Dependencies:** M1 (Authentication & Profiles) ✅

---

## 📋 Overview

M2 implements the core product listing functionality, allowing users to create, view, edit, and manage product listings. This is the heart of the Telopillo.bo marketplace.

### Progress

```
Phase 1: Database Schema          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 2: Image Upload             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 3: Product Creation Form    ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 4: Product Detail Page      ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 5: Product Listing Page     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 6: Product Management       ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 7: Testing & Polish         ░░░░░░░░░░░░░░░░░░░░   0% ⏳

Overall: ░░░░░░░░░░░░░░░░░░░░ 0%
```

---

## 🎯 Goals

### Primary Goals
1. ✅ Users can create product listings with title, description, price, category, location, images
2. ✅ Product listings are stored in database with proper validation
3. ✅ Users can view product details
4. ✅ Users can view their own product listings
5. ✅ Users can edit/delete their own products
6. ✅ Product images are uploaded to Supabase Storage
7. ✅ Products have proper RLS policies (users can only edit their own)

### Success Criteria
- [ ] User can create a product listing in < 2 minutes
- [ ] Image upload works reliably (< 5s for 3 images)
- [ ] Product detail page loads in < 1s
- [ ] All forms have proper validation
- [ ] Mobile-responsive design
- [ ] WCAG 2.2 AA accessibility compliance

---

## 🏗️ Architecture

### Database Schema

**products table:**
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
  condition TEXT NOT NULL, -- 'new', 'used_like_new', 'used_good', 'used_fair'
  location_city TEXT NOT NULL,
  location_department TEXT NOT NULL,
  images TEXT[] NOT NULL, -- Array of image URLs
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'inactive', 'deleted'
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);
```

**Categories:**
- Electrónica
- Vehículos
- Inmuebles
- Moda
- Hogar
- Deportes
- Servicios
- Otros

**Condition Options:**
- `new` - Nuevo
- `used_like_new` - Usado como nuevo
- `used_good` - Usado en buen estado
- `used_fair` - Usado en estado regular

### Storage

**product-images bucket:**
- Public bucket for product images
- RLS policies: Anyone can read, only owner can upload/delete
- Image optimization: WebP format, max 1920x1080, quality 85%
- Naming convention: `{userId}/{productId}/{timestamp}-{index}.webp`

---

## 📦 Features

### Phase 1: Database Schema (Day 1, 2-3 hours)

**Tasks:**
- [ ] Create products table migration
- [ ] Add indexes (user_id, category, status, price, location, created_at)
- [ ] Create RLS policies
- [ ] Create triggers (update_updated_at)
- [ ] Create product-images storage bucket
- [ ] Add storage RLS policies
- [ ] Push migration to Supabase
- [ ] Test RLS policies

**Deliverables:**
- `supabase/migrations/XXXXXX_create_products_table.sql`
- `supabase/migrations/XXXXXX_create_product_images_storage.sql`
- `supabase/tests/products_rls.test.sql`

### Phase 2: Image Upload Component (Day 2, 3-4 hours)

**Tasks:**
- [ ] Create `ImageUpload` component
- [ ] Implement drag-and-drop
- [ ] Add image preview
- [ ] Implement file validation (type, size, count)
- [ ] Implement image compression/optimization
- [ ] Upload to Supabase Storage
- [ ] Handle upload errors
- [ ] Add loading states
- [ ] Support multiple images (up to 5)
- [ ] Add image reordering

**Deliverables:**
- `components/products/ImageUpload.tsx`
- `lib/utils/image.ts` (compression, validation)

### Phase 3: Product Creation Form (Day 3-4, 6-8 hours)

**Tasks:**
- [ ] Create `/publicar` page
- [ ] Create `ProductForm` component
- [ ] Add form fields:
  - Title (required, 10-100 chars)
  - Description (required, 50-5000 chars)
  - Category (required, dropdown)
  - Subcategory (conditional, dropdown)
  - Price (required, number, min 1)
  - Condition (required, radio)
  - Location (required, department + city)
  - Images (required, 1-5 images)
- [ ] Implement form validation (Zod)
- [ ] Integrate with React Hook Form
- [ ] Implement category/subcategory logic
- [ ] Add location selector (reuse from M1)
- [ ] Integrate ImageUpload component
- [ ] Implement form submission
- [ ] Handle success/error states
- [ ] Add loading spinner
- [ ] Redirect to product detail on success

**Deliverables:**
- `app/publicar/page.tsx`
- `components/products/ProductForm.tsx`
- `lib/validations/product.ts`

### Phase 4: Product Detail Page (Day 5, 4-6 hours)

**Tasks:**
- [ ] Create `/productos/[id]` page
- [ ] Fetch product data from Supabase
- [ ] Display product information
- [ ] Create image gallery component
- [ ] Display seller information (name, avatar, rating)
- [ ] Add "Contactar Vendedor" button
- [ ] Add breadcrumbs
- [ ] Implement view counter
- [ ] Add share buttons (WhatsApp, Facebook)
- [ ] Add "Reportar" button
- [ ] Handle 404 for non-existent products
- [ ] SEO optimization (meta tags, Open Graph)

**Deliverables:**
- `app/productos/[id]/page.tsx`
- `components/products/ProductGallery.tsx`
- `components/products/SellerCard.tsx`

### Phase 5: Product Listing Page (Day 6, 4-6 hours)

**Tasks:**
- [ ] Create `/perfil/mis-productos` page
- [ ] Fetch user's products from Supabase
- [ ] Display products in grid
- [ ] Add status filters (active, sold, inactive)
- [ ] Add sort options (newest, oldest, price)
- [ ] Show product stats (views, favorites, contacts)
- [ ] Add quick actions (edit, mark as sold, delete)
- [ ] Handle empty state
- [ ] Add pagination
- [ ] Add "Publicar Nuevo" button

**Deliverables:**
- `app/perfil/mis-productos/page.tsx`
- `components/products/ProductCard.tsx`
- `components/products/ProductGrid.tsx`

### Phase 6: Product Management (Day 7-8, 6-8 hours)

**Tasks:**
- [ ] Create `/productos/[id]/editar` page
- [ ] Reuse ProductForm component
- [ ] Pre-fill form with existing data
- [ ] Handle image updates (add/remove/reorder)
- [ ] Implement update logic
- [ ] Add "Mark as Sold" functionality
- [ ] Add "Mark as Inactive" functionality
- [ ] Add "Delete Product" functionality
- [ ] Add confirmation dialogs
- [ ] Handle permissions (only owner can edit)
- [ ] Redirect after actions

**Deliverables:**
- `app/productos/[id]/editar/page.tsx`
- `components/products/ProductActions.tsx`

### Phase 7: Testing & Polish (Day 9-10, 6-8 hours)

**Tasks:**
- [ ] Manual testing: Create product flow
- [ ] Manual testing: Image upload (multiple, validation)
- [ ] Manual testing: Edit product
- [ ] Manual testing: Delete product
- [ ] Manual testing: Mark as sold
- [ ] Manual testing: View product detail
- [ ] Manual testing: View my products
- [ ] Security testing: RLS policies
- [ ] UI/UX testing: Responsive design
- [ ] UI/UX testing: Loading states
- [ ] UI/UX testing: Error handling
- [ ] Accessibility testing: WCAG 2.2 AA
- [ ] Browser testing: Chrome, Firefox, Safari
- [ ] Performance testing: Image upload speed
- [ ] Performance testing: Page load times
- [ ] Run ESLint and fix warnings
- [ ] Run TypeScript check
- [ ] Update documentation

**Deliverables:**
- `Documentation/milestones/M2-product-listings/TESTING_CHECKLIST.md`
- `Documentation/milestones/M2-product-listings/TEST_REPORT.md`
- Updated `PROGRESS.md`

---

## 🔧 Technical Details

### Form Validation (Zod)

```typescript
const productSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(5000),
  category: z.enum(['electronica', 'vehiculos', 'inmuebles', 'moda', 'hogar', 'deportes', 'servicios', 'otros']),
  subcategory: z.string().optional(),
  price: z.number().min(1).max(999999999),
  condition: z.enum(['new', 'used_like_new', 'used_good', 'used_fair']),
  location_department: z.string().min(1),
  location_city: z.string().min(1),
  images: z.array(z.string()).min(1).max(5)
})
```

### Image Optimization

- **Format:** WebP (50% smaller than JPEG)
- **Max dimensions:** 1920x1080
- **Quality:** 85%
- **Max file size:** 5MB per image
- **Compression:** Client-side using `browser-image-compression`

### RLS Policies

```sql
-- Anyone can view active products
CREATE POLICY "Active products are viewable by everyone"
ON products FOR SELECT
USING (status = 'active');

-- Users can insert their own products
CREATE POLICY "Users can create own products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update own products"
ON products FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
ON products FOR DELETE
USING (auth.uid() = user_id);
```

---

## 📚 Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed step-by-step plan
- [PROGRESS.md](./PROGRESS.md) - Progress tracking
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Testing guide
- [API.md](./API.md) - API documentation

---

## 🚀 Getting Started

### Prerequisites

- M1 (Authentication & Profiles) completed
- Supabase project configured
- Development environment set up

### Quick Start

```bash
# Create migration for products table
npx supabase migration new create_products_table

# Edit the migration file
# supabase/migrations/XXXXXX_create_products_table.sql

# Push to Supabase
npx supabase db push

# Start development
npm run dev

# Navigate to /publicar to create a product
```

---

## 🎨 UI/UX Guidelines

### Product Form
- Clear section headings
- Inline validation with helpful error messages
- Character counters for title/description
- Image previews with drag-to-reorder
- Save draft functionality (future)
- Mobile-optimized inputs

### Product Detail
- Large, zoomable images
- Clear pricing and condition
- Prominent CTA button
- Seller trust signals (rating, verification)
- WhatsApp integration for contact

### Product Grid
- Card-based layout
- Lazy loading for images
- Quick actions on hover (desktop)
- Status badges (sold, featured)
- Pagination or infinite scroll

---

## 🔐 Security Considerations

1. **RLS Policies:** Strict policies to prevent unauthorized access
2. **Image Upload:** Validate file type, size, and count
3. **Input Sanitization:** All user inputs sanitized
4. **Rate Limiting:** Limit product creation (5 per hour)
5. **CSRF Protection:** Next.js built-in protection
6. **SQL Injection:** Supabase client prevents SQL injection

---

## 📊 Metrics & KPIs

### Success Metrics
- **Product Creation Rate:** > 80% completion rate
- **Image Upload Success:** > 95% success rate
- **Time to Create:** < 2 minutes average
- **Form Abandonment:** < 20%
- **Mobile Usage:** > 60% of creations

### Performance Metrics
- **Image Upload Time:** < 5s for 3 images
- **Product Detail Load:** < 1s
- **Product List Load:** < 1.5s
- **Lighthouse Score:** > 90 (Performance, Accessibility)

---

## 🐛 Known Issues

_None yet - will be documented during testing_

---

## 🔄 Next Steps (M3)

After M2 completion:
- M3: Search & Discovery
  - Keyword search
  - Category filtering
  - Location filtering
  - Price range filtering
  - Sort options

---

**Last Updated:** February 13, 2026  
**Status:** Ready to start Phase 1
