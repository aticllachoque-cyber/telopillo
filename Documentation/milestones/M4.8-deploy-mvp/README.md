# Milestone 4.8: Deploy MVP (Current State)

**Duration:** ~1–2 days  
**Goal:** Deploy the application as it stands through M4.7 to a live production environment (Vercel + Supabase Cloud).

This is a **follow-up deployment milestone** before starting M5 (real-time chat). Scope is limited to making the current feature set (auth, products, search, business profiles, share links, demand-side “Busco”) available in production.

---

## Progress: 0/14 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

---

## Tasks

### Pre-deploy checklist
- [ ] Remove or disable any debug/test API routes (e.g. `/api/debug-auth`, `/api/test-*`)
- [ ] Ensure `NEXT_PUBLIC_DISABLE_AUTH` is `false` (or unset) in production
- [ ] Run `npm run build` and fix any build errors
- [ ] Run `npm run lint` and `npm run type-check`

### Supabase production
- [ ] Create (or use existing) Supabase project for production
- [ ] Run migrations: `npx supabase db push` (or link and push)
- [ ] Configure Auth: redirect URLs for production domain, optional OAuth (Google/Facebook)
- [ ] Set Edge Function secrets: `HUGGINGFACE_API_KEY`, `ALLOWED_ORIGIN` (production URL)

### Frontend (Vercel)
- [ ] Connect repo to Vercel (or use existing project)
- [ ] Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` (production)
- [ ] Deploy and verify build succeeds
- [ ] Optional: add custom domain and SSL (Vercel handles this)

---

## Repo + Vercel: keeping one repo for development and production

You can keep this repository as the single source of truth and deploy to Vercel at the same time. No need for a separate “deploy-only” repo.

| Option | Description | When to use |
|--------|-------------|-------------|
| **A. Single branch (main)** | Connect this repo to Vercel. Production deploys from `main`. Every push to `main` triggers a production deploy. You keep developing in the same repo; feature work happens on branches, then you merge to `main` when ready to release. | Simplest; good for MVP and solo/small team. |
| **B. Production + Preview branches** | In Vercel: set **Production Branch** to `main` (or `release`). Other branches get **Preview** URLs (e.g. `telopillo-abc123.vercel.app`). You develop on `develop` or feature branches; only merging into `main` goes to production. | When you want to test every PR or branch on a live URL before going to production. |
| **C. Same repo, different Vercel projects** | Two Vercel projects both connected to the same repo: one for Production (e.g. `telopillo.bo`), one for Staging (e.g. `staging-telopillo.vercel.app`), each with its own env vars and branch. | When you want a dedicated staging environment with production-like config. |

**Recommended for this milestone:** Option A. Push your repo to GitHub/GitLab/Bitbucket, connect that repo to Vercel, and set env vars in the Vercel dashboard. You continue working in the same repo; Vercel only deploys when you push (to the branch you configured as production, usually `main`). No second repo or copy needed.

### Post-deploy verification
- [ ] Home page loads; search works (keyword + semantic if HF key set)
- [ ] Registration and login work (email/password; OAuth if configured)
- [ ] Product listing and detail pages work; images load from Supabase Storage
- [ ] `/busco` and demand post creation/offers work
- [ ] No console errors or 500s on critical paths

---

## Deliverables

- Production app URL (Vercel default or custom domain)
- Supabase production project with migrations applied and Edge Functions deployed
- Environment variables documented (in team docs or `.env.example` notes only — no secrets in repo)

---

## Success criteria

- Application is live and reachable at the production URL
- A new user can register, log in, and use core flows (browse, search, view product, view demand, create demand if logged in)
- No debug routes or auth bypass in production
- Build and runtime are stable (no critical errors)

---

## Dependencies

- M0–M4.7 completed (current codebase)
- Vercel account
- Supabase project (free tier is sufficient for MVP)
- Hugging Face API key (for semantic search; optional for initial deploy — keyword search works without it)

---

## Out of scope (for full launch later, e.g. M12)

- Custom domain (can use `*.vercel.app` for this milestone)
- Resend/transactional email (password reset may be limited without it)
- Formal monitoring/alerting and backup strategy
- Soft launch / marketing

---

## Notes

- Use Supabase Dashboard to confirm RLS and Auth settings after first deploy
- If embedding Edge Function fails in production, check `ALLOWED_ORIGIN` and CORS
- Keep production service role key server-side only; never expose in client env
