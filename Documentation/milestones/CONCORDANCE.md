# Concordance Document: PRD ↔ Architecture ↔ Milestones

This document maps features from the PRD and Architecture to specific milestones, ensuring complete alignment.

## Document References

- **PRD**: `Documentation/PRD.md` (v1.4, Feb 12, 2026)
- **Architecture**: `Documentation/ARCHITECTURE.md` (v1.0, Feb 12, 2026)
- **Milestones**: `Documentation/milestones/`

---

## Feature Mapping: PRD Section 6 (MVP Features) → Milestones

### 6.1 User Management (PRD) → M1: Authentication & Profiles

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Email + password registration | M1: Login page | ✅ Mapped |
| Google OAuth | M1: Configure OAuth providers | ✅ Mapped |
| Facebook OAuth | M1: Configure OAuth providers | ✅ Mapped |
| User profiles (name, photo, location, phone) | M1: Profile edit page | ✅ Mapped |
| Email verification | M1: Email verification status | ✅ Mapped |
| Roles (buyer/seller) | M1: Profiles table | ✅ Mapped |
| Rating display on profile | M1: Display user's ratings | ✅ Mapped |

**Architecture Reference**: Section 7.1 (Authentication Flow)

---

### 6.2 Product Publishing (PRD) → M2: Product Listings

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Title, description, price (BOB) | M2: Basic info form | ✅ Mapped |
| Category & subcategory | M2: Category selection (14 categories) | ✅ Mapped |
| Up to 3 photos (free tier) | M2: Image upload (up to 8 images) | ✅ Mapped |
| Location (city/department) | M2: Location selection | ✅ Mapped |
| Condition (new/used) | M2: Condition selection | ✅ Mapped |
| Availability toggle | M2: Availability toggle | ✅ Mapped |
| Edit/delete own products | M2: Product edit/delete | ✅ Mapped |
| Dashboard (my products, views) | M2: Product list component | ✅ Mapped |

**Architecture Reference**: Section 5.1 (Frontend Architecture), Section 6.2 (Database Schema - products table)

**Additional Reference**: `M2-product-listings/CATEGORIES.md` for complete category taxonomy

---

### 6.3 Search & Discovery (PRD) → M3 + M4 + M8

#### 6.3.1 Intelligent Search (PRD) → M3 + M4

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Text search with semantic understanding | M4: Semantic search | ✅ Mapped |
| Bolivian Spanish synonyms | M3: Bolivian Spanish synonyms dictionary | ✅ Mapped |
| Typo tolerance | M4: Semantic search (handles typos) | ✅ Mapped |
| Colloquial searches | M4: Natural language understanding | ✅ Mapped |
| Autocomplete | M3: Search bar with autocomplete | ✅ Mapped |
| Spelling correction | M3: Search suggestions | ✅ Mapped |
| Hybrid results (keyword + semantic) | M4: RRF algorithm | ✅ Mapped |

**Architecture Reference**: Section 8 (Search Architecture), Section 8.2 (Hybrid Search Implementation)

#### 6.3.2 Filters & Sorting (PRD) → M3

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Filter by category | M3: Filter sidebar | ✅ Mapped |
| Filter by price range | M3: Filter sidebar | ✅ Mapped |
| Filter by location | M3: Filter sidebar | ✅ Mapped |
| Filter by condition | M3: Filter sidebar | ✅ Mapped |
| Filter by date | M3: Filter sidebar | ✅ Mapped |
| Sort by relevance | M3: Sort options | ✅ Mapped |
| Sort by date | M3: Sort options | ✅ Mapped |
| Sort by price | M3: Sort options | ✅ Mapped |
| Sort by distance | M3: Sort options | ✅ Mapped |
| Sort by views | M3: Sort options | ✅ Mapped |

#### 6.3.3 Product Categories (PRD) → M2

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| 14 main categories | M2: Category selection | ✅ Mapped |
| 50+ subcategories | M2: Hierarchical categories | ✅ Mapped |
| Category icons | M2: Categories with emojis | ✅ Mapped |

**Reference**: See `M2-product-listings/CATEGORIES.md` for complete list

#### 6.3.4 Additional Discovery (PRD) → M8

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Similar products (embeddings) | M8: Product recommendations | ✅ Mapped |
| Related searches | M8: "Related searches" suggestions | ✅ Mapped |
| Main feed (recent + featured) | M8: Recent products feed | ✅ Mapped |
| Product detail page | M2: Product detail page | ✅ Mapped |
| Search history | M8: Track search history | ✅ Mapped |

#### 6.3.5 Search Metrics (PRD) → M8

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Click-through rate (CTR) | M8: Track CTR by position | ✅ Mapped |
| Search refinement rate | M8: Track search refinement | ✅ Mapped |
| Searches with no results | M8: Track no-result searches | ✅ Mapped |
| Time to contact seller | M8: Track conversion metrics | ✅ Mapped |

---

### 6.4 Contact & Communication (PRD) → M5: Real-time Chat

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| "Contact Seller" button | M5: Contact button on product page | ✅ Mapped |
| Internal chat (text messages) | M5: Chat conversation page | ✅ Mapped |
| WhatsApp redirect option | M5: WhatsApp redirect option | ✅ Mapped |
| Email notifications | M5: Email notifications for messages | ✅ Mapped |
| Push web notifications | M5: Push web notifications (optional) | ✅ Mapped |

**Architecture Reference**: Section 9 (Real-time Architecture), Section 4.2.3 (Real-time Chat Flow)

---

### 6.5 Reputation System (PRD) → M6: Favorites & Ratings

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Only buyers rate sellers | M6: Rating validation (buyer only) | ✅ Mapped |
| 1-5 star rating (required) | M6: Star rating component | ✅ Mapped |
| Optional comment (500 chars) | M6: Rating form with comment | ✅ Mapped |
| Must have conversation to rate | M6: Conversation validation | ✅ Mapped |
| One rating per user per product | M6: Prevent duplicate ratings | ✅ Mapped |
| Average rating calculation | M6: Calculate average rating | ✅ Mapped |
| Rating badges (New, Trusted, Top) | M6: Rating badges | ✅ Mapped |
| Edit within 7 days | M6: Edit rating logic | ✅ Mapped |
| Rate limiting (10/day) | M6: Rate limiting | ✅ Mapped |

**Architecture Reference**: Section 6.2 (Database Schema - ratings table)

---

### 6.6 Geolocation (PRD) → M7: Geolocation & Maps

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Department selection (9 departments) | M7: Department dropdown | ✅ Mapped |
| City selection | M7: City dropdown | ✅ Mapped |
| Optional GPS coordinates | M7: GPS capture from browser | ✅ Mapped |
| Manual location selection | M7: Manual dropdowns (default) | ✅ Mapped |
| IP geolocation fallback | M7: IP geolocation | ✅ Mapped |
| Distance-based search | M7: Proximity search | ✅ Mapped |
| Radius options (5km, 10km, etc.) | M7: Filter by distance radius | ✅ Mapped |
| Privacy (city-level only) | M7: Never show exact coordinates | ✅ Mapped |
| Map display (optional) | M7: Optional map display | ✅ Mapped |

**Architecture Reference**: Section 6.2 (Database Schema - PostGIS), Section 6.3 (Indexing Strategy - spatial indexes)

---

### 6.7 Content Moderation (PRD) → M9: Content Moderation

| PRD Feature | Milestone Task | Status |
|-------------|----------------|--------|
| Report products/users | M9: Report button and form | ✅ Mapped |
| Report reasons | M9: Report form with reasons | ✅ Mapped |
| Admin review workflow | M9: Admin panel | ✅ Mapped |
| Ban users/products | M9: Ban/delete actions | ✅ Mapped |
| Audit trail | M9: Log moderation actions | ✅ Mapped |

**Architecture Reference**: Section 6.2 (Database Schema - reports table)

---

## Architecture Components → Milestones

### Database Schema (Architecture Section 6) → Multiple Milestones

| Database Table | Milestone | Status |
|----------------|-----------|--------|
| `auth.users` | M1 | ✅ Mapped (Supabase managed) |
| `profiles` | M1 | ✅ Mapped |
| `products` | M2 | ✅ Mapped |
| `conversations` | M5 | ✅ Mapped |
| `messages` | M5 | ✅ Mapped |
| `favorites` | M6 | ✅ Mapped |
| `ratings` | M6 | ✅ Mapped |
| `reports` | M9 | ✅ Mapped |
| `demand_posts` | M4.7 | ✅ Mapped |
| `demand_offers` | M4.7 | ✅ Mapped |

### PostgreSQL Extensions (Architecture Section 6.3) → Milestones

| Extension | Purpose | Milestone | Status |
|-----------|---------|-----------|--------|
| `pgvector` | Vector similarity search | M4 | ✅ Mapped |
| `PostGIS` | Geospatial queries | M7 | ✅ Mapped |
| `pg_trgm` | Trigram similarity (typos) | M3 | ✅ Mapped |
| Full-Text Search | Spanish keyword search | M3 | ✅ Mapped |

### Supabase Services (Architecture Section 4.1) → Milestones

| Service | Purpose | Milestone | Status |
|---------|---------|-----------|--------|
| Supabase Auth | OAuth, JWT, Magic Links | M1 | ✅ Mapped |
| Supabase Storage | Image upload & CDN | M2 | ✅ Mapped |
| Supabase Realtime | WebSocket chat | M5 | ✅ Mapped |
| Edge Functions | Embedding generation | M4 | ✅ Mapped |
| PostgREST | Auto-generated API | M0-M11 | ✅ Mapped |
| Row Level Security | Database-level security | M1-M9 | ✅ Mapped |

### Search Architecture (Architecture Section 8) → M3 + M4

| Component | Description | Milestone | Status |
|-----------|-------------|-----------|--------|
| PostgreSQL FTS | Keyword search (Spanish) | M3 | ✅ Mapped |
| pgvector | Semantic search | M4 | ✅ Mapped |
| Hugging Face API | Embedding generation (MVP) | M4 | ✅ Mapped |
| RRF Algorithm | Hybrid search fusion | M4 | ✅ Mapped |
| Bolivian synonyms | Local language support | M3 | ✅ Mapped |

---

## Technology Stack (PRD Section 4.2) → M0: Foundation

| Technology | Purpose | Milestone | Status |
|------------|---------|-----------|--------|
| Next.js 14 | Frontend framework | M0 | ✅ Mapped |
| React 18 | UI library | M0 | ✅ Mapped |
| TypeScript | Type safety | M0 | ✅ Mapped |
| Tailwind CSS | Styling | M0 | ✅ Mapped |
| shadcn/ui | Component library | M0 | ✅ Mapped |
| Supabase | Backend BaaS | M0 | ✅ Mapped |
| Vercel | Frontend hosting | M11 | ✅ Mapped |
| Resend | Email service | M11 | ✅ Mapped |

---

## Cost Structure (PRD Section 4.2.5) → Milestones

### Phase 1: MVP (0-10K users) - $0/month

| Service | Free Tier Limit | Milestone | Status |
|---------|-----------------|-----------|--------|
| Supabase Database | 500MB | M0-M11 | ✅ Mapped |
| Supabase Storage | 1GB | M2 | ✅ Mapped |
| Supabase Bandwidth | 2GB/month | M0-M11 | ✅ Mapped |
| Edge Functions | 500K invocations/month | M4 | ✅ Mapped |
| Hugging Face API | 30K requests/month | M4 | ✅ Mapped |
| Vercel | 100GB bandwidth | M11 | ✅ Mapped |
| Resend | 3K emails/month | M11 | ✅ Mapped |

**Total MVP Cost**: $0/month (all milestones M0-M11)

---

## Delivered Outside Original PRD Scope

### M4.6: Share Profile Link (MVP Add-on)

This milestone was not in the original PRD but was prioritized to enable organic seller growth via WhatsApp sharing (a primary commerce channel in Bolivia).

| Feature | Milestone | Status |
|---------|-----------|--------|
| Copy profile URL to clipboard | M4.6 | ✅ Complete |
| Web Share API (native mobile share) | M4.6 | ✅ Complete |
| Business vs personal URL routing | M4.6 | ✅ Complete |
| Share from `/profile` (card variant) | M4.6 | ✅ Complete |
| Share from `/perfil/mis-productos` (compact variant) | M4.6 | ✅ Complete |
| Share individual products from actions dropdown | M4.6 (extension) | ✅ Complete |

**Documentation:** [M4.6 README](./M4.6-share-profile/README.md) | [M4.6 PRD](./M4.6-share-profile/PRD.md)

### Landing Page Quality Fixes (Maintenance)

Fixes identified by monkey-testing the landing page and search results.

| Fix | File(s) Changed | Status |
|-----|-----------------|--------|
| Custom Spanish 404 page | `app/not-found.tsx` | ✅ Complete |
| 7 static footer placeholder pages | `app/(static)/*/page.tsx` | ✅ Complete |
| Remove duplicate skip link | `app/page.tsx` | ✅ Complete |
| Hero search `required` attribute | `app/page.tsx` | ✅ Complete |
| LCP image `priority` on first result | `components/products/ProductGrid.tsx` | ✅ Complete |
| `maxLength={200}` on search inputs | `app/page.tsx`, `components/search/SearchBar.tsx` | ✅ Complete |
| Stale refresh token silent recovery | `lib/supabase/middleware.ts` | ✅ Complete |

---

## Phase 2 Features (Post-MVP)

These features are in the PRD but planned as Phase 2 (Post-Launch):

| Feature | PRD Section | Planned Milestone | Notes |
|---------|-------------|-------------------|-------|
| Demand-side posting ("Busco") | 7.2 | **M4.7** | Buyer posts what they need, sellers offer products. [Milestone docs](./M4.7-demand-side-busco/) |
| Image search | 7.1 | M13 | Upload photo to find similar |
| Voice search | 7.1 | M13 | Speech-to-text search |
| Mobile app | 7.4 | M14 | React Native (iOS/Android) |
| Payment gateway | 7.2 | M15 | Bolivian QR payments |
| Shipping system | 7.3 | M15 | Delivery integration |
| WhatsApp Business API | 7.5 | M16 | Direct integration |
| Advanced analytics | 7.6 | Phase 2 | Mixpanel/Amplitude |

---

## Validation Checklist

### PRD Coverage
- ✅ All Section 6 (MVP Features) mapped to milestones
- ✅ All core user stories covered
- ✅ All technical requirements included
- ✅ Cost structure aligned ($0/month MVP)

### Architecture Coverage
- ✅ All database tables mapped
- ✅ All PostgreSQL extensions included
- ✅ All Supabase services covered
- ✅ Search architecture fully mapped
- ✅ Real-time architecture included
- ✅ Security (RLS) in all relevant milestones

### Technology Stack
- ✅ All technologies from PRD Section 4.2 included
- ✅ Supabase as core BaaS (not Firebase)
- ✅ Serverless-first approach maintained
- ✅ No unnecessary services added

### Bolivian Context
- ✅ Spanish language support (M3)
- ✅ Bolivian Spanish synonyms (M3)
- ✅ 9 departments + major cities (M7)
- ✅ BOB currency (M2)
- ✅ Low-bandwidth optimization (M10)
- ✅ Mobile-first design (M0-M11)

---

## Discrepancies Resolved

### Original Issues Found:
1. ❌ Milestones mentioned "3 images" but PRD says "up to 8"
   - **Fixed**: M2 now says "up to 8 images"

2. ❌ Rating system was vague about "who can rate whom"
   - **Fixed**: M6 now explicitly states "only buyers rate sellers"

3. ❌ Geolocation was missing Bolivia-specific details
   - **Fixed**: M7 now includes 9 departments, city lists, privacy rules

4. ❌ Search didn't mention Bolivian Spanish synonyms
   - **Fixed**: M3 includes synonym dictionary

5. ❌ Chat missing WhatsApp option
   - **Fixed**: M5 includes WhatsApp redirect

6. ❌ Categories not detailed
   - **Fixed**: M2 references CATEGORIES.md with all 14 categories

### All Discrepancies: ✅ RESOLVED

---

## Conclusion

✅ **All PRD features (Section 6 - MVP) are mapped to milestones M0-M11**  
✅ **All Architecture components are implemented across milestones**  
✅ **Technology stack is consistent (Supabase-first)**  
✅ **Cost structure maintained ($0/month for MVP)**  
✅ **Bolivian context preserved throughout**  
✅ **No feature gaps or missing requirements**

The milestones are now **100% aligned** with the PRD and Architecture documents.

---

**Last Updated**: February 17, 2026  
**Reviewed By**: Alcides Cardenas  
**Status**: ✅ Complete Concordance
