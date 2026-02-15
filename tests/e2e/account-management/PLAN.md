# Account Management — E2E Test Plan

> **Plan ID:** E2E-ACCOUNT-001
> **Priority:** High
> **Prerequisite Plans:** E2E-AUTH-001 (authenticated user)
> **Target Files:**
> - `tests/e2e/account-management/profile-view.spec.ts`
> - `tests/e2e/account-management/profile-edit.spec.ts`
> - `tests/e2e/account-management/avatar-upload.spec.ts`
> - `tests/e2e/account-management/product-management.spec.ts`

---

## Complete Account Management Flow

```
View Profile → Edit Profile → Upload Avatar → Update Location
→ View My Products → Manage Listings → Sign Out
```

---

## Flow 1: View Profile

**User Story:** As a user, I want to view my profile page to see my account information.
**Preconditions:** User is authenticated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to profile | `/profile` | `page.goto('/profile')` | Profile page loads | `acct-01-profile.png` |
| 1.2 | Verify user info displayed | `/profile` | User name, email, avatar | Personal info visible | — |
| 1.3 | Verify location shown | `/profile` | Location text | City/department visible | — |
| 1.4 | Verify rating displayed | `/profile` | Rating element | Rating score or "No ratings yet" | — |
| 1.5 | Verify edit profile link | `/profile` | `getByRole('link', { name: /editar/i })` | Links to `/profile/edit` | — |
| 1.6 | Verify sign out button | `/profile` | `getByRole('button', { name: /cerrar sesión/i })` | Sign out button visible | — |

**Assertions:**
- [ ] Profile shows current user data (name, email)
- [ ] Avatar or default placeholder visible
- [ ] Edit link navigates to `/profile/edit`
- [ ] Sign out button is functional

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E1 | Visit `/profile` unauthenticated | Redirect to `/login` |
| E2 | User with no profile data | Default placeholders shown |

---

## Flow 2: Edit Profile

**User Story:** As a user, I want to edit my profile information to keep it up to date.
**Preconditions:** User is authenticated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Navigate to profile edit | `/profile/edit` | `page.goto('/profile/edit')` | Edit form visible | `acct-02-edit.png` |
| 2.2 | Verify form pre-filled | `/profile/edit` | Input values | Current name, location pre-filled | — |
| 2.3 | Update display name | `/profile/edit` | `getByLabel(/nombre/i)` | Name updated in input | — |
| 2.4 | Update location | `/profile/edit` | Location select/input | Location changed | — |
| 2.5 | Add phone number | `/profile/edit` | `getByLabel(/teléfono/i)` | Phone entered | — |
| 2.6 | Save changes | `/profile/edit` | `getByRole('button', { name: /guardar/i })` | Success toast or message | `acct-03-saved.png` |
| 2.7 | Verify changes persisted | `/profile` | Navigate to profile view | Updated name and location visible | — |

**Assertions:**
- [ ] Form pre-fills with current user data
- [ ] Changes save successfully (success feedback)
- [ ] Changes persist after page reload
- [ ] Changes reflected on profile view page
- [ ] Phone addition updates KYC level (trust badge change)

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E3 | Clear display name and save | Validation: name required |
| E4 | Invalid phone format | Phone validation error |
| E5 | Very long name (200+ chars) | Character limit or truncation |
| E6 | XSS in name: `<script>alert(1)</script>` | Sanitized, no execution |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Tab through all form fields
- [ ] Error messages linked to inputs
- [ ] Save button keyboard-accessible

**Mobile (375px):**
- [ ] Form fields full width
- [ ] No horizontal scroll
- [ ] Save button reachable
- [ ] Avatar upload area usable

---

## Flow 3: Avatar Upload

**User Story:** As a user, I want to upload a profile photo to personalize my account.
**Preconditions:** User is authenticated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Navigate to profile edit | `/profile/edit` | `page.goto('/profile/edit')` | Avatar section visible | — |
| 3.2 | Click avatar upload area | `/profile/edit` | Avatar upload button/area | File picker opens | — |
| 3.3 | Upload valid image | `/profile/edit` | File input | Image preview shown | `acct-04-avatar.png` |
| 3.4 | Save profile | `/profile/edit` | Save button | Avatar saved | — |
| 3.5 | Verify avatar on profile | `/profile` | Avatar image element | New avatar displayed | — |
| 3.6 | Verify avatar in header | Any page | Header avatar | Avatar shown in navigation | — |

**Assertions:**
- [ ] Image preview shows before saving
- [ ] Avatar persists after save and page reload
- [ ] Avatar appears in header navigation
- [ ] Avatar appears on public seller profile

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E7 | Upload non-image file (.pdf) | File type error |
| E8 | Upload oversized image (>5MB) | Size limit error |
| E9 | Upload with slow connection (simulate) | Loading state visible |

---

## Flow 4: Product Management from My Products

**User Story:** As a seller, I want to manage all my products from one place.
**Preconditions:** User is authenticated with at least 3 products.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 4.1 | Navigate to my products | `/perfil/mis-productos` | `page.goto(...)` | Products list | `acct-05-products.png` |
| 4.2 | Verify product count | `/perfil/mis-productos` | Count display or card count | Correct number of products | — |
| 4.3 | Filter by status (active) | `/perfil/mis-productos` | Status filter | Only active products shown | — |
| 4.4 | Sort by newest | `/perfil/mis-productos` | Sort control | Products reordered | — |
| 4.5 | Click edit on a product | `/perfil/mis-productos` | Edit button on card | Navigate to `/productos/[id]/editar` | — |
| 4.6 | Click view on a product | `/perfil/mis-productos` | Product card or view button | Navigate to `/productos/[id]` | — |

**Assertions:**
- [ ] All user's products displayed
- [ ] Each card shows: title, price, status, thumbnail
- [ ] Filter and sort controls work
- [ ] Edit and view actions navigate correctly
- [ ] Product count matches actual product count

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E10 | User with zero products | Empty state: "No products" + CTA to publish |
| E11 | Visit unauthenticated | Redirect to `/login` |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Product cards are keyboard navigable
- [ ] Status filters accessible
- [ ] Action buttons have accessible labels

**Mobile (375px):**
- [ ] Product cards stack vertically
- [ ] No horizontal scroll
- [ ] Action buttons have adequate touch targets
- [ ] Filter/sort controls usable on mobile

---

## Flow 5: Sign Out

**User Story:** As a user, I want to sign out of my account securely.
**Preconditions:** User is authenticated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 5.1 | Navigate to profile | `/profile` | `page.goto('/profile')` | Profile page | — |
| 5.2 | Click sign out | `/profile` | `getByRole('button', { name: /cerrar sesión/i })` | Session ended | — |
| 5.3 | Verify redirect | `/login` or `/` | `page.url()` | Redirected to public page | `acct-06-signedout.png` |
| 5.4 | Verify session cleared | Any protected route | `page.goto('/profile/edit')` | Redirect to `/login` | — |

**Assertions:**
- [ ] User is redirected after sign out
- [ ] Protected routes redirect to login
- [ ] Header shows guest state (no avatar/menu)
- [ ] No stale session data visible

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Test user | `dev@telopillo.test` / `DevTest123` | With existing profile |
| Test avatar | 100x100 JPEG or PNG (< 1MB) | For upload tests |
| User products | At least 3 products (2 active, 1 sold) | For management tests |
