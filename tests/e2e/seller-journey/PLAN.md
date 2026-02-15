# Seller Journey — E2E Test Plan

> **Plan ID:** E2E-SELLER-001
> **Priority:** Critical
> **Prerequisite Plans:** E2E-AUTH-001 (authenticated user required)
> **Target Files:**
> - `tests/e2e/seller-journey/create-product.spec.ts`
> - `tests/e2e/seller-journey/manage-products.spec.ts`
> - `tests/e2e/seller-journey/edit-product.spec.ts`
> - `tests/e2e/seller-journey/complete-seller-flow.spec.ts`

---

## Complete Seller Journey

```
Login → Navigate to Publish → Fill Wizard Step 1-4 → Publish Product
→ View in My Products → Edit Product → Mark as Sold → Delete
```

---

## Flow 1: Create Product (Wizard End-to-End)

**User Story:** As a seller, I want to create a product listing through the wizard so that buyers can find my product.
**Preconditions:** User is authenticated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to publish page | `/publicar` | `page.goto('/publicar')` | Wizard Step 1 visible | `sell-01-wizard-start.png` |
| 1.2 | **Step 1 — Basic Info:** Fill title | `/publicar` | `getByLabel(/título/i)` | Field accepts text: "Samsung Galaxy S24" | — |
| 1.3 | Fill description | `/publicar` | `getByLabel(/descripción/i)` | Textarea accepts: "En excelente estado..." | — |
| 1.4 | Select category | `/publicar` | Category select/dropdown | "Electrónica" selected | — |
| 1.5 | Click Next | `/publicar` | `getByRole('button', { name: /siguiente/i })` | Advance to Step 2 | `sell-02-step2.png` |
| 1.6 | **Step 2 — Details:** Fill price | `/publicar` | `getByLabel(/precio/i)` | Field accepts: 2500 | — |
| 1.7 | Select condition | `/publicar` | Condition select | "Usado - Buen estado" selected | — |
| 1.8 | Select location | `/publicar` | Location select | "Santa Cruz" selected | — |
| 1.9 | Click Next | `/publicar` | Next button | Advance to Step 3 | `sell-03-step3.png` |
| 1.10 | **Step 3 — Photos:** Upload image | `/publicar` | File input | Image uploaded and preview shown | `sell-04-photo.png` |
| 1.11 | Click Next | `/publicar` | Next button | Advance to Step 4 (Review) | `sell-05-review.png` |
| 1.12 | **Step 4 — Review:** Verify summary | `/publicar` | Review section | All entered data shown correctly | — |
| 1.13 | Click Publish | `/publicar` | `getByRole('button', { name: /publicar/i })` | Product created, redirect to product detail or success | `sell-06-published.png` |

**Assertions:**
- [ ] Wizard progresses through all 4 steps
- [ ] Each step validates required fields before advancing
- [ ] Review step shows all entered data accurately
- [ ] After publish: redirect to product detail page or my products
- [ ] Product appears in `/perfil/mis-productos`
- [ ] Product appears in search results for "Samsung Galaxy S24"
- [ ] No console errors during entire flow

**Error Scenarios:**

| # | Trigger | Step | Expected Behavior |
|---|---------|------|-------------------|
| E1 | Submit Step 1 without title | Step 1 | Title required validation error |
| E2 | Submit Step 1 without category | Step 1 | Category required validation error |
| E3 | Enter negative price | Step 2 | Price validation error |
| E4 | Enter price = 0 | Step 2 | Price must be positive |
| E5 | Skip photo upload | Step 3 | Proceed (photos may be optional) or validation error |
| E6 | Upload oversized image | Step 3 | File size error or compression |
| E7 | Upload non-image file | Step 3 | File type error |
| E8 | Navigate back and forth | Any | Data preserved across steps |

**Accessibility:**
- [ ] axe-core scan on each wizard step
- [ ] Tab order follows visual order within each step
- [ ] Select elements are keyboard-operable
- [ ] File upload is accessible via keyboard
- [ ] Progress indicator communicates current step to screen readers

**Mobile (375px):**
- [ ] Wizard steps fit mobile viewport
- [ ] No horizontal scroll at any step
- [ ] File upload works on mobile
- [ ] Navigation buttons (Back/Next) are full-width
- [ ] Touch targets >= 44px

---

## Flow 2: My Products Management

**User Story:** As a seller, I want to view and manage all my listed products.
**Preconditions:** User is authenticated and has at least 2 published products.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Navigate to my products | `/perfil/mis-productos` | `page.goto(...)` | Products list visible | `sell-07-my-products.png` |
| 2.2 | Verify product cards shown | `/perfil/mis-productos` | Product card elements | At least 2 products listed with title, price, status | — |
| 2.3 | Verify product status indicators | `/perfil/mis-productos` | Status badge/label | Active products marked as active | — |
| 2.4 | Use sort/filter controls | `/perfil/mis-productos` | Sort/filter UI | Products reorder or filter | — |

**Assertions:**
- [ ] All user's products are listed
- [ ] Each product shows title, price, status, image thumbnail
- [ ] Products link to their detail pages
- [ ] Empty state shown if user has no products

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E9 | User with no products | Empty state: "No products yet" with CTA to publish |
| E10 | Slow loading | Loading skeleton or spinner shown |

---

## Flow 3: Edit Product

**User Story:** As a seller, I want to edit my product listing to update information.
**Preconditions:** User is authenticated and owns the product.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Navigate to edit page | `/productos/[id]/editar` | From my products or direct URL | Edit form pre-filled with product data | `sell-08-edit.png` |
| 3.2 | Modify title | `/productos/[id]/editar` | Title input | Title updated | — |
| 3.3 | Modify price | `/productos/[id]/editar` | Price input | Price updated | — |
| 3.4 | Save changes | `/productos/[id]/editar` | Save button | Success message, changes persisted | `sell-09-saved.png` |
| 3.5 | Verify changes on detail page | `/productos/[id]` | Navigate to product | Updated title and price visible | — |

**Assertions:**
- [ ] Edit form pre-fills with current product data
- [ ] Changes persist after save
- [ ] Product detail page reflects updated data
- [ ] Only product owner can access edit page

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E11 | Edit another user's product | Redirect or "Not authorized" error |
| E12 | Clear required fields and save | Validation errors shown |
| E13 | Edit non-existent product | `/productos/fake-id/editar` — 404 |

---

## Flow 4: Mark as Sold / Delete Product

**User Story:** As a seller, I want to mark a product as sold or delete it when no longer available.
**Preconditions:** User has at least 1 active product.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 4.1 | Navigate to my products | `/perfil/mis-productos` | `page.goto(...)` | Products listed | — |
| 4.2 | Mark product as sold | `/perfil/mis-productos` | "Mark sold" button/action | Product status changes to "Sold" | `sell-10-sold.png` |
| 4.3 | Verify sold status | `/perfil/mis-productos` | Status badge | "Vendido" badge visible | — |
| 4.4 | Delete a product | `/perfil/mis-productos` | Delete button → confirm dialog | Product removed from list | `sell-11-deleted.png` |
| 4.5 | Verify deletion | `/perfil/mis-productos` | Product list | Deleted product no longer appears | — |
| 4.6 | Verify deleted product URL | `/productos/[deleted-id]` | Direct navigation | 404 or "Product not found" | — |

**Assertions:**
- [ ] Mark as sold changes status indicator
- [ ] Sold products no longer appear in search results
- [ ] Delete requires confirmation (no accidental deletion)
- [ ] Deleted products return 404 on direct access
- [ ] Product count in my products updates after operations

---

## Flow 5: Complete Seller Flow (End-to-End)

**User Story:** As a seller, I complete the entire lifecycle: list → manage → edit → sell → cleanup.
**Preconditions:** Authenticated user.

| Step | Action | Expected Result | Screenshot |
|------|--------|-----------------|------------|
| 5.1 | Create product via wizard | Product published | `sell-e2e-01.png` |
| 5.2 | Verify product in my products | Product listed | `sell-e2e-02.png` |
| 5.3 | Verify product in search | Product found via search | `sell-e2e-03.png` |
| 5.4 | Edit product price | Price updated | `sell-e2e-04.png` |
| 5.5 | Verify updated price in detail | New price shown | `sell-e2e-05.png` |
| 5.6 | Mark product as sold | Status is "Vendido" | `sell-e2e-06.png` |
| 5.7 | Verify product not in search | Not found in search results | — |
| 5.8 | Delete product | Product removed | `sell-e2e-07.png` |

**Assertions:**
- [ ] Full lifecycle completes without errors
- [ ] Each state change is reflected across all views (my products, detail, search)

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Authenticated seller | `dev@telopillo.test` / `DevTest123` | Pre-existing |
| Test product | Created during test, cleaned up after | Dynamic |
| Test image | 1x1 PNG buffer (for upload) | Created in test |
