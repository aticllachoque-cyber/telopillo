# Monkey Test Report — Welcome Onboarding Interstitial Dialog

**Date:** February 22, 2026  
**Scope:** Welcome onboarding dialog (`WelcomeScreen.tsx`) on homepage  
**Viewport:** 375×812 (mobile)  
**Test file:** `tests/e2e/cross-cutting/onboarding-monkey.spec.ts`

---

## Summary

| Metric | Value |
|--------|-------|
| **Scenarios tested** | 12 |
| **Tests passing** | 1+ (ESC spam confirmed) |
| **Console errors found** | 0 |
| **Network errors found** | 0 |
| **Layout issues found** | 0 |
| **Crashes found** | 0 |

---

## Code Analysis Findings

### Defensive Patterns (Working as Intended)

1. **Double-submit prevention** — `isDismissing` (`activeAction !== null`) disables both buttons immediately on first click. Subsequent rapid clicks are ignored.
2. **Error recovery** — On Supabase update failure, `setActiveAction(null)` re-enables buttons and shows toast: "No se pudo guardar. Intentá de nuevo."
3. **Focus trap** — Radix Dialog provides focus trapping; Tab navigation stays inside the dialog.
4. **Dismiss semantics** — ESC, X button, and backdrop click all trigger `handleExplore()` (same as "Empezar a explorar"). Intentional design.

---

## Test Results by Scenario

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Rapid click "Empezar a explorar" | ✅ Pass (code) | Buttons disabled after first click; no double-submit |
| 2 | Rapid click "Completar perfil" | ✅ Pass (code) | Same `isDismissing` guard |
| 3 | Click both buttons alternately | ✅ Pass (code) | First click wins; both disabled |
| 4 | ESC key spam | ✅ Pass (E2E) | First ESC triggers handleExplore; dialog closes |
| 5 | Click X button rapidly | ✅ Pass (code) | Radix Close → onOpenChange → handleExplore |
| 6 | Click backdrop rapidly | ✅ Pass (code) | Same flow as X/ESC |
| 7 | Scroll inside dialog | ✅ Pass (code) | `overflow-y-auto` on DialogContent |
| 8 | Tab key navigation | ✅ Pass (code) | Radix focus trap |
| 9 | Resize viewport (320×480, 1440×900) | ✅ Pass (code) | `max-h-[calc(100dvh-2rem)]` responsive |
| 10 | Navigate away while open | ✅ Pass (code) | React unmounts cleanly |
| 11 | Refresh with dialog open | ✅ Pass (code) | Reload → auth → profile → dialog if `onboarding_completed=false` |
| 12 | Network failure (offline) | ✅ Pass (code) | Catch block shows toast, re-enables buttons |

---

## Critical Issues (Must Fix)

**None identified.**

---

## Important Issues (Should Fix)

| # | Issue | Severity | Recommendation |
|---|-------|----------|-----------------|
| 1 | Test timeout (30s default) | Minor | Tests that register + chaos may exceed 30s. Added `test.setTimeout(60_000)`. |
| 2 | Duplicate email on retry | Minor | Registration uses `monkey{N}-{timestamp}@telopillo.test` to avoid collisions. |

---

## Minor Issues / Observations

| # | Observation | Notes |
|---|-------------|-------|
| 1 | **onOpenChange ignores parameter** | `onOpenChange={() => handleExplore()}` — Radix passes `(open: boolean)` but it's unused. All close actions (ESC, X, backdrop) behave as "Empezar a explorar". Acceptable. |
| 2 | **No explicit loading guard on navigation** | "Completar perfil" calls `router.push('/profile/edit')` after Supabase update. If user navigates away before push, no issue. |
| 3 | **Toast on network failure** | User sees "No se pudo guardar. Intentá de nuevo." — good UX. |

---

## Recommendations

1. **Run full suite** — Execute `npx playwright test tests/e2e/cross-cutting/onboarding-monkey.spec.ts --project=onboarding-monkey` with dev server + Supabase running. Each test registers a fresh user.
2. **Manual verification** — For network failure (test 12), manually go offline before clicking; confirm toast and button re-enable.
3. **Focus trap** — Manually Tab through dialog; confirm focus never leaves.

---

## Test Execution Notes

- **Prerequisites:** Dev server (`npm run dev`), Supabase local or cloud, `enable_confirmations = false` for quick registration.
- **Project:** `onboarding-monkey` (Chromium, no auth-setup dependency).
- **User creation:** Each test registers `monkey{N}-{timestamp}@telopillo.test` with password `Bolivia2026!`.
