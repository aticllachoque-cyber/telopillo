# Telopillo.bo – Project Status Assessment

**Date:** February 2026  
**Purpose:** Snapshot of where the project is (milestones, testing, local setup, blockers).

---

## 1. Product & Milestones

| Area | Status |
|------|--------|
| **MVP core** | M0–M4.7 done: auth, profiles, products, hybrid search (FTS + semantic), account types, share links, demand-side “Busco”. |
| **Next milestones** | M4.8 Deploy MVP (deploy current state to production); then M5 Real-time chat. |
| **Later** | M6 Favorites/ratings, M7–M12 (trust, maps, discovery, moderation, polish, launch). |
| **Progress** | 10/16 milestones complete (~63% of roadmap). |

**Tech stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, Supabase (Postgres, Auth, Storage, Edge Functions), hybrid search (pgvector + Hugging Face).

---

## 2. Testing

| Layer | Status |
|-------|--------|
| **Playwright CLI plans** | 22 flows documented under `tests/playwright-cli/`: visitor (01–09), account (10–13), buyer (14–15), seller (16–19), cross-cutting (20–22). |
| **Visitor flows** | All 9 executed and passed (see `tests/playwright-cli/visitor/VISITOR_REPORT.md`). Business storefront (06) needs seed: `scripts/seed-business-storefront.sql`. |
| **Seller flows** | Plans 16–19 in place. Mobile script: `scripts/playwright-cli-seller-mobile.sh` (375×812). Login in script is manual (run-code login fails with current Playwright CLI). |
| **Local test password** | Standard: `TestPassword123`. Set via `node scripts/set-test-passwords.mjs` (Auth Admin API) or Supabase Studio → Auth → Users. |
| **E2E (Playwright test)** | Auth, profile, demand-side, accessibility specs exist under `tests/e2e/`. |

---

## 3. Local Development (Docker / Supabase)

| Item | Value |
|------|--------|
| **Supabase** | `npx supabase start`. API: `http://127.0.0.1:54321`, DB: `127.0.0.1:54322` (user `postgres`). |
| **App** | `npm run dev` → http://localhost:3000. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (local). |
| **Test users** | seller1@test.com, seller2@test.com (from seed). Password set via `set-test-passwords.mjs` or Studio. |

**Known issue:** GoTrue (Auth) can return “Database error finding/loading user” for `listUsers` / `updateUserById` in some environments. Workaround: set passwords in Supabase Studio (http://127.0.0.1:54323) → Auth → Users.

---

## 4. Scripts & Automation

| Script | Purpose |
|--------|---------|
| `scripts/set-test-passwords.mjs` | Set `TestPassword123` for seller1/seller2 via Auth Admin API; fallback to known IDs if listUsers fails. |
| `scripts/set-seller-password.sql` | Alternative: set password in `auth.users` via psql (login may still 500 if GoTrue rejects hash). |
| `scripts/seed-business-storefront.sql` | Ensure a business profile + slug for visitor flow 06. |
| `scripts/playwright-cli-visitor-mobile.sh` | Run visitor flows on mobile viewport (headed). |
| `scripts/playwright-cli-seller-mobile.sh` | Run seller flows 16–19 on mobile; manual login then Enter to continue. |

---

## 5. Open Items / Blockers

1. **Seller login in automation:** Playwright CLI `run-code` for fill/click login fails (`TypeError: (intermediate value) is not a function`). Seller mobile script uses manual login + Enter.
2. **GoTrue DB errors (optional):** If `set-test-passwords.mjs` fails with “Database error”, set passwords in Studio.
3. **Ruff:** User rule: run ruff before git add/commit; no skipping.

---

## 6. Suggested Next Steps

1. **Feature:** Start M5 (real-time chat) when ready.
2. **Testing:** Once seller login works (Studio or fixed script), run seller flows 16–19 end-to-end and capture results (e.g. SELLER_REPORT.md).
3. **Stability:** If GoTrue DB errors persist locally, capture Auth/Postgres logs once to identify root cause.
4. **Docs:** Keep `Documentation/milestones/README.md` and this file updated as milestones and scripts change.

---

*Last updated: February 2026.*
