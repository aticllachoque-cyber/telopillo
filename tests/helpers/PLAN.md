# Shared Helpers — Design Plan

> **Purpose:** Reusable utility functions shared across all test suites.
> **File:** `tests/helpers/index.ts`

---

## Helper: `login(page, email, password)`

**Description:** Performs email/password login through the UI.

```
Steps:
  1. Navigate to /login
  2. Fill email input
  3. Fill password input
  4. Click submit
  5. Wait for redirect (URL changes from /login)
  6. Return void (page is now authenticated)

Error handling:
  - Throw if login form not found
  - Throw if redirect doesn't happen within 10s
```

---

## Helper: `runAxeAudit(page, options?)`

**Description:** Runs axe-core accessibility scan and returns structured results.

```
Parameters:
  - page: Playwright Page
  - options?: {
      tags?: string[]           // Default: ['wcag2a', 'wcag2aa', 'wcag22aa']
      exclude?: string[]        // CSS selectors to exclude
      assertZeroCritical?: boolean  // Default: true
      assertZeroSerious?: boolean   // Default: true
    }

Steps:
  1. Create AxeBuilder with page
  2. Set WCAG tags
  3. Exclude known false positives
  4. Run analyze()
  5. Filter violations by impact
  6. Assert zero critical (if enabled)
  7. Assert zero serious (if enabled)
  8. Return { violations, passes, incomplete }
```

---

## Helper: `assertNoHorizontalScroll(page)`

**Description:** Verifies no horizontal scrollbar is present.

```
Steps:
  1. Evaluate: document.documentElement.scrollWidth
  2. Evaluate: document.documentElement.clientWidth
  3. Assert: scrollWidth <= clientWidth + 5 (5px tolerance)
```

---

## Helper: `assertTouchTargets(page, selector)`

**Description:** Verifies interactive elements meet 44px minimum touch target.

```
Parameters:
  - page: Playwright Page
  - selector: string (CSS selector for elements to check)

Steps:
  1. Query all elements matching selector
  2. For each element, get bounding box
  3. Assert: width >= 44 && height >= 44
  4. Return list of elements that fail
```

---

## Helper: `createTestProduct(supabase, data)`

**Description:** Creates a product directly in Supabase for test setup.

```
Parameters:
  - supabase: SupabaseClient (service role)
  - data: {
      title: string
      description?: string
      price: number
      category: string
      userId: string
    }

Returns: { id, title, slug }

Teardown companion: deleteTestProduct(supabase, id)
```

---

## Helper: `createBusinessProfile(supabase, userId, data)`

**Description:** Creates a business profile for a user.

```
Parameters:
  - supabase: SupabaseClient (service role)
  - userId: string
  - data: {
      businessName: string
      businessCategory: string
      description?: string
      slug?: string  // Auto-generated if not provided
    }

Returns: { id, slug, businessName }

Teardown companion: deleteBusinessProfile(supabase, id)
```

---

## Helper: `takeScreenshot(page, name, folder?)`

**Description:** Takes a screenshot with consistent naming and directory structure.

```
Parameters:
  - page: Playwright Page
  - name: string (e.g., "buyer-01-home")
  - folder?: string (e.g., "buyer-journey") — defaults to test suite folder

Output path: tests/screenshots/{folder}/{name}.png
```

---

## Helper: `waitForPageReady(page)`

**Description:** Waits for a page to be fully loaded and interactive.

```
Steps:
  1. Wait for 'networkidle' load state
  2. Wait for no loading spinners visible
  3. Wait for main content visible
  4. Return void
```

---

## Helper: `logViolations(violations)`

**Description:** Formats and logs axe-core violations for debugging.

```
Output format:
  [CRITICAL] button-name: Buttons must have discernible text
    → <button class="btn">...</button> at /login
  [SERIOUS] color-contrast: Elements must have sufficient color contrast
    → <span class="text-gray">...</span> at /register
```

---

## Implementation Notes

- Export all helpers from `tests/helpers/index.ts`
- Helpers are pure functions (no state, no side effects beyond parameters)
- Use TypeScript for type safety
- Each helper includes JSDoc with parameters and return type
- Supabase helpers use service role client (never browser client)
