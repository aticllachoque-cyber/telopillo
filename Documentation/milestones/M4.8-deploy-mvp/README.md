# Milestone 4.8: Deploy MVP (Current State)

**Duration:** ~1–2 days  
**Goal:** Deploy the application as it stands through M4.7 to a live production environment (Vercel + Supabase Cloud).

This is a **follow-up deployment milestone** before starting M5 (real-time chat). Scope is limited to making the current feature set (auth, products, search, business profiles, share links, demand-side “Busco”) available in production.

---

## Progress: 7/14 (50%)

```
[██████████░░░░░░░░░░] 50%
```

---

## Tasks

### Pre-deploy checklist
- [x] Remove or disable any debug/test API routes (e.g. `/api/debug-auth`, `/api/test-*`) — none present; only `/api/search` and `/api/search-demands` exist
- [x] Ensure `DISABLE_AUTH` is `false` (or unset) in production (middleware uses this; must not be true in prod)
- [x] Run `npm run build` and fix any build errors
- [x] Run `npm run lint` and `npm run type-check`

### Supabase production
- [x] Create (or use existing) Supabase project for production — using **telopillo-bo** (`apwpsjjzcbytnvtnmmru`)
- [x] Run migrations: `npx supabase db push` (or link and push) — pushed 5 pending migrations
- [ ] Configure Auth: redirect URLs for production domain, optional OAuth (Google/Facebook)
- [ ] Set Edge Function secrets: `HUGGINGFACE_API_KEY`, `ALLOWED_ORIGIN` (production URL)

**Do these in the Supabase Dashboard** (project: [telopillo-bo](https://supabase.com/dashboard/project/apwpsjjzcbytnvtnmmru)):

| Step | Where | What to set |
|------|--------|-------------|
| **Auth redirect URLs** | Authentication → URL Configuration | **Site URL:** your production URL (e.g. `https://telopillo.bo` or `https://your-app.vercel.app`). **Redirect URLs:** add `https://your-production-domain.com/auth/callback` and, if using Vercel previews, `https://*.vercel.app/auth/callback`. |
| **Edge Function secrets** | Project Settings → Edge Functions → Secrets (or CLI below) | `HUGGINGFACE_API_KEY` = your Hugging Face API key (for semantic search). `ALLOWED_ORIGIN` = your production origin, e.g. `https://telopillo.bo` or `https://your-app.vercel.app` (no trailing slash). |

To set Edge Function secrets from the CLI (after `supabase link`):
```bash
npx supabase secrets set HUGGINGFACE_API_KEY=hf_your_key_here
npx supabase secrets set ALLOWED_ORIGIN=https://your-app.vercel.app
```
Replace with your real production URL and HF key.

#### What migrations are and how they work

**Migrations** are versioned SQL files in `supabase/migrations/` that define your database: tables, indexes, RLS policies, triggers, and functions. Each file runs once, in order (the timestamp in the filename defines the order). You’ve been adding and running these locally (e.g. `npx supabase db reset` applies all migrations to your local Postgres).

- **Local:** `supabase start` runs a local Postgres; `db reset` applies every migration in `supabase/migrations/` from scratch. That’s why your local DB has `profiles`, `products`, `demand_posts`, search vectors, etc.
- **Remote (production):** The **same** migration files must be applied to the Supabase project in the cloud. That way production has the same schema as your codebase.

**How to apply migrations to production:**

1. **Link** the CLI to your **remote** project (one-time per machine/repo):
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
   `YOUR_PROJECT_REF` is in Supabase Dashboard → Project Settings → General (e.g. `apwpsjjzcbytnvtnmmru`). This writes a link in `.supabase/` so the CLI knows where to push.

2. **Push** migrations to that remote database:
   ```bash
   npx supabase db push
   ```
   The CLI compares the remote DB’s migration history with the files in `supabase/migrations/` and runs any migration that hasn’t been applied yet. So production ends up with the same tables, RLS, and functions as your repo.

**Summary:** Migrations = “source of truth” for schema. Local = you run them with `db reset` (or `migration up`). Production = you run them with `db push` after `supabase link`. You don’t run SQL by hand in the Dashboard for things that are in migrations; you add a new migration file and push.

---

#### Auth: redirect URLs and OAuth

After a user signs in or signs up, Supabase Auth must send them back to **your** app. That “back” URL is the **redirect URL**. It must be explicitly allowed in the Supabase project.

- **Where to set it:** Supabase Dashboard → Authentication → URL Configuration.
- **What to add (production):**
  - **Site URL:** e.g. `https://telopillo.bo` or `https://your-app.vercel.app` (used as default redirect).
  - **Redirect URLs:** add at least:
    - `https://your-production-domain.com/auth/callback`
    - If you use Vercel previews: `https://*.vercel.app/auth/callback` (wildcard for preview deployments).

If you don’t add the production URL, users will get an “invalid redirect” or stay on a Supabase URL after login.

**OAuth (Google / Facebook):** If you use “Iniciar con Google” etc.:

1. In Supabase Dashboard → Authentication → Providers, enable Google (or Facebook) and set the Client ID / Secret from Google Cloud Console (or Meta).
2. In Google (or Meta) you must add the **redirect URL** they use for Supabase, e.g. `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`. Supabase shows this in the provider config. Without it, OAuth will fail in production.

### Frontend (Vercel)
- [ ] Connect repo to Vercel (or use existing project)
- [ ] Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` (production)
- [ ] Deploy and verify build succeeds
- [ ] Optional: add custom domain and SSL (Vercel handles this)

#### Step-by-step: Deploy to Vercel

1. **Push your code to GitHub** (if not already). Vercel deploys from a Git repo; ensure the branch you want (e.g. `main`) is pushed.

2. **Sign in to [Vercel](https://vercel.com)** and click **Add New… → Project**.

3. **Import the repo:** Connect GitHub (or GitLab/Bitbucket), select the `telopillo.com` repository. Leave **Framework Preset** as Next.js and **Root Directory** as `.`. Click **Deploy** once; it may fail until env vars are set — that’s OK.

4. **Add environment variables** in Vercel: Project → **Settings → Environment Variables**. Add these for **Production** (and optionally Preview if you use branch previews):

   | Name | Value | Notes |
   |------|--------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://apwpsjjzcbytnvtnmmru.supabase.co` | From Supabase Dashboard → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon public key) | Same place; safe to expose in client |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) | Same place; **never** expose to client; server-only |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel production URL (no trailing slash) |
   | `NEXT_PUBLIC_SITE_URL` | Same as `NEXT_PUBLIC_APP_URL` | Used for OAuth redirects |
   | `DISABLE_AUTH` | `false` | Must be false in production |

   Optional (semantic search): `SEMANTIC_SEARCH_ENABLED` = `true` if you set `HUGGINGFACE_API_KEY` and `ALLOWED_ORIGIN` in Supabase Edge Function secrets.

5. **Redeploy:** After saving env vars, go to **Deployments**, open the three dots on the latest deployment → **Redeploy** (or push a small commit to trigger a new build). The build should succeed.

6. **Configure Supabase Auth redirect:** In Supabase Dashboard → Authentication → URL Configuration, set **Site URL** to your Vercel URL (e.g. `https://your-app.vercel.app`) and add to **Redirect URLs**: `https://your-app.vercel.app/auth/callback`. If you use preview URLs, add `https://*.vercel.app/auth/callback`.

7. **Verify:** Open your Vercel URL. Check: home loads, search works, register/login, view a product, open `/busco`. Fix any 404s or env issues.

8. **(Optional) Custom domain:** In Vercel → Project → Settings → Domains, add e.g. `telopillo.bo`. Vercel will show DNS records to add at your registrar; after propagation, SSL is automatic.

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
