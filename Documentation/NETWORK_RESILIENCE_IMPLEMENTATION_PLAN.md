# Network Resilience Implementation Plan

## Purpose

This document defines the implementation plan to make Telopillo operational under constrained mobile networks in Bolivia and Latin America.

The plan is based on the current product reality:

- Telopillo is a mobile-first marketplace for discovery, publishing, and lead generation.
- The critical path is not internal realtime chat.
- The app must remain useful when connectivity is intermittent, slow, or temporarily unavailable.

## Product Decision

Telopillo will follow an **online-first resilient** strategy:

- Fast read flows for home, search, detail, and seller profile.
- Resilient publish flows that do not lose user work.
- Explicit degraded modes when network quality is poor.
- WhatsApp remains the primary contact fallback.
- Internal chat, when implemented, must not be required for operability.

## Non-Goals

The following are intentionally out of scope for the first resilience rollout:

- Full offline-first replication of marketplace data.
- Complex bidirectional conflict resolution between local and remote records.
- Realtime-first chat architecture.
- Native mobile app-specific offline sync stacks.

## Current Codebase Observations

### Strengths

- Search already degrades from semantic to keyword when embeddings fail:
  - `app/api/search/route.ts`
- Image upload already compresses in the browser and uses explicit timeouts:
  - `lib/utils/image.ts`
- WhatsApp is already a first-class contact path:
  - `components/products/ProductWhatsAppLink.tsx`
- Product publish/edit drafts are implemented:
  - `components/products/ProductFormWizard.tsx`
- Demand publish/edit drafts are implemented:
  - `components/demand/DemandPostForm.tsx`
- Business profile drafts are implemented:
  - `components/profile/BusinessProfileForm.tsx`
- Global network status provider and banner are implemented:
  - `components/providers/NetworkStatusProvider.tsx`
  - `components/network/NetworkStatusBanner.tsx`

### Gaps

- Upload recovery is still coarse in `main`:
  - recovery exists, but no deferred attachment queue yet
- No adverse-network Playwright coverage exists for offline/reconnect flows.
- No structured resilience telemetry exists beyond local logging.

## Current Delivery Status

This plan started as a forward-looking design doc. Parts of P0 are now already shipped in `main`, while other work remains pending or only exists in `feat/network-resilience`.

| Workstream | Status in `main` | Notes |
| --- | --- | --- |
| Draft persistence | Implemented | Product, demand, and business profile forms persist and restore drafts locally. |
| Network status + banner | Implemented | `online` / `offline` / `reconnecting` states exist globally. |
| Shared request policy | Implemented | `lib/network/fetch.ts` standardizes timeout/retry/error mapping for search flows. |
| Resilient publish flow | Partial | Draft recovery and upload retry exist; deferred attachment flow is still pending. |
| Read cache for discovery | Partial | Search stale-on-error cache now exists; detail/home caches are still pending. |
| Search degradation + recovery UX | Partial | Backend fallback and stale-results fallback exist; broader degraded-mode UX can still improve. |
| Observability | Not implemented | No formal resilience metrics/log schema. |
| Adverse-network tests | Not implemented | Current E2E does not simulate offline/reconnect recovery. |

## Findings Since Initial Draft

1. The original “Current Codebase Observations” section is stale because draft persistence and global network status have already been delivered.
2. The remaining resilience gap is no longer “prevent form loss”; it is “make degraded reads and uploads recoverable”.
3. `feat/network-resilience` contained useful resilience work that has now been ported selectively into `main`:
   - resilient search request policy
   - search fallback cache
   - upload recovery hardening
4. That branch also contains unrelated UI/form churn, so it should not be merged wholesale. Remaining resilience pieces should be ported selectively.
5. Current priority should shift from general foundations to a narrower P1:
   - adverse-network test coverage
   - broader read cache
   - telemetry
   - deferred upload recovery

## Guiding Principles

1. No important form should lose user input because of connectivity issues.
2. No critical flow should depend on WebSockets.
3. Read flows should degrade to cached content whenever possible.
4. Upload failures must be recoverable at per-file granularity.
5. User-facing status must be explicit: local draft, syncing, synced, failed.
6. Operational metrics must reveal where poor networks break the experience.

## Phase Plan

### P0: Operational Resilience Baseline

This is the highest-priority implementation block.

#### Goals

- Prevent data loss in creation and editing flows.
- Make network failures understandable and recoverable.
- Preserve the current architecture and product behavior.

#### Deliverables

1. Draft persistence for product, demand, and business profile forms.
2. Shared network status store and global connectivity banner.
3. Shared fetch timeout/retry utilities.
4. Publish flow hardening for partial image failures.
5. Clear user-visible sync state and recovery actions.

### P0 Status

- `1` shipped in `main`
- `2` shipped in `main`
- `3` shipped in `main`
- `4` partial in `main`
- `5` partial in `main`

### Recommended Next Milestone

The next milestone should no longer be called “baseline”. The baseline exists. The next implementation block should be:

### P1: Recoverable Degraded Operation

#### Goals

- Keep search useful after transient request failures across more surfaces.
- Make image failures recoverable without restarting the flow.
- Standardize retry/timeout behavior in low-quality networks.
- Add tests that prove recovery instead of only happy-path submission.

---

## Workstream 1: Draft Persistence

### Objective

Persist unsaved user input locally and offer restoration when the user returns after interruption, refresh, or network failure.

### Scope

- Product create/edit
- Demand create/edit
- Business profile edit

### Proposed implementation

Create reusable local draft utilities:

- `lib/offline/drafts.ts`
- `lib/offline/storage.ts`

Suggested API:

```ts
interface DraftEnvelope<T> {
  version: number
  updatedAt: string
  data: T
}

function saveDraft<T>(key: string, data: T): void
function loadDraft<T>(key: string): DraftEnvelope<T> | null
function clearDraft(key: string): void
function hasDraft(key: string): boolean
```

### UI behavior

- Auto-save after a short debounce when form data changes.
- Show lightweight status text:
  - `Borrador guardado localmente`
  - `Sincronizando...`
  - `No se pudo sincronizar`
- On page load:
  - if draft exists and differs from defaults, offer restore.
- On successful submit:
  - clear draft.

### Files to update

- `components/products/ProductForm.tsx`
- `components/demand/DemandPostForm.tsx`
- `components/profile/BusinessProfileForm.tsx`

### Acceptance criteria

- Refreshing the page does not lose unsaved form text.
- Closing and reopening the browser tab restores the draft.
- A successful save clears the draft.
- The user always knows whether the current state is local-only or remote-synced.

### Status

Implemented in `main` for:

- `components/products/ProductFormWizard.tsx`
- `components/demand/DemandPostForm.tsx`
- `components/profile/BusinessProfileForm.tsx`

---

## Workstream 2: Network Status and Global Feedback

### Objective

Expose connectivity state across the app and provide consistent user messaging when the network is degraded.

### Proposed implementation

Add:

- `components/providers/NetworkStatusProvider.tsx`
- `components/network/NetworkStatusBanner.tsx`
- `lib/network/status.ts`

Suggested tracked states:

- `online`
- `offline`
- `degraded`
- `reconnecting`

### Detection approach

- Start with browser-level signals:
  - `navigator.onLine`
  - `online` / `offline` events
- Upgrade later with lightweight health probes to distinguish:
  - online but poor
  - online but backend unreachable

### UI behavior

- Global banner near the app shell.
- Non-blocking snackbar for transient failures.
- Forms display local-save assurance when offline.

### Files to update

- `app/layout.tsx`
- `components/providers/SnackbarProvider.tsx`
- new provider/components listed above

### Acceptance criteria

- Going offline updates app state without refresh.
- The user sees a clear banner when offline or reconnecting.
- Forms and search can react to network state.

### Status

Implemented in `main`.

---

## Workstream 3: Shared Request Policy

### Objective

Standardize timeouts, retries, and recoverable-network-error detection.

### Proposed implementation

Add:

- `lib/network/fetch.ts`

Suggested utilities:

```ts
interface FetchPolicyOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
}

async function fetchWithPolicy(
  input: RequestInfo | URL,
  options?: FetchPolicyOptions
): Promise<Response>

function isRecoverableNetworkError(error: unknown): boolean
```

### Default policy recommendations

- Search API:
  - timeout 8s
  - 1 retry
- Mutations:
  - timeout 12s
  - 1 retry for idempotent-safe paths only
- Image uploads:
  - keep existing explicit timeout behavior in `lib/utils/image.ts`
  - later add retry wrapper at caller level, not hidden inside storage utils

### Files to update

- `app/buscar/page.tsx`
- `app/api/search/route.ts`
- `app/api/search-demands/route.ts`
- optional future adoption across auth/profile routes

### Acceptance criteria

- Requests fail faster and more predictably.
- Retry logic is visible and bounded.
- Errors are consistently mapped to actionable user messages.

### Status

Implemented in `main`.

---

## Workstream 4: Resilient Publish Flow

### Objective

Make publishing robust when uploads or final submission fail.

### Product decision

Publishing should become a two-stage flow:

1. Save listing metadata first.
2. Upload and attach images second.

This reduces the chance that a long-running upload causes full form loss.

### P0 minimal version

Do not redesign the full product creation UX yet.

Implement:

- draft recovery before submit
- upload errors isolated per image
- explicit retry for failed images
- allow submit with remaining successful images

### P1 extension

Refactor create/edit flows into:

- metadata save
- deferred image attachment queue

### Files to update

- `components/products/ImageUpload.tsx`
- `components/shared/SingleImageUpload.tsx`
- `components/products/ProductForm.tsx`
- `components/demand/DemandPostForm.tsx`
- `components/profile/BusinessProfileForm.tsx`

### Acceptance criteria

- A single failed image does not invalidate the whole publish attempt.
- The user can retry only the failed upload.
- Successfully uploaded images remain attached.
- Text data remains recoverable even if uploads fail.

### Status

Partial in `main`.

What exists:

- drafts protect text loss
- uploads already use client-side compression and explicit timeouts

What is still missing:

- deferred image attachment queue
- resumable retry beyond current page session
- broader recovery coverage for every upload surface

---

## Workstream 5: Read Cache for Critical Discovery Flows

### Objective

Keep Telopillo useful for browsing and discovery under intermittent connectivity.

### Scope

- Home preview
- Search results
- Product detail
- Demand detail
- Categories

### P0 recommendation

Implement client-side cache for:

- last successful search response
- last viewed product detail
- last viewed demand detail

### P1 recommendation

Add broader read cache and PWA support for safe GET flows.

### Proposed implementation

Add:

- `lib/offline/readCache.ts`

Suggested capabilities:

- write-through cache after successful GET-backed render
- stale-on-error fallback
- TTL per content type

### Files to update

- `app/buscar/page.tsx`
- `app/productos/[id]/page.tsx`
- `app/busco/[id]/page.tsx`
- `app/page.tsx`

### Acceptance criteria

- If a search fails after a previous success, the user can still see recent cached results.
- Recently opened detail pages can show stale content when connectivity drops.
- Cached content is clearly marked when necessary.

### Status

Partial in `main`.

Implemented:

- stale-on-error cache for `app/buscar/page.tsx`
- stale-on-error cache for `app/busco/page.tsx`

Still missing:

- product detail stale cache
- demand detail stale cache
- home/category read cache

---

## Workstream 6: Search Degradation and Recovery UX

### Objective

Make search failures survivable without confusing the user.

### Existing behavior

The backend already falls back from semantic to keyword search.

### Needed UI improvements

- If API search fails entirely:
  - show retry
  - show last cached results if available
  - explain that connection may be unstable
- Preserve search query input and filters on failure.

### Files to update

- `app/buscar/page.tsx`
- `components/search/SearchBar.tsx`
- `components/search/SearchFilters.tsx`

### Acceptance criteria

- Search input is never lost on failure.
- The user has a recovery path beyond a blank error state.
- Search remains useful under degraded connectivity.

### Status

Partial in `main`.

What exists:

- backend semantic-to-keyword fallback
- stale-results fallback in `app/buscar/page.tsx` and `app/busco/page.tsx`

What is still missing:

- clearer degraded-mode messaging in more read surfaces
- broader reuse outside the two main search pages

---

## Workstream 7: Messaging Strategy

### Objective

Keep contact operable without introducing a fragile realtime dependency.

### Product rule

WhatsApp remains the primary fallback contact path even after internal chat exists.

### P0

- No internal chat dependency.
- Strengthen WhatsApp CTA placement and reliability.

### P1 / future M5

If internal chat is implemented:

- polling fallback required
- reconnection handling required
- unsent draft message persistence required
- WhatsApp CTA remains visible

### Files involved

- `components/products/ProductWhatsAppLink.tsx`
- `app/mensajes/page.tsx`
- future M5 chat components and DB work

### Acceptance criteria

- Contact never depends on realtime availability.
- A buyer always has a low-bandwidth path to reach a seller.

---

## Workstream 8: Observability

### Objective

Measure real-world network and resilience problems instead of inferring them.

### Metrics to add

- search request latency
- search request failure count
- upload timeout count
- upload partial failure count
- draft restore count
- draft abandonment count
- publish failure count
- semantic fallback ratio

### P0

Structured console/server logs if no telemetry backend is available yet.

### P1

Integrate a lightweight monitoring solution or central logging path.

### Files to update

- `app/api/search/route.ts`
- `app/api/search-demands/route.ts`
- `lib/utils/image.ts`
- submit handlers in publish/edit forms

### Acceptance criteria

- The team can identify the highest-friction network failures.
- Logs distinguish timeout, offline, auth, and backend errors.

### Status

Not implemented as a formal workstream.

---

## Workstream 9: Adverse-Network Testing

### Objective

Prove operability under realistic poor-network conditions.

### Test scenarios

1. Product form:
   - fill fields
   - go offline
   - refresh
   - restore draft
2. Demand form:
   - fail image upload
   - retry upload
3. Search:
   - successful search
   - offline search retry
   - stale-results fallback
4. Business profile:
   - partial edit
   - refresh
   - draft restore

### Files to add or update

- `tests/e2e/seller-journey/create-product.spec.ts`
- `tests/e2e/demand-side/create-demand.spec.ts`
- `tests/e2e/search-discovery/search-api.spec.ts`
- new cross-cutting resilience specs as needed

### Acceptance criteria

- Draft recovery is covered by automated tests.
- Search fallback is covered by automated tests.
- Upload partial-failure recovery is covered by automated tests.

### Status

Still pending in `main`.

---

## Recommended Execution Order

### Completed

- Draft utilities
- Product form draft persistence
- Demand form draft persistence
- Business profile draft persistence
- Network status provider and banner

### Next

- Adverse-network Playwright tests
- Read cache expansion beyond search
- Telemetry/logging for resilience events
- Deferred upload recovery improvements

### Later

- PWA/light offline enhancements
- Future chat fallback design inputs

## P0 File-Level Task List

### Priority files to modify next

- `tests/e2e/search-discovery/*`
- `tests/e2e/demand-side/*`
- `tests/e2e/seller-journey/*`
- read-cache wiring for detail/home pages
- resilience telemetry hooks

## Risks and Tradeoffs

### Risk: local draft corruption or schema drift

Mitigation:

- version every stored draft
- validate on load
- drop incompatible drafts safely

### Risk: too much UI noise from network messaging

Mitigation:

- use persistent banner only for durable states
- use snackbars for transient failures

### Risk: retries causing duplicate writes

Mitigation:

- only retry idempotent-safe operations automatically
- keep create flows user-confirmed unless protected by a draft/recovery model

### Risk: added complexity in forms

Mitigation:

- centralize draft logic in shared hooks/utilities
- keep form-specific code limited to wiring and status display

## Success Criteria

This rollout is successful when:

- users no longer lose in-progress product, demand, or profile work
- search remains useful during intermittent connectivity
- uploads fail in recoverable ways
- contact remains operable without realtime chat
- the team has enough telemetry to see where network limitations hurt the product most

## Recommendation

Implementation should start with:

1. adverse-network tests
2. read-cache expansion beyond search
3. resilience telemetry
4. deferred upload recovery improvements

These are now the highest-value remaining steps with the smallest architectural disruption.
