# Milestone 2: Product Listings (Core CRUD)

**Duration:** Week 4-5  
**Goal:** Users can create, view, edit, and delete products

## Progress: 0/16 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Create `products` table with all fields
- [ ] Set up RLS policies (view active, manage own)
- [ ] Create indexes for performance
- [ ] Add status tracking (active, sold, inactive)

### Frontend - Product Creation
- [ ] Product creation form (multi-step)
  - [ ] Basic info (title, description, price in BOB)
  - [ ] Category selection (hierarchical: 14 categories, 50+ subcategories)
  - [ ] Image upload (up to 8 images, with preview)
  - [ ] Location selection (department + city)
  - [ ] Condition selection (new/used)
  - [ ] Availability toggle

### Frontend - Product Display
- [ ] Product detail page
- [ ] Product edit page
- [ ] Product list/grid component
- [ ] Image gallery component
- [ ] Delete/deactivate product functionality

### Backend
- [ ] Image upload to Supabase Storage
- [ ] Image optimization (WebP, thumbnails)
- [ ] Product CRUD operations
- [ ] Validation logic

## Deliverables
- ✅ Full product lifecycle management
- ✅ Multi-image upload with optimization

## Success Criteria
- Users can create products with images
- Products display correctly
- Users can edit their own products
- Users can delete/deactivate products
- Images are optimized (WebP, thumbnails)
- Form validation works

## Dependencies
- M1 completed
- Supabase Storage configured

## Notes
- Support up to 8 images per product (3 for free tier consideration)
- Optimize images to <300KB each
- Use WebP format for 50% size reduction
- Implement lazy loading
- Add image preview before upload
- Store in Supabase Storage with CDN
- Generate thumbnails automatically
- Categories: Electronics, Vehicles, Home, Fashion, Construction, Sports, Baby, Beauty, Books, Pets, Office, Food, Services, Other
