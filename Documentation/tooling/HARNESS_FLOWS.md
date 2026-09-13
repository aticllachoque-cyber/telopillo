# Agent Harness Flows for Telopillo

**Version:** 1.0  
**Date:** June 10, 2026  
**Author:** Alcides Cardenas  
**Status:** Draft — planning reference  
**Related:** [PROJECT_STATUS.md](../status/PROJECT_STATUS.md), [REGRESSION_GUARDRAILS.md](../testing/REGRESSION_GUARDRAILS.md), [PRD.md](../PRD.md)

---

## 1. Purpose

This document catalogs **agent harness flows** that Telopillo can build using the Upwork harness pipeline and the skills available across this workspace. A harness is a repeatable orchestrator that coordinates delegate skills, runs verification gates, and requires human sign-off before outputs are trusted.

Use this as a planning reference when deciding which automation workflows to formalize before MVP launch (M4.8) and the next milestones (M5 chat, M6 favorites/ratings).

---

## 2. Harness Pipeline Overview

The harness pipeline lives in `upwork-agent-skills` (branch `WP-3120-harness-pipeline`). It provides four meta-skills that turn a harness design into a validated orchestrator:

```
harness-designer → harness-implementer → harness-validator → production run
                                              ↓ FAIL
                                        harness-enhancer → (re-run upstream)
```

| Stage | Role | Output |
|-------|------|--------|
| **harness-designer** | Design only — ground-truth reconnaissance on real repos | `harness-designs/<orchestrator>/HARNESS_DESIGN.md` |
| **harness-implementer** | Build orchestrator skill from design §13/§14 | `skills/<orchestrator>/` |
| **harness-validator** | Smoke-run one worklist item in a throwaway git worktree | `VALIDATION_REPORT.md` |
| **harness-enhancer** | Repair loop on failure or drift | `ENHANCEMENT_BRIEF` + targeted patches |

**Key constraints (fail-closed):**

- Validator runs **one representative item** (two for migration/batch domains), not a full batch.
- No push, commit, or PR during validation.
- Human sign-off required before `Status: validated`.
- Scope-lock: generated files limited to approved paths unless human approves more.

**Canonical docs (upwork-agent-skills):**

- `docs/harness-pipeline/README.md`
- `skills/harness-designer/SKILL.md`
- `skills/harness-implementer/SKILL.md`
- `skills/harness-validator/SKILL.md`
- `skills/harness-enhancer/SKILL.md`

---

## 3. Workspace Skill Inventory

Skills are distributed across four repos in this workspace. Harness designers discover delegates from all locations (precedence: upwork-agent-skills → installed dirs → sibling repos).

### 3.1 upwork-agent-skills (27 skills)

| Category | Skills |
|----------|--------|
| **Harness meta** | `harness-designer`, `harness-implementer`, `harness-validator`, `harness-enhancer` |
| **Docs & requirements** | `generate-req-doc`, `generate-traceability`, `generate-test-cases`, `generate-repo-docs`, `edd-review` |
| **Code review & testing** | `code-review`, `gh-cli`, `jet-to-playwright`, `jet-smoke-to-playwright`, `webapp-testing` |
| **Brainstorming** | `ai-based-thinking`, `creative-brainstorm` |
| **Creative & media** | `image-generation`, `slide-illustration`, `slack-gif-creator`, `slack-emoji-frame-by-frame` |
| **Upwork-specific** | `upwork`, `upwork-nuxt-container-queries`, `upwork-map-github-repositories`, `dockerfile-linter`, `fusion-worktree`, `foundations-interview-scorecard`, `skill-creator` |

**Note:** `requirements-evidence-harness` exists on branch `WP-3120-requirements-evidence-harness-master` (built orchestrator, pending human sign-off).

### 3.2 superpowers (14 skills)

| Category | Skills |
|----------|--------|
| **Planning & execution** | `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents` |
| **Quality** | `test-driven-development`, `verification-before-completion`, `systematic-debugging` |
| **Code review** | `requesting-code-review`, `receiving-code-review` |
| **Git workflow** | `using-git-worktrees`, `finishing-a-development-branch` |
| **Meta** | `using-superpowers`, `writing-skills` |

### 3.3 agent-skills / addyosmani (23 skills)

| Category | Skills |
|----------|--------|
| **Development** | `spec-driven-development`, `source-driven-development`, `incremental-implementation`, `planning-and-task-breakdown`, `doubt-driven-development` |
| **Quality & review** | `code-review-and-quality`, `test-driven-development`, `code-simplification` |
| **Security & ops** | `security-and-hardening`, `ci-cd-and-automation`, `deprecation-and-migration` |
| **Frontend & testing** | `frontend-ui-engineering`, `browser-testing-with-devtools`, `performance-optimization` |
| **Docs** | `documentation-and-adrs`, `context-engineering` |
| **Other** | `api-and-interface-design`, `git-workflow-and-versioning`, `shipping-and-launch`, `debugging-and-error-recovery`, `idea-refine`, `interview-me`, `using-agent-skills` |

### 3.4 telopillo.com (8 skills)

| Skill | Purpose |
|-------|---------|
| `brainstorming` | Creative work before implementation |
| `baseline-ui` | Opinionated UI baseline to prevent AI slop |
| `fixing-accessibility` | WCAG fixes and a11y review rules |
| `fixing-metadata` | Correct, complete page metadata |
| `fixing-motion-performance` | Animation performance fixes |
| `english-code-only` | Enforce English in all code |
| `writing-skills` | Create and verify agent skills |
| `playwright-cli` | Browser automation via Playwright CLI |

---

## 4. Domain Profiles

Harness designs are classified by domain (from `harness-designer/references/domain-profiles.md`):

| Domain | Signals | Telopillo relevance |
|--------|---------|---------------------|
| `test` | Test generation, coverage, CI, migration | High — Playwright E2E, unit tests |
| `codereview` | PR review, lint, security | High — pre-launch hardening |
| `coding` | Feature implementation, refactor | High — M5/M6 milestones |
| `design` | UX, accessibility, specs | High — WCAG 2.2 AA target |
| `docs` | Documentation, ADRs, requirements | Medium — onboarding, evidence |
| `ops` | Deploy, SRE, Docker | Medium — M4.8 deploy |
| `marketing` | Brand, content, slides | Low — demos, pitch decks |

---

## 5. Proposed Harness Flows

### Tier 1 — Ready to design (delegates complete)

#### 5.1 `requirements-evidence-harness`

| Field | Value |
|-------|-------|
| **Domain** | `test` + `docs` |
| **Status** | Built on `WP-3120-requirements-evidence-harness-master`; validator gates passed, human sign-off pending |
| **Delegates** | `generate-req-doc` → `generate-traceability` → `generate-test-cases` |
| **Outputs** | `docs/requirements.md`, `docs/traceability.md`, `docs/test-cases/<Component>.md` |
| **Telopillo smoke scopes** | `app/busco/`, `components/demand/`, `app/(marketplace)/` |

**Workflow:**

1. Intake target repo + product area selector.
2. Delegate requirements generation from source code.
3. Human approves inferred requirements.
4. Delegate traceability (REQ ↔ Jest/Playwright tests).
5. Delegate per-component test case docs.
6. Run artifact + coverage + scope gates.
7. Human sign-off on final diff.

**Telopillo gates (adapted):**

| Gate | Command / check |
|------|-----------------|
| Requirements artifact | `test -f docs/requirements.md` |
| Traceability artifact | `test -f docs/traceability.md` |
| Test cases artifact | `find docs/test-cases -name '*.md' \| grep -q .` |
| P0 coverage | No P0 `NOT COVERED` without waiver |
| Scope lock | Only `docs/**` changed |
| Optional unit | `npm run test:unit` |
| Optional E2E | `npm run test:demand` (scope-dependent) |

---

#### 5.2 `pr-review-harness`

| Field | Value |
|-------|-------|
| **Domain** | `codereview` |
| **Delegates** | `gh-cli` → `code-review` → (optional) `edd-review` |
| **Worklist** | Open PRs or branch diff vs `main` |
| **Outputs** | Structured review report with severity tiers |

**Gates:**

- All unresolved PR comments fetched and addressed or documented.
- Review covers: ticket requirements, security, tests, quality, breaking changes.
- Blocking issues resolved or explicitly waived by human.

**Telopillo use:** Review PRs before merging milestone work (M5 chat, M6 favorites).

---

#### 5.3 `repo-docs-harness`

| Field | Value |
|-------|-------|
| **Domain** | `docs` + `coding` |
| **Delegates** | `generate-repo-docs` + (optional phase 2) `requirements-evidence-harness` |
| **Worklist** | Modules: `app/`, `lib/`, `components/`, `supabase/` |
| **Outputs** | MkDocs site grounded in repo evidence |

**Gates:**

- MkDocs build passes.
- Every claim cites a source file.
- No placeholder or invented paths.

**Telopillo use:** Onboarding docs for contributors; complements existing `Documentation/` milestone docs.

---

### Tier 2 — High value for Telopillo (partial delegates, minor adaptation)

#### 5.4 `e2e-coverage-harness`

| Field | Value |
|-------|-------|
| **Domain** | `test` |
| **Delegates** | `webapp-testing` + `generate-traceability` + `generate-test-cases` |
| **Worklist** | E2E journey directories under `tests/e2e/` |
| **Outputs** | Journey coverage matrix + gap report |

**Telopillo worklist items:**

| Journey | Spec path | npm script |
|---------|-----------|------------|
| Auth | `tests/e2e/auth/` | `npm run test:auth` |
| Buyer | `tests/e2e/buyer-journey/` | `npm run test:buyer` |
| Seller | `tests/e2e/seller-journey/` | `npm run test:seller` |
| Demand (Busco) | `tests/e2e/demand-side/` | `npm run test:demand` |
| Search | `tests/e2e/search-discovery/` | `npm run test:search` |
| Cross-cutting a11y | `tests/e2e/cross-cutting/accessibility-audit.spec.ts` | `npm run test:a11y` |
| Cross-cutting mobile | `tests/e2e/cross-cutting/mobile-responsive.spec.ts` | `npm run test:mobile` |

**Gates:**

- Each P0 journey has at least one passing Playwright spec.
- PRD flows (auth, publish, search, busco) are not `NOT COVERED`.
- Regression guardrails from [REGRESSION_GUARDRAILS.md](../testing/REGRESSION_GUARDRAILS.md) have associated tests.

**Why Telopillo:** Lighter than full requirements-evidence; maps directly to existing journey structure and launch readiness.

---

#### 5.5 `accessibility-audit-harness`

| Field | Value |
|-------|-------|
| **Domain** | `design` + `test` |
| **Delegates** | `fixing-accessibility` + `webapp-testing` + `@axe-core/playwright` |
| **Worklist** | Routes or component clusters |
| **Outputs** | A11y violation report + fix plan per scope |

**Telopillo smoke scopes:**

| Scope | Path | Test |
|-------|------|------|
| Product publishing | `app/publicar/`, `components/products/` | `npm run test:a11y` |
| Demand (Busco) | `app/busco/`, `components/demand/` | Custom a11y spec |
| Profile | `app/perfil/`, `components/profile/` | Existing audit docs in `Documentation/accessibility/` |
| Marketplace shell | `components/layout/`, `app/(marketplace)/` | Keyboard nav + screen reader |

**Gates:**

- `npm run test:a11y` passes for scoped area.
- WCAG 2.2 AA violations documented with waiver or fix.
- Scope-lock: only files in selected route/component cluster.

**Why Telopillo:** MVP targets WCAG 2.2 AA; existing audits in `Documentation/accessibility/` can seed the worklist.

---

#### 5.6 `security-hardening-harness`

| Field | Value |
|-------|-------|
| **Domain** | `codereview` + `ops` |
| **Delegates** | `security-and-hardening` (agent-skills) + `code-review` + Telopillo CLAUDE.md rules |
| **Worklist** | Security-sensitive areas |
| **Outputs** | Security checklist report per area |

**Telopillo worklist items:**

| Area | Path | Checks |
|------|------|--------|
| API routes | `app/api/**` | Auth on every route; input validation (Zod); sanitized outputs |
| Supabase RLS | `supabase/migrations/**` | RLS enabled; `auth.uid()` policies; no service role leakage |
| Auth & middleware | `middleware.ts`, `lib/supabase/` | Session refresh; protected routes |
| File uploads | `lib/utils/image.ts`, storage policies | Size limits, MIME validation, user-scoped paths |
| Environment | `.env.example`, `next.config.ts` | No debug routes; `NEXT_PUBLIC_DISABLE_AUTH=false` in prod |

**Gates:**

- Every API route has auth check (or documented public exception).
- New tables have RLS + policies for SELECT/INSERT/UPDATE/DELETE.
- No secrets in diff.
- Service role used only where documented.

**Why Telopillo:** CLAUDE.md security requirements are strict; harness makes them verifiable per area before M4.8 deploy.

---

#### 5.7 `feature-ship-harness`

| Field | Value |
|-------|-------|
| **Domain** | `coding` |
| **Delegates** | `brainstorming` → `writing-plans` → `executing-plans` → `verification-before-completion` → `finishing-a-development-branch` |
| **Worklist** | Milestones from `Documentation/milestones/` |
| **Outputs** | Completed feature with verified tests and clean branch |

**Telopillo candidates:**

| Milestone | Scope | Smoke item |
|-----------|-------|------------|
| M5 Real-time chat | `app/mensajes/`, Supabase Realtime | One conversation flow |
| M6 Favorites/ratings | `components/favorites/`, DB migration | One favorite + one rating |
| M4.8 Deploy MVP | Vercel + Supabase Cloud config | Staging smoke |

**Gates:**

- Plan approved by human (HITL checkpoint).
- `npm run lint`, `npm run type-check`, relevant E2E pass with fresh evidence.
- No completion claims without verification output.
- Branch ready for PR (from `finishing-a-development-branch`).

**Why Telopillo:** Superpowers skills already form an implicit dev pipeline; harness formalizes it with gates for milestone delivery.

---

### Tier 3 — Upwork-specific (lower Telopillo priority)

#### 5.8 `jet-playwright-migration-harness`

| Field | Value |
|-------|-------|
| **Domain** | `test` (migration sub-type) |
| **Delegates** | `jet-to-playwright` / `jet-smoke-to-playwright` + `generate-test-cases` + `webapp-testing` |
| **Worklist** | One JET `.rb` file per item |
| **Migration gates** | Fidelity parity, source→target data mapping, metadata annotations |

**Telopillo relevance:** Low — Telopillo uses Playwright natively, not JET Ruby. Useful for Upwork internal repos.

---

#### 5.9 `dockerfile-compliance-harness`

| Field | Value |
|-------|-------|
| **Domain** | `ops` |
| **Delegates** | `dockerfile-linter` |
| **Worklist** | `find . -name Dockerfile` |
| **Gates** | Hadolint pass, `.dockerignore` excludes `.git` |

**Telopillo relevance:** Low — Telopillo deploys to Vercel + Supabase Cloud, not custom Docker images.

---

#### 5.10 `edd-prd-alignment-harness`

| Field | Value |
|-------|-------|
| **Domain** | `codereview` + `design` |
| **Delegates** | `edd-review` + `generate-req-doc` |
| **Worklist** | One EDD per item |

**Telopillo relevance:** Low — Upwork EDD process. Telopillo equivalent: align `Documentation/milestones/*/PRD.md` with implementation via `requirements-evidence-harness`.

---

### Tier 4 — Creative / marketing

#### 5.11 `slide-deck-harness`

| Field | Value |
|-------|-------|
| **Domain** | `marketing` + `design` |
| **Delegates** | `creative-brainstorm` → `slide-illustration` → `image-generation` |
| **Worklist** | Slides from pitch deck or demo plan |
| **Gates** | Human sign-off per slide; assets saved |

**Telopillo use:** Demo materials for [DEMO_PLAN.md](../archive/reports/DEMO_PLAN.md), investor/stakeholder presentations.

---

#### 5.12 `slack-asset-harness`

| Field | Value |
|-------|-------|
| **Domain** | `marketing` |
| **Delegates** | `slack-emoji-frame-by-frame` + `slack-gif-creator` |
| **Worklist** | One GIF/emoji per item |
| **Gates** | Slack size/frame validation; flicker-free animation |

**Telopillo use:** Team comms, launch announcements.

---

### Tier 5 — Meta / infrastructure

#### 5.13 `skill-sync-harness`

| Field | Value |
|-------|-------|
| **Domain** | `ops` + `coding` |
| **Delegates** | `skill-creator` + `writing-skills` + `harness-validator` |
| **Worklist** | Skills missing valid `SKILL.md` or `AGENTS.md` index entry |
| **Gates** | Valid frontmatter, `package_skill.py` pass, index updated |

**Telopillo use:** Keep `.cursor/skills/` and `.claude/skills/` in sync across Telopillo, Superpowers, and agent-skills imports.

---

#### 5.14 `worktree-experiment-harness`

| Field | Value |
|-------|-------|
| **Domain** | `coding` |
| **Delegates** | `using-git-worktrees` (Superpowers) or `fusion-worktree` (Upwork) |
| **Worklist** | One branch/feature per worktree |
| **Gates** | Clean teardown; deterministic dev port; handoff JSON present |

**Telopillo use:** Parallel experiments (e.g. M5 chat prototype alongside M4.8 deploy fixes).

---

## 6. Priority Matrix for Telopillo

| Harness | Design effort | Delegates ready | MVP relevance | Recommended phase |
|---------|---------------|-----------------|---------------|-------------------|
| `requirements-evidence-harness` | Low (exists) | 100% | High | **Now** — validate pipeline on Telopillo |
| `e2e-coverage-harness` | Medium | 85% | High | **Pre-M4.8** — launch readiness |
| `accessibility-audit-harness` | Medium | 80% | High | **Pre-M4.8** — WCAG 2.2 AA |
| `security-hardening-harness` | Medium | 70% | High | **Pre-M4.8** — production safety |
| `pr-review-harness` | Low | 100% | Medium | Ongoing — every milestone PR |
| `feature-ship-harness` | Medium | 90% | Medium | **M5/M6** — structured delivery |
| `repo-docs-harness` | Medium | 95% | Medium | Post-MVP — contributor onboarding |
| `skill-sync-harness` | Low | 90% | Low | As needed — skill hygiene |
| `slide-deck-harness` | Low | 100% | Low | Demos — [DEMO_PLAN.md](../archive/reports/DEMO_PLAN.md) |
| `jet-playwright-migration` | Medium | 90% | None | Upwork only |
| `dockerfile-compliance` | Low | 100% | None | Upwork only |

---

## 7. Recommended Rollout

### Phase 1 — Validate pipeline (now)

1. Merge or cherry-pick `requirements-evidence-harness` from `WP-3120-requirements-evidence-harness-master`.
2. Run validator smoke on Telopillo scope: `app/busco/` or `components/demand/`.
3. Complete human sign-off on `VALIDATION_REPORT.md`.

### Phase 2 — Pre-launch hardening (before M4.8)

1. Design and build `e2e-coverage-harness` — map PRD flows to Playwright journeys.
2. Design and build `accessibility-audit-harness` — extend existing audits in `Documentation/accessibility/`.
3. Design and build `security-hardening-harness` — verify API routes, RLS, auth before deploy.

### Phase 3 — Milestone delivery (M5+)

1. Use `feature-ship-harness` for M5 (chat) and M6 (favorites/ratings).
2. Use `pr-review-harness` on every milestone PR.

### Phase 4 — Maintenance (post-MVP)

1. `repo-docs-harness` for engineer onboarding.
2. `skill-sync-harness` to keep agent skills consistent.

---

## 8. How to Bootstrap a Harness

Run inside `upwork-agent-skills` on branch `WP-3120-harness-pipeline`:

```text
Step 1 — Design
  Load: harness-designer
  Inputs:
    - Domain: test | codereview | design | coding | docs | ops
    - Target repo: /path/to/telopillo.com
    - Product area / worklist selector: e.g. tests/e2e/demand-side/
    - Outcome: one sentence for "done"
  Output: harness-designs/<orchestrator>/HARNESS_DESIGN.md

Step 2 — Build
  Load: harness-implementer
  Input: HARNESS_DESIGN_PATH=harness-designs/<orchestrator>/HARNESS_DESIGN.md
  Output: skills/<orchestrator>/ (SKILL.md, references/, assets/)

Step 3 — Validate
  Load: harness-validator
  Input: HARNESS_DESIGN_PATH=harness-designs/<orchestrator>/HARNESS_DESIGN.md
  Action: smoke-run one worklist item in throwaway git worktree
  Output: harness-designs/<orchestrator>/VALIDATION_REPORT.md

Step 4 — On failure
  Load: harness-enhancer
  Input: failure signal from VALIDATION_REPORT.md
  Action: patch + re-validate (max 2 rounds, then escalate to operator)
```

---

## 9. Telopillo-Specific Commands Reference

Commands to embed in harness §7 gates (verified from `package.json`):

| Purpose | Command |
|---------|---------|
| Lint | `npm run lint` |
| Type check | `npm run type-check` |
| Unit tests | `npm run test:unit` |
| Auth E2E | `npm run test:auth` |
| Buyer journey | `npm run test:buyer` |
| Seller journey | `npm run test:seller` |
| Demand (Busco) | `npm run test:demand` |
| Search | `npm run test:search` |
| Accessibility | `npm run test:a11y` |
| Mobile responsive | `npm run test:mobile` |
| Full E2E | `npm run test:e2e` |
| Production build | `npm run build` |

**Local prerequisites:**

- Supabase: `npx supabase start`
- App: `npm run dev` → http://localhost:3000
- Test passwords: `node scripts/set-test-passwords.mjs`

---

## 10. Open Questions

| # | Question | Blocks |
|---|----------|--------|
| 1 | Merge `requirements-evidence-harness` into harness-pipeline branch or keep separate? | Phase 1 start |
| 2 | Should Telopillo `docs/requirements.md` live in repo root `docs/` or `Documentation/`? | Scope-lock convention |
| 3 | Playwright `components` annotation convention for Telopillo specs? | Traceability linking |
| 4 | Which journey is the canonical validator smoke item for `e2e-coverage-harness`? | Harness design §3 |
| 5 | Install upwork-agent-skills as Claude Code plugin or copy skills to `.cursor/skills/`? | Delegate resolution |

---

## 11. References

| Resource | Location |
|----------|----------|
| Harness pipeline README | `upwork-agent-skills/docs/harness-pipeline/README.md` |
| Domain profiles | `upwork-agent-skills/skills/harness-designer/references/domain-profiles.md` |
| Requirements evidence (built) | `upwork-agent-skills` branch `WP-3120-requirements-evidence-harness-master` |
| Telopillo regression guardrails | [REGRESSION_GUARDRAILS.md](../testing/REGRESSION_GUARDRAILS.md) |
| Telopillo project status | [PROJECT_STATUS.md](../status/PROJECT_STATUS.md) |
| Telopillo accessibility audits | `Documentation/accessibility/` |
| Playwright CLI test plans | `tests/playwright-cli/` |
| Agent Skills spec | https://agentskills.io/home |

---

**Last updated:** June 10, 2026  
**Maintained by:** Alcides Cardenas
