# Sample Demand Posts — Creation Report

**Date:** February 22, 2026  
**Base URL:** http://localhost:3000

---

## Summary

| Step | Status | Notes |
|------|--------|-------|
| 1. Login | ✅ Done | User already logged in (dev@telopillo.test) |
| 2. Create Post 1 (iPhone) | ⚠️ Already exists | 3 iPhone posts present |
| 3. Create Post 2 (Muebles) | ⚠️ Already exists | 2 Muebles posts present |
| 4. Create Post 3 (Bicicleta) | ❌ Blocked | Rate limit reached |
| 5. Create Post 4 (Juegos) | ❌ Blocked | Rate limit reached |
| 6. Create Post 5 (Ropa bebé) | ❌ Blocked | Rate limit reached |
| 7. Verify /busco | ✅ Done | 5 posts visible, screenshot saved |

---

## Current State

The dev user (`dev@telopillo.test`) has **reached the rate limit of 5 demand posts per day**. The `/busco/publicar` page shows:

> "Alcanzaste el límite de 5 solicitudes por día"

**Existing posts on /busco (5 total):**
- 3× "Busco iPhone 14 o 15 en buen estado" (Electrónica, La Paz, Bs. 1,500–4,000)
- 2× "Necesito muebles de oficina usados" (Hogar y Jardín, Cochabamba, Bs. 200–1,500)

The `/busco` page is populated with real content. Screenshot saved as `demands-listing.png`.

---

## Getting the Full 5 Distinct Posts

To replace the current 5 posts with the 5 distinct sample posts (iPhone, Muebles, Bicicleta, Juegos, Ropa bebé), run the seed script:

### Option A: Supabase Dashboard (recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → **New Query**
3. Copy the contents of `scripts/seed-demand-posts.sql`
4. Run the query

The script will:
- Delete existing demand posts for `dev@telopillo.test`
- Insert the 5 distinct sample posts

### Option B: Local Supabase (if running)

```bash
# If using local Supabase
npx supabase db reset  # Resets DB; then run seed manually via SQL Editor
```

---

## Seed Script Contents

The file `scripts/seed-demand-posts.sql` inserts:

| # | Title | Category | Department | City | Price Range |
|---|-------|----------|------------|------|-------------|
| 1 | Busco iPhone 14 o 15 en buen estado | Electrónica | La Paz | La Paz | Bs. 1,500–4,000 |
| 2 | Necesito muebles de oficina usados | Hogar y Jardín | Cochabamba | Cochabamba | Bs. 200–1,500 |
| 3 | Busco bicicleta mountain bike aro 29 | Deportes | Santa Cruz | Santa Cruz de la Sierra | Bs. 800–3,000 |
| 4 | Busco juegos de mesa para familia | Juguetes y Juegos | La Paz | El Alto | Bs. 50–300 |
| 5 | Necesito ropa de bebé talla 0-6 meses | Para Bebés y Niños | Oruro | Oruro | Bs. 30–200 |

---

## Issues Encountered

1. **Rate limit (5/day):** The app enforces a maximum of 5 demand posts per user per 24 hours. The dev user had already created 5 posts (from earlier test runs), so new posts could not be created via the form.

2. **Duplicate content:** The existing 5 posts are not the full set of 5 distinct types; they are 3 iPhone + 2 Muebles.

---

## Screenshot

- **demands-listing.png** — `/busco` page showing 5 solicitudes with filters and cards

---

## Recommendations

1. **For development:** Run `scripts/seed-demand-posts.sql` in the Supabase SQL Editor to get the full 5 distinct sample posts.
2. **For future seeding:** Consider a dev-only API route or script that bypasses the rate limit for seeding (e.g. `/api/seed-demands` with a secret key).
