# Telopillo.bo - System Architecture

**Version:** 1.3  
**Date:** February 17, 2026  
**Author:** Alcides Cardenas  
**Status:** Living Document (updated through M4.6 Share Profile + Landing Page Quality Fixes)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Principles](#3-architecture-principles)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Component Architecture](#5-component-architecture)
6. [Data Architecture](#6-data-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Search Architecture](#8-search-architecture)
9. [Real-time Architecture](#9-real-time-architecture)
10. [Testing Architecture](#10-testing-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Scalability Strategy](#12-scalability-strategy)
13. [Technology Decisions](#13-technology-decisions)

---

## 1. Executive Summary

Telopillo.bo is a serverless-first marketplace platform built on a Backend-as-a-Service (BaaS) architecture using Supabase as the core infrastructure. The system is designed to operate at **$0/month** during the MVP phase (0-10K users) and scale cost-effectively to support 50K+ users.

### Key Architectural Characteristics

- **Serverless-first:** Zero operational overhead, no servers to manage
- **Cost-optimized:** $0/month MVP → $25/month Growth → $50/month Scale
- **Mobile-first:** Optimized for low-bandwidth connections (Bolivia context)
- **Real-time capable:** Native WebSocket support for chat
- **Search-powered:** Hybrid keyword + semantic search with Bolivian Spanish understanding
- **Security-first:** Row Level Security (RLS) at database level

---

## 2. System Overview

### 2.1 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Google     │  │  Facebook    │  │  WhatsApp    │        │
│  │   OAuth      │  │   OAuth      │  │   Business   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TELOPILLO.BO PLATFORM                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Frontend Layer                         │ │
│  │           Next.js 16 + React 19 + TypeScript              │ │
│  │                   (Vercel Edge Network)                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Backend Layer (BaaS)                   │ │
│  │                        Supabase                           │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  PostgREST  │  │   Auth      │  │  Storage    │     │ │
│  │  │  (API)      │  │  (OAuth)    │  │  (S3-like)  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Realtime   │  │    Edge     │  │ PostgreSQL  │     │ │
│  │  │ (WebSocket) │  │  Functions  │  │ + pgvector  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Search & ML Layer (Optional)                 │ │
│  │          FastAPI + Sentence Transformers                  │ │
│  │              (Railway/Render - Phase 2+)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Hugging Face│  │    Resend    │  │  Cloudflare  │        │
│  │  Inference   │  │   (Email)    │  │   R2 (CDN)   │        │
│  │     API      │  │              │  │   (Optional) │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 User Flows

#### 2.2.1 Seller Flow
```
Register/Login → Complete Profile → (Optional) Add Business Profile →
Create Product Listing → Upload Images → Set Price & Details → Publish →
Share Profile Link via WhatsApp/Social →
Receive Inquiries from Buyers → Negotiate → Mark as Sold
```

#### 2.2.2 Buyer Flow
```
Browse/Search Products → View Details → Contact Seller (WhatsApp) →
Negotiate → Complete Transaction → Leave Rating
```

#### 2.2.3 Share Profile Flow (M4.6)
```
Authenticated Seller →
  Open /profile or /perfil/mis-productos →
  Click "Compartir perfil" →
  Mobile: Web Share API → native share sheet (WhatsApp, etc.)
  Desktop: Clipboard copy → toast "Enlace copiado" →
  Recipient opens /negocio/{slug} or /vendedor/{id} →
  Views products, contacts seller — no login required
```

---

## 3. Architecture Principles

### 3.1 Core Principles

1. **Serverless-First**
   - Minimize operational overhead
   - Leverage managed services
   - Pay only for what you use
   - Auto-scaling by default

2. **Cost-Optimized**
   - Target $0/month for MVP (0-10K users)
   - Clear scaling path with predictable costs
   - Use free tiers strategically
   - Optimize bandwidth and storage

3. **Security-First**
   - Row Level Security (RLS) at database level
   - JWT-based authentication
   - No client-side secrets
   - HTTPS everywhere

4. **Mobile-First**
   - Optimize for low bandwidth (Bolivia context)
   - Progressive image loading
   - Responsive design
   - Offline-capable (future)

5. **Developer Experience**
   - Type safety with TypeScript
   - Auto-generated APIs
   - Hot reload in development
   - Clear separation of concerns

### 3.2 Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Availability** | 99.9% uptime | Supabase SLA |
| **Performance** | < 2s page load | Lighthouse score > 90 |
| **Scalability** | 50K concurrent users | Horizontal scaling |
| **Security** | Zero data breaches | RLS + JWT + HTTPS |
| **Cost** | $0/month (MVP) | Supabase free tier |
| **Maintainability** | < 1 hour/week ops | Serverless architecture |

---

## 4. High-Level Architecture

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Mobile     │  │   Desktop    │  │    Tablet    │            │
│  │   Browser    │  │   Browser    │  │   Browser    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      FRONTEND LAYER                                 │
│                   (Next.js 16 App Router)                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Server Components (RSC)        Client Components          │  │
│  │  - SEO-optimized pages          - Interactive UI           │  │
│  │  - Data fetching                - Real-time updates        │  │
│  │  - Server-side rendering        - Form handling            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Supabase SDK (Client)                                      │  │
│  │  - Auth (JWT tokens)                                        │  │
│  │  - Database queries (PostgREST)                             │  │
│  │  - Real-time subscriptions                                  │  │
│  │  - Storage operations                                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Hosting: Vercel Edge Network (Global CDN)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ REST API / WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      BACKEND LAYER (BaaS)                           │
│                          Supabase                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     API GATEWAY                              │ │
│  │                      PostgREST                               │ │
│  │  - Auto-generated REST API from database schema             │ │
│  │  - CRUD operations (GET, POST, PATCH, DELETE)               │ │
│  │  - RPC functions support                                    │ │
│  │  - JWT authentication                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             │                                       │
│  ┌──────────────────────────┼───────────────────────────────────┐ │
│  │                          ▼                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │    Auth     │  │   Storage   │  │  Realtime   │        │ │
│  │  │             │  │             │  │             │        │ │
│  │  │ - OAuth 2.0 │  │ - S3-like   │  │ - WebSocket │        │ │
│  │  │ - JWT       │  │ - CDN       │  │ - Pub/Sub   │        │ │
│  │  │ - Magic     │  │ - Image     │  │ - Presence  │        │ │
│  │  │   Links     │  │   Transform │  │ - Broadcast │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │              Edge Functions (Deno)                  │  │ │
│  │  │                                                     │  │ │
│  │  │  - generate-embedding (product creation)           │  │ │
│  │  │  - send-notification (new message)                 │  │ │
│  │  │  - process-image (optimization)                    │  │ │
│  │  │  - cleanup-expired (cron job)                      │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                          │                                 │ │
│  │                          ▼                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │         PostgreSQL 15 + Extensions                  │  │ │
│  │  │                                                     │  │ │
│  │  │  - pgvector (vector similarity search)             │  │ │
│  │  │  - PostGIS (geolocation)                           │  │ │
│  │  │  - pg_trgm (trigram similarity)                    │  │ │
│  │  │  - Full-Text Search (Spanish config)               │  │ │
│  │  │  - Row Level Security (RLS)                        │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ (Optional - Phase 2+)
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    SEARCH & ML LAYER (Optional)                     │
│                  FastAPI + Sentence Transformers                    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  /api/embeddings/generate                                    │ │
│  │  - Generate text embeddings (384 dims)                       │ │
│  │  - Model: paraphrase-multilingual-MiniLM-L12-v2             │ │
│  │                                                              │ │
│  │  /api/search/hybrid                                          │ │
│  │  - Combine keyword + semantic search                         │ │
│  │  - Reciprocal Rank Fusion (RRF)                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Hosting: Railway/Render (512MB RAM, $7/month)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Architecture

#### 4.2.1 Product Creation Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Fill product form + upload images
       │
       ▼
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│                                         │
│  2. Validate form data                  │
│  3. Upload images to Supabase Storage   │
│  4. Get image URLs                      │
└──────┬──────────────────────────────────┘
       │
       │ 5. POST /rest/v1/products
       │    (with image URLs)
       │
       ▼
┌─────────────────────────────────────────┐
│         Supabase PostgREST              │
│                                         │
│  6. Validate JWT token                  │
│  7. Check RLS policies                  │
│  8. Insert into products table          │
└──────┬──────────────────────────────────┘
       │
       │ 9. Database INSERT trigger fires
       │
       ▼
┌─────────────────────────────────────────┐
│         PostgreSQL Trigger              │
│                                         │
│  10. Call Edge Function via HTTP POST   │
│      (product_id, title, description)   │
└──────┬──────────────────────────────────┘
       │
       │ 11. Invoke Edge Function
       │
       ▼
┌─────────────────────────────────────────┐
│    Edge Function: generate-embedding    │
│                                         │
│  12. Call Hugging Face API (MVP)        │
│      OR FastAPI (Growth)                │
│  13. Get embedding vector (384 dims)    │
│  14. UPDATE products SET embedding      │
└──────┬──────────────────────────────────┘
       │
       │ 15. Product ready for search
       │
       ▼
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│                                         │
│  - Product stored with embedding        │
│  - Full-text search vector generated    │
│  - Indexed for fast search              │
└─────────────────────────────────────────┘
```

#### 4.2.2 Search Flow (Hybrid)

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Enter search query: "iPhone 13 usado"
       │
       ▼
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│                                         │
│  2. Call search API                     │
└──────┬──────────────────────────────────┘
       │
       │ 3. Parallel search execution
       │
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│   Keyword    │  │    Semantic      │  │    Filters      │
│   Search     │  │    Search        │  │  (price, loc)   │
│              │  │                  │  │                 │
│ PostgreSQL   │  │ 1. Generate      │  │ Apply WHERE     │
│ Full-Text    │  │    embedding     │  │ clauses         │
│ Search       │  │ 2. pgvector      │  │                 │
│              │  │    similarity    │  │                 │
│ to_tsvector  │  │    search        │  │                 │
│ @@ tsquery   │  │ embedding <=>    │  │                 │
└──────┬───────┘  └────────┬─────────┘  └────────┬────────┘
       │                   │                      │
       │ 4. Results (50)   │ 5. Results (50)      │
       │                   │                      │
       └─────────────┬─────┴──────────────────────┘
                     │
                     │ 6. Merge results
                     │
                     ▼
       ┌──────────────────────────────┐
       │  Reciprocal Rank Fusion      │
       │  (RRF Algorithm)             │
       │                              │
       │  score = Σ 1/(k + rank_i)    │
       │  k = 60 (constant)           │
       └──────────────┬───────────────┘
                      │
                      │ 7. Top 20 results
                      │
                      ▼
       ┌──────────────────────────────┐
       │      Return to Frontend      │
       │                              │
       │  - Ranked products           │
       │  - Relevance scores          │
       │  - Facets for filtering      │
       └──────────────────────────────┘
```

#### 4.2.3 Real-time Chat Flow

```
┌─────────────┐                           ┌─────────────┐
│   Buyer     │                           │   Seller    │
│  (Browser)  │                           │  (Browser)  │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │ 1. Click "Contact Seller"               │
       │                                         │
       ▼                                         │
┌─────────────────────────────────────────┐     │
│         Next.js Frontend                │     │
│                                         │     │
│  2. Create conversation (if not exists) │     │
│  3. Subscribe to Realtime channel       │     │
└──────┬──────────────────────────────────┘     │
       │                                         │
       │ 4. WebSocket connection                 │
       │                                         │
       ▼                                         ▼
┌─────────────────────────────────────────────────────┐
│            Supabase Realtime Server                 │
│                                                     │
│  5. Authenticate JWT                                │
│  6. Check RLS policies                              │
│  7. Subscribe to conversation channel               │
└──────┬──────────────────────────────────────────────┘
       │
       │ 8. Buyer sends message
       │
       ▼
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
│                                         │
│  9. INSERT into messages table          │
│  10. Update conversation.last_message   │
│  11. Increment unread_count             │
└──────┬──────────────────────────────────┘
       │
       │ 12. Database change event
       │
       ▼
┌─────────────────────────────────────────────────────┐
│            Supabase Realtime Server                 │
│                                                     │
│  13. Broadcast to all subscribed clients            │
│      (buyer + seller)                               │
└──────┬──────────────────────────────────────────────┘
       │
       │ 14. WebSocket push
       │
       ├─────────────────────┬───────────────────────┐
       │                     │                       │
       ▼                     ▼                       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Buyer     │       │   Seller    │       │  Seller     │
│  (Browser)  │       │  (Browser)  │       │  (Mobile)   │
│             │       │             │       │             │
│ 15. Message │       │ 16. Message │       │ 17. Push    │
│     appears │       │     appears │       │     notif   │
└─────────────┘       └─────────────┘       └─────────────┘
```

---

## 5. Component Architecture

### 5.1 Frontend Architecture (Next.js 16)

> Note: Spanish route names are used throughout (Bolivian marketplace convention).
> Items marked `⏳` are planned for future milestones; all others are implemented.

```
app/                              # Next.js App Router
├── (auth)/                       # Auth route group (public, no Header/Footer wrapper)
│   ├── login/page.tsx            # Email + OAuth login
│   ├── register/page.tsx         # Registration with optional business section
│   ├── forgot-password/page.tsx  # Password recovery request
│   ├── reset-password/page.tsx   # Password reset (token-based)
│   └── layout.tsx                # Minimal auth layout
│
├── (static)/                     # Static content route group (LPQ fixes)
│   ├── acerca/page.tsx           # About page (placeholder)
│   ├── ayuda/page.tsx            # Help center (placeholder)
│   ├── contacto/page.tsx         # Contact page (placeholder)
│   ├── cookies/page.tsx          # Cookie policy (placeholder)
│   ├── privacidad/page.tsx       # Privacy policy (placeholder)
│   ├── seguridad/page.tsx        # Safety info (placeholder)
│   └── terminos/page.tsx         # Terms and conditions (placeholder)
│
├── auth/callback/route.ts        # Supabase OAuth callback handler
│
├── api/
│   └── search/route.ts           # Hybrid search endpoint (keyword + semantic)
│
├── buscar/page.tsx               # Search results with filters + sort
├── categorias/page.tsx           # Category browsing (9 categories)
│
├── negocio/[slug]/page.tsx       # Business storefront (public, SEO + JSON-LD)
├── vendedor/[id]/page.tsx        # Personal seller profile (public, SEO + JSON-LD)
│
├── productos/
│   ├── [id]/page.tsx             # Product detail (public, SEO + gallery)
│   └── [id]/editar/page.tsx      # Edit product (protected)
│
├── publicar/page.tsx             # Create product listing (protected)
│
├── profile/
│   ├── page.tsx                  # Seller dashboard (protected, ShareProfile card)
│   └── edit/page.tsx             # Edit profile + business profile (protected)
│
├── perfil/
│   └── mis-productos/page.tsx    # My products list (protected, compact ShareProfile)
│
├── mensajes/                     # ⏳ M5: Real-time chat
│   └── [conversationId]/
│
├── not-found.tsx                 # Custom Spanish 404 page
├── layout.tsx                    # Root layout (Header, Footer, skip link, AuthProvider)
├── page.tsx                      # Landing page (hero search, categories, features)
└── globals.css                   # Global styles + Tailwind v4

components/
├── ui/                           # shadcn/ui primitives
│   ├── button.tsx, input.tsx, card.tsx, badge.tsx
│   ├── alert-dialog.tsx, dropdown-menu.tsx
│   ├── avatar.tsx, select.tsx, separator.tsx
│   ├── skeleton.tsx, textarea.tsx, toast.tsx
│   ├── logo.tsx, radio-group.tsx, label.tsx
│   └── VerificationBadge.tsx     # Trust level badge (M4.5)
│
├── layout/                       # Shell components
│   ├── Header.tsx                # Responsive header with SearchBar + UserMenu
│   ├── Footer.tsx                # Footer with social links + static page links
│   └── UserMenu.tsx              # Auth-aware user menu (dropdown)
│
├── auth/
│   └── OAuthButtons.tsx          # Google + Facebook OAuth buttons
│
├── home/
│   └── CtaStrip.tsx              # CTA banner (shown to unauthenticated users)
│
├── search/
│   ├── SearchBar.tsx             # Controlled search input (header + mobile)
│   ├── SearchFilters.tsx         # Sidebar filters (category, price, dept, condition)
│   └── SearchSort.tsx            # Sort dropdown (relevance, price, date)
│
├── products/                     # Product-related components
│   ├── ProductCard.tsx           # Card with LCP priority support
│   ├── ProductGrid.tsx           # Grid (passes priority={index===0} to first card)
│   ├── ProductForm.tsx           # Create/edit form (Zod + react-hook-form)
│   ├── ProductFormWizard.tsx     # Step-by-step wizard variant
│   ├── ProductGallery.tsx        # Image gallery with navigation
│   ├── ProductActions.tsx        # Dropdown: edit, sell, delete, share product
│   ├── ImageUpload.tsx           # Multi-image drag-and-drop + WebP compression
│   ├── SellerCard.tsx            # Seller info + WhatsApp CTA on product detail
│   ├── CategoryGrid.tsx          # Category grid for /categorias
│   └── ShareButton.tsx           # Product-level Web Share / clipboard (M4.6)
│
├── profile/                      # Profile + seller components
│   ├── AvatarUpload.tsx          # Avatar upload with compression
│   ├── BusinessHoursEditor.tsx   # JSONB business hours editor
│   ├── BusinessProfileForm.tsx   # Business profile create/edit form
│   ├── LocationSelector.tsx      # Bolivia dept + city cascading selector
│   ├── SellerProfileHeader.tsx   # Header block for /vendedor/[id] page
│   └── ShareProfile.tsx          # Share link card + compact variants (M4.6)
│
├── business/                     # Business storefront components
│   ├── BusinessHeader.tsx        # Hero section for /negocio/[slug]
│   └── BusinessInfoSidebar.tsx   # Hours, contact, social links sidebar
│
└── providers/
    ├── AuthProvider.tsx          # React context for auth state
    └── ToastProvider.tsx         # Toast notification context

lib/
├── supabase/
│   ├── client.ts                 # Browser Supabase client
│   ├── server.ts                 # Server-side Supabase client (cookies)
│   ├── admin.ts                  # Service-role admin client
│   └── middleware.ts             # Session refresh + stale token recovery
│
├── validations/                  # Zod schemas + sanitization
├── utils/                        # Utility functions (image, format, etc.)
├── data/                         # Static data (categories, departments/cities)
└── constants.ts                  # App-wide constants
```

### 5.2 Backend Architecture (Supabase)

> Items marked `⏳` are planned for future milestones; all others are deployed.

```
supabase/
├── migrations/                   # 12 database migrations (numbered SQL files)
│   ├── *_initial_schema.sql      # profiles table, RLS, triggers, avatars bucket
│   ├── *_add_pgvector.sql        # vector(384) column + HNSW index on products
│   ├── *_add_fts.sql             # search_vector tsvector + GIN index + trigger
│   ├── *_add_rls_policies.sql    # RLS policies for products, profiles
│   ├── *_add_search_functions.sql# search_products(), rrf_hybrid_search() RPCs
│   ├── *_add_triggers.sql        # set_updated_at(), auto-embed trigger (pg_net)
│   ├── *_add_business_profiles.sql # business_profiles table, slug, RLS, storage
│   └── ...                       # Additional migrations as needed
│
├── functions/                    # Edge Functions (Deno runtime)
│   └── generate-embedding/       # ✅ DEPLOYED — auto-embed on product insert/update
│       └── index.ts              # Hugging Face API + retry logic + in-memory cache
│                                 # ⏳ send-notification (M5: chat notifications)
│                                 # ⏳ cleanup-expired (M4.7: demand post expiry)
│
├── config.toml                   # Supabase project configuration
└── .env.example                  # Environment variables template
```

**Deployed Edge Functions:**

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generate-embedding` | PostgreSQL trigger (pg_net HTTP POST) on `products` INSERT/UPDATE | Calls Hugging Face API to generate 384-dim embedding; stores result in `products.embedding`; includes 5-min in-memory cache |

**Deployed Storage Buckets:**

| Bucket | Access | Path Policy |
|--------|--------|-------------|
| `avatars` | Private | `{userId}/*` |
| `product-images` | Public | `{userId}/*` |
| `business-logos` | Public | `{userId}/*` |

### 5.3 Share Profile Architecture (M4.6)

The share feature is entirely client-side — zero backend changes required.

```
URL Computation (props-based):
  business account → {NEXT_PUBLIC_APP_URL}/negocio/{businessSlug}
  personal account → {NEXT_PUBLIC_APP_URL}/vendedor/{profileId}
  fallback base URL → https://telopillo.bo

Share Action (invocation-time detection — NOT useEffect):
  if (typeof navigator.share === 'function')
    → navigator.share({ title, text, url })     # Web Share API (mobile)
    → on AbortError: silent (user cancelled)
  else
    → navigator.clipboard.writeText(url)         # Clipboard fallback (desktop)
    → toast "Enlace copiado" / "No se pudo copiar"

Component Variants:
  <ShareProfile variant="card" />    → /profile page (URL preview + copy + share)
  <ShareProfile variant="compact" /> → /perfil/mis-productos (single inline button)
  <ShareButton />                    → ProductActions dropdown (product-level share)
```

**Key decision:** Web Share API detection happens at invocation time (inside the click handler), not in a `useEffect` on mount. This avoids:
- React hydration mismatches (server renders without `navigator`, client has it)
- ESLint warnings about synchronous `setState` inside effects

### 5.4 Search Service Architecture (Optional - Phase 2+)

```
search-service/
├── app/
│   ├── main.py                   # FastAPI application
│   ├── models.py                 # Pydantic models
│   ├── embeddings.py             # Embedding generation
│   ├── search.py                 # Search logic
│   └── config.py                 # Configuration
│
├── tests/
│   ├── test_embeddings.py
│   └── test_search.py
│
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker image
└── README.md
```

---

## 6. Data Architecture

### 6.1 Entity Relationship Diagram

```
┌─────────────────────┐
│     auth.users      │ (Supabase Auth - managed)
│                     │
│ - id (UUID)         │
│ - email             │
│ - created_at        │
└──────────┬──────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│      profiles       │
│                     │
│ - id (FK)           │◄─────────────┐
│ - full_name         │              │
│ - avatar_url        │              │
│ - phone             │              │
│ - phone_verified    │◄─── KYC      │
│ - verification_level│◄─── 0/1     │
│ - account_type      │◄─── legacy  │
│ - location_city     │              │
│ - location_dept     │              │
│ - rating_average    │              │
│ - rating_count      │              │
│ - is_verified       │              │
└──────────┬──────────┘              │
           │                         │
           │ 1:0..1                  │
           │                         │
           ▼                         │
┌─────────────────────┐              │
│  business_profiles  │ (Add-on)     │
│                     │              │
│ - id (FK profiles)  │              │
│ - business_name     │              │
│ - slug (unique)     │              │
│ - description       │              │
│ - business_dept     │              │
│ - business_city     │              │
│ - logo_url          │              │
│ - nit               │              │
│ - business_hours    │              │
│ - website_url       │              │
│ - social_whatsapp   │              │
│ - social_facebook   │              │
│ - social_instagram  │              │
│ - social_tiktok     │              │
└─────────────────────┘              │
                                     │
┌─────────────────────┐              │
│      products       │              │
│                     │              │
│ - id (UUID)         │              │
│ - user_id (FK)      │──────────────┘
│ - title             │
│ - description       │
│ - category          │
│ - subcategory       │
│ - price             │
│ - condition         │
│ - location_city     │
│ - location_coords   │
│ - images[]          │
│ - status            │
│ - embedding (vector)│◄─── pgvector for semantic search
│ - search_vector     │◄─── tsvector for keyword search
│ - views_count       │
│ - favorites_count   │
│ - created_at        │
└──────────┬──────────┘
           │
           │ 1:N
           │
           ├──────────────────┬──────────────────┬──────────────────┐
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  conversations   │ │    favorites     │ │     ratings      │ │     reports      │
│                  │ │                  │ │                  │ │                  │
│ - id             │ │ - id             │ │ - id             │ │ - id             │
│ - product_id (FK)│ │ - user_id (FK)   │ │ - product_id (FK)│ │ - reporter_id    │
│ - buyer_id (FK)  │ │ - product_id (FK)│ │ - from_user (FK) │ │ - reported_type  │
│ - seller_id (FK) │ │ - created_at     │ │ - to_user (FK)   │ │ - reported_id    │
│ - last_msg_at    │ └──────────────────┘ │ - rating (1-5)   │ │ - reason         │
│ - unread_count   │                      │ - comment        │ │ - status         │
└────────┬─────────┘                      └──────────────────┘ └──────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────┐
│     messages     │
│                  │
│ - id             │
│ - conversation_id│
│ - sender_id (FK) │
│ - content        │
│ - is_read        │
│ - created_at     │
└──────────────────┘
```

### 6.2 Database Schema Details

#### 6.2.1 Core Tables

**profiles** (extends auth.users)
- Stores user profile information
- 1:1 relationship with auth.users
- Includes location data for geolocation
- Reputation system (rating_average, rating_count)
- Verification level (0 = email only, 1 = phone verified)
- RLS: Public profiles viewable, users can only edit own

**business_profiles** (optional add-on to profiles)
- Optional business identity layer (1:0..1 with profiles)
- Row existence = user has a business (source of truth)
- Business name, slug (unique, URL-friendly), description
- Business location, logo, NIT, business hours (JSONB)
- Social links (WhatsApp, Facebook, Instagram, TikTok, website)
- RLS: Public viewing, users can only manage own
- Storage: `business-logos` public bucket for logos

**products**
- Main product listing table
- Includes vector embedding (384 dims) for semantic search
- Includes tsvector for keyword search (Spanish config)
- Location data for proximity search
- Status tracking (active, sold, inactive, deleted)
- RLS: Active products viewable by all, users manage own

**conversations**
- Junction table for buyer-seller chat
- Links product, buyer, and seller
- Tracks unread message counts
- RLS: Users can only see own conversations

**messages**
- Chat messages within conversations
- Real-time subscriptions via Supabase Realtime
- Read status tracking
- RLS: Users can only see messages from own conversations

**favorites**
- User's saved products (wishlist)
- Many-to-many relationship (users ↔ products)
- RLS: Users can only manage own favorites

**ratings**
- Seller reputation system
- 1-5 star ratings with optional comment
- Auto-updates user's rating_average
- RLS: Anyone can view, only transaction participants can rate

**reports**
- Content moderation system
- Report products, users, or messages
- Admin workflow (pending → reviewing → resolved)
- RLS: Users can create and view own reports

### 6.3 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Geolocation indexes (PostGIS)
CREATE INDEX idx_products_location ON products USING GIST(location_coordinates);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location_coordinates);

-- Full-Text Search index (Spanish)
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);

-- Vector similarity index (HNSW algorithm)
CREATE INDEX idx_products_embedding ON products 
  USING hnsw (embedding vector_cosine_ops);

-- Chat indexes
CREATE INDEX idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations(seller_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Click "Login with Google"
       │
       ▼
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│                                         │
│  2. Redirect to Supabase Auth           │
└──────┬──────────────────────────────────┘
       │
       │ 3. OAuth flow
       │
       ▼
┌─────────────────────────────────────────┐
│         Supabase Auth                   │
│                                         │
│  4. Redirect to Google OAuth            │
└──────┬──────────────────────────────────┘
       │
       │ 5. User authorizes
       │
       ▼
┌─────────────────────────────────────────┐
│         Google OAuth                    │
│                                         │
│  6. Return authorization code           │
└──────┬──────────────────────────────────┘
       │
       │ 7. Exchange code for tokens
       │
       ▼
┌─────────────────────────────────────────┐
│         Supabase Auth                   │
│                                         │
│  8. Create/update user in auth.users    │
│  9. Generate JWT access token           │
│  10. Generate refresh token             │
└──────┬──────────────────────────────────┘
       │
       │ 11. Redirect with tokens
       │
       ▼
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│                                         │
│  12. Store tokens in httpOnly cookie    │
│  13. Create profile if not exists       │
│  14. Redirect to home page              │
└─────────────────────────────────────────┘
```

### 7.2 Row Level Security (RLS) Policies

#### Products Table
```sql
-- Anyone can view active products
CREATE POLICY "view_active_products"
ON products FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

-- Users can create their own products
CREATE POLICY "create_own_products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "update_own_products"
ON products FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own products
CREATE POLICY "delete_own_products"
ON products FOR DELETE
USING (auth.uid() = user_id);
```

#### Messages Table
```sql
-- Users can view messages from their conversations
CREATE POLICY "view_own_messages"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

-- Users can send messages to their conversations
CREATE POLICY "send_messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);
```

### 7.3 Security Best Practices

1. **JWT Token Management**
   - Access tokens: 1 hour expiration
   - Refresh tokens: 30 days expiration
   - Stored in httpOnly cookies (not localStorage)
   - Auto-refresh on expiration via `@supabase/ssr` in Next.js middleware
   - **Stale token recovery:** `lib/supabase/middleware.ts` wraps `getUser()` in a try/catch; on `refresh_token_not_found` error, all `sb-*` auth cookies are cleared (`maxAge: 0`) so the browser stops sending the stale token on subsequent requests — prevents repeated `AuthApiError` noise in logs

2. **API Security**
   - All API calls require valid JWT
   - RLS enforced at database level
   - Rate limiting via Supabase
   - CORS configured for production domain only

3. **Data Protection**
   - Sensitive data encrypted at rest (Supabase default)
   - HTTPS everywhere (TLS 1.3)
   - No client-side secrets
   - Environment variables for all keys

4. **Input Validation**
   - Server-side validation for all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (React auto-escaping)
   - File upload validation (type, size, content)

5. **Content Moderation**
   - User reporting system
   - Admin review workflow
   - Automated flagging (future: ML-based)
   - Ability to ban users/products

---

## 8. Search Architecture

### 8.1 Hybrid Search Strategy

Telopillo.bo implements a **hybrid search** combining:
1. **Keyword search** (PostgreSQL Full-Text Search)
2. **Semantic search** (pgvector + embeddings)
3. **Reciprocal Rank Fusion** (RRF) to merge results

```
┌─────────────────────────────────────────────────────────────┐
│                    SEARCH ARCHITECTURE                      │
│                                                             │
│  User Query: "tele grande para ver fútbol"                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Query Processing                       │  │
│  │                                                     │  │
│  │  1. Normalize query (lowercase, trim)              │  │
│  │  2. Extract filters (price, location, category)    │  │
│  │  3. Generate embedding (if semantic search enabled)│  │
│  └─────────────────┬───────────────────────────────────┘  │
│                    │                                       │
│                    │ Parallel execution                    │
│                    │                                       │
│        ┌───────────┴───────────┐                          │
│        │                       │                          │
│        ▼                       ▼                          │
│  ┌──────────────┐      ┌──────────────────┐              │
│  │   Keyword    │      │    Semantic      │              │
│  │   Search     │      │    Search        │              │
│  │              │      │                  │              │
│  │ PostgreSQL   │      │ 1. Embedding     │              │
│  │ Full-Text    │      │    generation    │              │
│  │ Search       │      │ 2. pgvector      │              │
│  │              │      │    similarity    │              │
│  │ Finds:       │      │                  │              │
│  │ - "tele"     │      │ Finds:           │              │
│  │ - "grande"   │      │ - "televisor"    │              │
│  │ - "fútbol"   │      │ - "smart TV"     │              │
│  │              │      │ - "pantalla 50"  │              │
│  └──────┬───────┘      └────────┬─────────┘              │
│         │                       │                         │
│         │ Results (50)          │ Results (50)            │
│         │                       │                         │
│         └───────────┬───────────┘                         │
│                     │                                     │
│                     ▼                                     │
│         ┌───────────────────────┐                        │
│         │ Reciprocal Rank       │                        │
│         │ Fusion (RRF)          │                        │
│         │                       │                        │
│         │ score(d) = Σ 1/(k+r)  │                        │
│         │ k = 60                │                        │
│         └───────────┬───────────┘                        │
│                     │                                     │
│                     ▼                                     │
│         ┌───────────────────────┐                        │
│         │ Apply Filters         │                        │
│         │ - Price range         │                        │
│         │ - Location            │                        │
│         │ - Category            │                        │
│         │ - Condition           │                        │
│         └───────────┬───────────┘                        │
│                     │                                     │
│                     ▼                                     │
│         ┌───────────────────────┐                        │
│         │ Ranking & Sorting     │                        │
│         │ - Relevance score     │                        │
│         │ - Distance (geo)      │                        │
│         │ - Recency             │                        │
│         │ - Featured products   │                        │
│         └───────────┬───────────┘                        │
│                     │                                     │
│                     ▼                                     │
│         ┌───────────────────────┐                        │
│         │ Top 20 Results        │                        │
│         └───────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Search Implementation

#### 8.2.1 Keyword Search (PostgreSQL Full-Text Search)

```sql
-- Spanish configuration for better stemming
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);

-- Function for keyword search
CREATE OR REPLACE FUNCTION search_products_keyword(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  images TEXT[],
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.images,
    ts_rank(
      p.search_vector,
      plainto_tsquery('spanish', search_query)
    ) as rank
  FROM products p
  WHERE 
    p.status = 'active'
    AND p.search_vector @@ plainto_tsquery('spanish', search_query)
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (location_filter IS NULL OR p.location_city = location_filter)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

#### 8.2.2 Semantic Search (pgvector)

```sql
-- Function for semantic search
CREATE OR REPLACE FUNCTION search_products_semantic(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 50,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  images TEXT[],
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.images,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM products p
  WHERE 
    p.status = 'active'
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

#### 8.2.3 Hybrid Search (RRF Fusion)

```typescript
// lib/search/hybrid.ts
export async function hybridSearch(
  query: string,
  filters: SearchFilters
): Promise<Product[]> {
  const supabase = createClient()
  
  // 1. Generate embedding for query (MVP: Hugging Face API)
  const queryEmbedding = await generateEmbedding(query)
  
  // 2. Execute keyword and semantic search in parallel
  const [keywordResults, semanticResults] = await Promise.all([
    supabase.rpc('search_products_keyword', {
      search_query: query,
      category_filter: filters.category,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      location_filter: filters.location,
      result_limit: 50
    }),
    supabase.rpc('search_products_semantic', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 50,
      category_filter: filters.category,
      min_price: filters.minPrice,
      max_price: filters.maxPrice
    })
  ])
  
  // 3. Merge results using Reciprocal Rank Fusion
  const mergedResults = reciprocalRankFusion(
    keywordResults.data || [],
    semanticResults.data || [],
    k = 60
  )
  
  // 4. Return top 20 results
  return mergedResults.slice(0, 20)
}

// Reciprocal Rank Fusion algorithm
function reciprocalRankFusion(
  keywordResults: Product[],
  semanticResults: Product[],
  k: number = 60
): Product[] {
  const scores = new Map<string, number>()
  
  // Score keyword results
  keywordResults.forEach((product, index) => {
    const score = 1 / (k + index + 1)
    scores.set(product.id, (scores.get(product.id) || 0) + score)
  })
  
  // Score semantic results
  semanticResults.forEach((product, index) => {
    const score = 1 / (k + index + 1)
    scores.set(product.id, (scores.get(product.id) || 0) + score)
  })
  
  // Sort by combined score
  const allProducts = [...keywordResults, ...semanticResults]
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.id, p])).values()
  )
  
  return uniqueProducts.sort((a, b) => {
    return (scores.get(b.id) || 0) - (scores.get(a.id) || 0)
  })
}
```

### 8.3 Bolivian Spanish Optimizations

```sql
-- Synonym dictionary for Bolivian Spanish
CREATE TEXT SEARCH DICTIONARY bolivian_synonyms (
  TEMPLATE = synonym,
  SYNONYMS = bolivian_synonyms
);

-- bolivian_synonyms.txt
chompa,buzo,sudadera
auto,carro,vehículo,automóvil
tele,televisor,tv,pantalla
celu,celular,móvil,teléfono
compu,computadora,pc,laptop
refri,refrigerador,heladera,nevera

-- Apply to search configuration
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR asciiword, word
  WITH bolivian_synonyms, spanish_stem;
```

---

## 9. Real-time Architecture

### 9.1 Supabase Realtime Overview

Supabase Realtime provides three types of real-time functionality:

1. **Database Changes** (postgres_changes)
   - Listen to INSERT, UPDATE, DELETE on tables
   - Filtered by table, schema, or specific rows
   - Used for: chat messages, product updates

2. **Broadcast** (broadcast)
   - Send ephemeral messages between clients
   - Not persisted to database
   - Used for: typing indicators, presence

3. **Presence** (presence)
   - Track which users are online
   - Automatic cleanup on disconnect
   - Used for: online status, active users

### 9.2 Chat Real-time Implementation

```typescript
// app/chat/[conversationId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function ChatPage({ 
  params 
}: { 
  params: { conversationId: string } 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    // 1. Load existing messages
    loadMessages()

    // 2. Create Realtime channel
    const newChannel = supabase.channel(`conversation:${params.conversationId}`)

    // 3. Listen to new messages (Database Changes)
    newChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${params.conversationId}`
      },
      (payload) => {
        console.log('New message:', payload.new)
        setMessages((prev) => [...prev, payload.new as Message])
        scrollToBottom()
      }
    )

    // 4. Listen to message updates (read status)
    newChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${params.conversationId}`
      },
      (payload) => {
        console.log('Message updated:', payload.new)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? (payload.new as Message) : msg
          )
        )
      }
    )

    // 5. Track presence (online users)
    newChannel.on('presence', { event: 'sync' }, () => {
      const state = newChannel.presenceState()
      const users = Object.keys(state)
      setOnlineUsers(users)
      console.log('Online users:', users)
    })

    // 6. Listen to typing indicators (Broadcast)
    newChannel.on('broadcast', { event: 'typing' }, (payload) => {
      const userId = payload.payload.user_id
      setTypingUsers((prev) => new Set(prev).add(userId))
      
      // Clear typing after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }, 3000)
    })

    // 7. Subscribe to channel
    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Track own presence
          await newChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          })
        }
      }
    })

    setChannel(newChannel)

    // Cleanup: Unsubscribe on unmount
    return () => {
      newChannel.unsubscribe()
    }
  }, [params.conversationId])

  async function sendMessage(content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        content: content.trim()
      })

    if (error) {
      console.error('Error sending message:', error)
    }
  }

  function handleTyping() {
    if (!channel) return
    
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id }
    })
  }

  // ... rest of component
}
```

### 9.3 Real-time Performance Optimization

1. **Channel Management**
   - One channel per conversation
   - Unsubscribe when leaving page
   - Reuse channels when possible

2. **Message Batching**
   - Group rapid updates
   - Debounce typing indicators
   - Throttle presence updates

3. **Selective Subscriptions**
   - Only subscribe to active conversations
   - Unsubscribe from inactive channels
   - Use filters to reduce payload

4. **Connection Management**
   - Auto-reconnect on disconnect
   - Exponential backoff on errors
   - Heartbeat to keep connection alive

---

## 10. Testing Architecture

### 10.1 Testing Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **E2E Framework** | Playwright 1.58+ | Browser automation, assertions, screenshots |
| **Accessibility** | axe-core (`@axe-core/playwright`) | WCAG 2.2 AA compliance scanning |
| **Browser** | Chromium (Desktop Chrome) | Single project; Firefox/WebKit planned |
| **CI Config** | 2 retries, 1 worker, trace on first retry | Stability in CI environments |
| **Test Account** | `dev@telopillo.test` / `DevTest123` | Pre-seeded development account |

### 10.2 Test Organization

Tests are organized by **complete business flows**, not by page or component:

```
tests/
├── e2e/                              # Organized E2E tests (229 test cases)
│   ├── TEST_PLAN.md                  # Master plan, execution order, coverage matrix
│   ├── auth/                         # 3 specs, 39 tests
│   │   ├── PLAN.md                   # Flow plan for automation agents
│   │   ├── login.spec.ts
│   │   ├── registration.spec.ts
│   │   └── password-recovery.spec.ts
│   ├── buyer-journey/                # 5 specs, 44 tests
│   │   ├── PLAN.md
│   │   ├── homepage-to-search.spec.ts
│   │   ├── product-detail.spec.ts
│   │   ├── seller-profiles.spec.ts
│   │   ├── contact-seller.spec.ts
│   │   └── complete-buyer-flow.spec.ts
│   ├── seller-journey/               # 4 specs, 28 tests
│   │   ├── PLAN.md
│   │   ├── create-product.spec.ts
│   │   ├── manage-products.spec.ts
│   │   ├── edit-product.spec.ts
│   │   └── complete-seller-flow.spec.ts
│   ├── business-seller/              # 3 specs, 16 tests
│   │   ├── PLAN.md
│   │   ├── register-business.spec.ts
│   │   ├── storefront.spec.ts
│   │   └── complete-business-flow.spec.ts
│   ├── search-discovery/             # 5 specs, 35 tests
│   │   ├── PLAN.md
│   │   ├── keyword-search.spec.ts
│   │   ├── semantic-search.spec.ts
│   │   ├── filters-sort.spec.ts
│   │   ├── categories.spec.ts
│   │   └── search-api.spec.ts
│   ├── account-management/           # 4 specs, 31 tests
│   │   ├── PLAN.md
│   │   ├── profile-view.spec.ts
│   │   ├── profile-edit.spec.ts
│   │   ├── avatar-upload.spec.ts
│   │   └── product-management.spec.ts
│   └── cross-cutting/                # 5 specs, 48 tests
│       ├── PLAN.md
│       ├── accessibility-audit.spec.ts
│       ├── mobile-responsive.spec.ts
│       ├── navigation-layout.spec.ts
│       ├── seo-metadata.spec.ts
│       └── error-pages.spec.ts
├── fixtures/                         # Shared fixtures (planned)
│   └── PLAN.md
├── helpers/                          # Shared helpers (planned)
│   └── PLAN.md
└── *.spec.ts                         # 11 legacy test files (pre-reorganization)
```

### 10.3 Test Execution Order

```
auth/                    ← Run first (creates sessions)
  ├─► buyer-journey/     ← Needs: seeded products, optional auth
  ├─► seller-journey/    ← Needs: authenticated user
  ├─► business-seller/   ← Needs: authenticated user with business
  ├─► search-discovery/  ← Needs: seeded products
  ├─► account-management/← Needs: authenticated user with products
  └─► cross-cutting/     ← Runs last, audits all pages
```

### 10.4 Coverage Per Route

Each route is tested for 4 dimensions:

| Dimension | Tool/Method | Standard |
|-----------|-------------|----------|
| **Happy Path** | Playwright assertions | Complete user flow from start to finish |
| **Error Cases** | Validation, 404s, edge cases | All known error states |
| **Mobile** | 375x812 viewport | No horizontal scroll, touch targets >= 44px |
| **Accessibility** | axe-core WCAG 2.2 AA | Zero critical/serious violations |

### 10.5 AI-Assisted Testing

Custom Cursor subagents accelerate the testing workflow:

| Subagent | Role |
|----------|------|
| `e2e-test-planner` | Produces structured test plans (step tables, selectors, assertions) |
| `e2e-test-writer` | Converts plans into Playwright spec files |
| `quality-gate` | Validates test output against requirements |
| `accessibility-expert` | Reviews WCAG compliance |

Test plans use a machine-readable format (markdown tables with selectors and assertions) that the `e2e-test-writer` agent can consume directly.

---

## 11. Deployment Architecture

### 11.1 Production Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (TLS 1.3)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Vercel Edge Network                          │
│                   (Global CDN - 100+ PoPs)                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Next.js Application                          │ │
│  │                                                           │ │
│  │  - Server-Side Rendering (SSR)                           │ │
│  │  - Static Site Generation (SSG)                          │ │
│  │  - API Routes                                            │ │
│  │  - Edge Middleware (Auth)                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Auto-scaling: 0 → ∞ instances                                 │
│  Cold start: < 100ms                                           │
│  Cost: $0/month (100GB bandwidth)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API / WebSocket
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Supabase Cloud                               │
│                  (Multi-region: US East)                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL 15 (Managed)                      │ │
│  │                                                           │ │
│  │  - Database: 500MB (free) → 8GB (Pro)                    │ │
│  │  - Connections: 60 (free) → 500 (Pro)                    │ │
│  │  - Backups: Daily (7 days retention)                     │ │
│  │  - Extensions: pgvector, PostGIS, pg_trgm                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Supabase Storage (S3-compatible)             │ │
│  │                                                           │ │
│  │  - Storage: 1GB (free) → 100GB (Pro)                     │ │
│  │  - CDN: Included                                          │ │
│  │  - Image transformations: On-the-fly                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Edge Functions (Deno Runtime)                │ │
│  │                                                           │ │
│  │  - Invocations: 500K/month (free) → 2M/month (Pro)       │ │
│  │  - Timeout: 10s (free) → 60s (Pro)                       │ │
│  │  - Memory: 256MB → 512MB                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Cost: $0/month (free tier) → $25/month (Pro)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ (Optional - Phase 2+)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Railway / Render                             │
│                  (FastAPI Search Service)                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              FastAPI Application                          │ │
│  │                                                           │ │
│  │  - Sentence Transformers (118MB model)                   │ │
│  │  - Embedding generation                                  │ │
│  │  - Hybrid search endpoint                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Resources: 512MB RAM, 0.5 vCPU                                │
│  Cost: $7/month (Starter) → $25/month (Standard)               │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                             │
│                                                                 │
│  Developer                                                      │
│      │                                                          │
│      │ git push                                                 │
│      ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GitHub Repository                     │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       │ Webhook                                 │
│                       │                                         │
│           ┌───────────┴──────────┐                             │
│           │                      │                             │
│           ▼                      ▼                             │
│  ┌─────────────────┐   ┌─────────────────┐                    │
│  │  Vercel Build   │   │ Supabase CLI    │                    │
│  │                 │   │                 │                    │
│  │ 1. Install deps │   │ 1. Run migrations│                   │
│  │ 2. Build Next.js│   │ 2. Deploy Edge  │                    │
│  │ 3. Run tests    │   │    Functions    │                    │
│  │ 4. Deploy       │   │ 3. Update schema│                    │
│  └────────┬────────┘   └────────┬────────┘                    │
│           │                     │                              │
│           │ Success             │ Success                      │
│           │                     │                              │
│           ▼                     ▼                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Production Environment                     │  │
│  │                                                         │  │
│  │  - Frontend: Vercel Edge Network                       │  │
│  │  - Backend: Supabase Cloud                             │  │
│  │  - Search: Railway/Render (optional)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Environment Configuration

```bash
# .env.production (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://telopillo.bo

# Edge Functions (Supabase)
HUGGINGFACE_API_KEY=hf_xxx...
RESEND_API_KEY=re_xxx...
FASTAPI_URL=https://search.telopillo.bo (optional)

# FastAPI (Railway/Render - optional)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2
```

---

## 12. Scalability Strategy

### 12.1 Scaling Phases

#### Phase 1: MVP (0-10K users)
**Cost: $0/month**

```
Capacity:
- 500MB database (~50,000 products)
- 1GB storage (~5,000 images)
- 2GB bandwidth/month (~10,000 users)
- 500K edge function invocations/month

Bottlenecks:
- Bandwidth (2GB/month)
- Storage (1GB)

Mitigation:
- Image optimization (WebP, lazy loading)
- CDN caching
- Compress responses
```

#### Phase 2: Growth (10K-50K users)
**Cost: $25-50/month**

```
Upgrades:
- Supabase Pro: $25/month
  - 8GB database
  - 100GB storage
  - 50GB bandwidth
  - 2M edge function invocations

- FastAPI on Render: $7/month (optional)
  - 512MB RAM
  - Dedicated embeddings service

Capacity:
- 500,000 products
- 50,000 images
- 50K users/month

Optimizations:
- Add Cloudflare R2 for images ($0.015/GB)
- Implement caching layer (Redis)
- Database read replicas
```

#### Phase 3: Scale (50K-100K users)
**Cost: $100-300/month**

```
Upgrades:
- Supabase Pro: $25/month
- Render Standard: $25/month (2GB RAM)
- Cloudflare R2: $20/month (100GB storage)
- Redis Cloud: $10/month (caching)
- Additional services as needed

Capacity:
- 1M products
- 100K images
- 100K users/month

Optimizations:
- Database sharding by region
- Multi-region deployment
- Advanced caching strategies
- CDN optimization
```

### 12.2 Performance Optimization

#### Database Optimization
```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET shared_buffers = '2GB';

-- Query optimization
EXPLAIN ANALYZE SELECT ...;

-- Materialized views for expensive queries
CREATE MATERIALIZED VIEW popular_products AS
SELECT 
  p.*,
  COUNT(f.id) as favorites_count,
  AVG(r.rating) as avg_rating
FROM products p
LEFT JOIN favorites f ON f.product_id = p.id
LEFT JOIN ratings r ON r.product_id = p.id
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY favorites_count DESC, avg_rating DESC
LIMIT 100;

-- Refresh materialized view (cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
```

#### Frontend Optimization
```typescript
// Image optimization
import Image from 'next/image'

<Image
  src={productImage}
  alt={productTitle}
  width={800}
  height={600}
  loading="lazy"
  quality={80}
  format="webp"
/>

// Code splitting
const ChatComponent = dynamic(() => import('@/components/chat/Chat'), {
  loading: () => <Skeleton />,
  ssr: false
})

// React Server Components (RSC)
// Fetch data on server, reduce client bundle
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id) // Server-side fetch
  
  return <ProductDetail product={product} />
}
```

#### Caching Strategy
```typescript
// Next.js caching
export const revalidate = 3600 // Revalidate every hour

// Supabase caching
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(20)
  .cache(3600) // Cache for 1 hour

// Redis caching (Phase 3)
const cachedProducts = await redis.get(`products:${category}`)
if (cachedProducts) {
  return JSON.parse(cachedProducts)
}

const products = await fetchProducts(category)
await redis.setex(`products:${category}`, 3600, JSON.stringify(products))
return products
```

---

## 13. Technology Decisions

### 13.1 Technology Matrix

| Category | Technology | Rationale | Alternatives Considered |
|----------|-----------|-----------|------------------------|
| **Frontend Framework** | Next.js 16 | SSR for SEO, App Router, Vercel integration | Remix, SvelteKit, Astro |
| **UI Library** | React 19 | Large ecosystem, Server Components | Vue, Svelte, Solid |
| **Styling** | Tailwind CSS | Utility-first, fast development | CSS Modules, Styled Components |
| **Component Library** | shadcn/ui | Customizable, accessible, free | Material-UI, Chakra UI |
| **Backend BaaS** | Supabase | All-in-one, $0/month MVP, open-source | Firebase, AWS Amplify, Appwrite |
| **Database** | PostgreSQL 15 | Mature, pgvector support, full-text search | MongoDB, MySQL, CockroachDB |
| **Auth** | Supabase Auth | OAuth built-in, JWT, magic links | Auth0, Clerk, NextAuth |
| **Storage** | Supabase Storage | S3-compatible, CDN, image transforms | AWS S3, Cloudflare R2 |
| **Real-time** | Supabase Realtime | WebSocket, pub/sub, presence | Socket.io, Pusher, Ably |
| **Search** | PostgreSQL FTS + pgvector | Hybrid search, no additional service | Algolia, Meilisearch, Elasticsearch |
| **Embeddings** | Hugging Face API → FastAPI | Free tier, then self-hosted | OpenAI, Cohere, Vertex AI |
| **Hosting** | Vercel | Edge network, Next.js optimized | Netlify, Cloudflare Pages |
| **Email** | Resend | 3K/month free, great DX | SendGrid, Mailgun, AWS SES |
| **Monitoring** | Supabase Dashboard | Built-in, logs, metrics | Datadog, New Relic, Sentry |

### 13.2 Decision Log

#### Decision 1: Supabase vs Firebase
**Date:** January 2026  
**Status:** Accepted

**Context:**
Need a Backend-as-a-Service (BaaS) for MVP with minimal cost.

**Options:**
1. Supabase (PostgreSQL-based)
2. Firebase (NoSQL-based)
3. AWS Amplify

**Decision:** Supabase

**Rationale:**
- PostgreSQL with pgvector for semantic search
- Full-text search built-in (no additional service)
- Open-source (no vendor lock-in)
- More generous free tier
- Better for relational data (products, users, conversations)

**Consequences:**
- ✅ $0/month for MVP
- ✅ Can self-host if needed
- ✅ SQL expertise transferable
- ❌ Smaller ecosystem than Firebase
- ❌ Fewer integrations

---

#### Decision 2: Hybrid Search (Keyword + Semantic)
**Date:** January 2026  
**Status:** Accepted

**Context:**
Search is the main differentiator. Need to understand Bolivian Spanish.

**Options:**
1. Keyword-only (PostgreSQL FTS)
2. Semantic-only (pgvector)
3. Hybrid (both)
4. External service (Algolia, Meilisearch)

**Decision:** Hybrid (Keyword + Semantic)

**Rationale:**
- Keyword search: Fast, exact matches, filters
- Semantic search: Understands intent, synonyms, typos
- RRF fusion: Best of both worlds
- Cost: $0 (built into PostgreSQL)

**Consequences:**
- ✅ Best search quality
- ✅ No additional cost
- ✅ Handles Bolivian Spanish nuances
- ❌ More complex implementation
- ❌ Requires embedding generation

---

#### Decision 3: Serverless Embeddings (MVP)
**Date:** February 2026  
**Status:** Accepted

**Context:**
Need embeddings for semantic search. Budget: $0 for MVP.

**Options:**
1. Hugging Face Inference API (serverless, free)
2. FastAPI self-hosted (Railway/Render, $7/month)
3. OpenAI API (paid, $0.0001/1K tokens)

**Decision:** Hugging Face API for MVP, migrate to FastAPI in Growth phase

**Rationale:**
- MVP: Free tier (30K requests/month) sufficient
- Growth: Self-host when rate limits hit
- Model: paraphrase-multilingual-MiniLM-L12-v2 (118MB, fast)
- Clear migration path

**Consequences:**
- ✅ $0/month for MVP
- ✅ No infrastructure to manage
- ✅ Easy migration to self-hosted
- ❌ Rate limits (30K/month)
- ❌ Higher latency (~500ms)

---

### 13.3 Future Technology Considerations

#### Phase 2 (Growth)
- **Redis** for caching (hot products, user sessions)
- **Cloudflare R2** for image CDN (cheaper than Supabase Storage)
- **FastAPI** for embeddings (self-hosted, faster)
- **Sentry** for error tracking

#### Phase 3 (Scale)
- **Read replicas** for database (separate read/write)
- **Database sharding** by region (Santa Cruz, La Paz, Cochabamba)
- **Multi-region deployment** (latency optimization)
- **Advanced analytics** (Mixpanel, Amplitude)
- **Mobile app** (React Native or Flutter)

---

## Conclusion

This architecture document provides a comprehensive blueprint for building Telopillo.bo as a cost-effective, scalable marketplace platform. The serverless-first approach with Supabase as the core infrastructure enables:

1. **$0/month MVP** - Validate product-market fit without financial risk
2. **Clear scaling path** - Predictable costs as user base grows
3. **Low maintenance** - Minimal operational overhead
4. **High performance** - Edge network, real-time capabilities
5. **Security-first** - Row Level Security, JWT auth, HTTPS

The hybrid search architecture with Bolivian Spanish optimizations provides a competitive advantage, while the real-time chat and geolocation features create a complete marketplace experience.

**Implemented so far (M0–M4.6 + LPQ):**
1. ✅ Foundation: Next.js 16, Supabase, TypeScript, Tailwind CSS v4, shadcn/ui
2. ✅ Auth: Email/password + Google OAuth, httpOnly cookie sessions, protected routes
3. ✅ Product listings: CRUD, multi-image upload, product detail + gallery
4. ✅ Search: Hybrid keyword FTS + semantic (pgvector, RRF, Hugging Face API)
5. ✅ Account types: Personal + business profiles, verification badges, storefronts
6. ✅ Share profile: Web Share API / clipboard, product-level sharing
7. ✅ Quality fixes: Custom 404, 7 static pages, search hardening, stale token recovery
8. ✅ E2E testing: 229 test cases across 7 business flows, axe-core WCAG 2.2 AA

**Next architectural work:**
1. M4.7 — `demand_posts` / `demand_offers` tables, RLS, search RPC extensions
2. M5 — Supabase Realtime channel design, `conversations` + `messages` schema
3. M6 — `ratings` table, auto-update trigger on `profiles.rating_average`
4. Production: Vercel deployment, custom domain, Edge Function deploy, DB migrations

---

**Document Version:** 1.3  
**Last Updated:** February 17, 2026  
**Maintained By:** Alcides Cardenas
