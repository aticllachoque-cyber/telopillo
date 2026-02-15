# Auth Flow — E2E Test Plan

> **Plan ID:** E2E-AUTH-001
> **Priority:** Critical
> **Prerequisite Plans:** None (this runs first)
> **Target Files:**
> - `tests/e2e/auth/registration.spec.ts`
> - `tests/e2e/auth/login.spec.ts`
> - `tests/e2e/auth/password-recovery.spec.ts`

---

## Flow 1: Personal Account Registration

**User Story:** As a new user, I want to register with email and password so that I can buy and sell products.
**Preconditions:** No existing account with the test email.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to registration | `/register` | `page.goto('/register')` | Registration form visible with heading | `reg-01-form.png` |
| 1.2 | Verify form fields present | `/register` | `getByLabel('Nombre completo')`, `getByLabel('Email')`, `getByLabel('Contraseña')`, `getByLabel('Confirmar contraseña')` | All fields visible and empty | — |
| 1.3 | Verify OAuth buttons | `/register` | `getByRole('button', { name: /google/i })`, `getByRole('button', { name: /facebook/i })` | Both OAuth buttons visible | — |
| 1.4 | Fill valid registration data | `/register` | `getByLabel(...)` for each field | Fields accept input | — |
| 1.5 | Submit registration form | `/register` | `getByRole('button', { name: /crear cuenta/i })` | Form submits, redirect or success message | `reg-02-success.png` |
| 1.6 | Verify post-registration state | `/` or `/profile` | `page.url()` | User is redirected to home or profile | — |

**Assertions:**
- [ ] `expect(page).toHaveURL(/)` — redirected after registration
- [ ] User session is active (check Supabase auth state)
- [ ] No console errors during registration

**Error Scenarios:**

| # | Trigger | Input | Expected Behavior |
|---|---------|-------|-------------------|
| E1 | Submit empty form | All fields empty | Validation errors on all required fields |
| E2 | Invalid email format | `not-an-email` | Email validation error shown |
| E3 | Short password | `123` | Password requirements error |
| E4 | Mismatched passwords | Password: `Test1234`, Confirm: `Test5678` | "Passwords do not match" error |
| E5 | Duplicate email | `dev@telopillo.test` (existing) | "Email already registered" or Supabase error |
| E6 | SQL injection in name | `'; DROP TABLE profiles;--` | Input sanitized, no server error |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious violations
- [ ] Tab order: Name → Email → Password → Confirm → Submit
- [ ] All inputs have visible labels
- [ ] Error messages are associated with inputs via `aria-describedby`

**Mobile (375px):**
- [ ] No horizontal scroll
- [ ] Form fields full width
- [ ] Submit button reachable without scrolling
- [ ] OAuth buttons stack vertically or fit viewport

---

## Flow 2: Login with Email/Password

**User Story:** As a registered user, I want to log in so that I can access my account.
**Preconditions:** Account `dev@telopillo.test` / `DevTest123` exists.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Navigate to login | `/login` | `page.goto('/login')` | Login form visible | `login-01-form.png` |
| 2.2 | Fill email and password | `/login` | `getByLabel('Email')`, `getByLabel('Contraseña')` | Fields accept input | — |
| 2.3 | Submit login form | `/login` | `getByRole('button', { name: /iniciar sesión/i })` | Redirect to home | `login-02-success.png` |
| 2.4 | Verify authenticated state | `/` | Check for profile avatar or user menu | User menu/avatar visible in header | — |

**Assertions:**
- [ ] `expect(page).toHaveURL('/')` — redirected to home
- [ ] User menu or avatar visible in header
- [ ] No console errors

**Error Scenarios:**

| # | Trigger | Input | Expected Behavior |
|---|---------|-------|-------------------|
| E7 | Wrong password | Email: `dev@telopillo.test`, Password: `WrongPass` | Error: "Invalid login credentials" |
| E8 | Non-existent email | `ghost@telopillo.test` | Error: "Invalid login credentials" |
| E9 | Empty form submission | Both fields empty | Validation errors on both fields |
| E10 | Empty password | Email filled, password empty | Password required error |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Tab: Email → Password → Submit → "Forgot password" link → Register link
- [ ] "Forgot password" link accessible via keyboard

**Mobile (375px):**
- [ ] No horizontal scroll
- [ ] Login form fills viewport width
- [ ] "Forgot password" and "Register" links visible

---

## Flow 3: Password Recovery

**User Story:** As a user who forgot my password, I want to reset it so that I can access my account again.
**Preconditions:** Account exists with valid email.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Navigate to forgot password | `/forgot-password` | `page.goto('/forgot-password')` | Form visible with email field | `forgot-01-form.png` |
| 3.2 | Fill email | `/forgot-password` | `getByLabel('Email')` | Field accepts input | — |
| 3.3 | Submit form | `/forgot-password` | `getByRole('button', { name: /enviar/i })` | Success message shown | `forgot-02-sent.png` |
| 3.4 | Verify success state | `/forgot-password` | `getByText(/revisa tu correo/i)` or similar | Confirmation message visible | — |

**Error Scenarios:**

| # | Trigger | Input | Expected Behavior |
|---|---------|-------|-------------------|
| E11 | Empty email | Submit with empty field | Validation error |
| E12 | Invalid email format | `not-valid` | Email format error |
| E13 | Non-existent email | `ghost@telopillo.test` | Same success message (no info leak) |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Single-field form: Tab → Email → Submit
- [ ] Success message announced to screen readers

**Mobile (375px):**
- [ ] No horizontal scroll
- [ ] Form fills viewport

---

## Flow 4: Auth-Protected Route Redirects

**User Story:** As an unauthenticated user, I should be redirected to login when accessing protected pages.
**Preconditions:** User is NOT logged in.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 4.1 | Visit `/profile/edit` unauthenticated | `/profile/edit` | `page.goto('/profile/edit')` | Redirect to `/login` | — |
| 4.2 | Visit `/publicar` unauthenticated | `/publicar` | `page.goto('/publicar')` | Redirect to `/login` | — |
| 4.3 | Visit `/perfil/mis-productos` unauthenticated | `/perfil/mis-productos` | `page.goto('/perfil/mis-productos')` | Redirect to `/login` | — |

**Assertions:**
- [ ] `expect(page).toHaveURL(/\/login/)` for each protected route
- [ ] No flash of protected content before redirect

---

## Flow 5: Auth Redirect for Logged-In Users

**User Story:** As a logged-in user, I should be redirected away from auth pages.
**Preconditions:** User IS logged in.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 5.1 | Visit `/login` while authenticated | `/login` | `page.goto('/login')` | Redirect to `/` | — |
| 5.2 | Visit `/register` while authenticated | `/register` | `page.goto('/register')` | Redirect to `/` | — |

**Assertions:**
- [ ] `expect(page).toHaveURL('/')` for each auth route

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Existing user | `dev@telopillo.test` / `DevTest123` | For login tests |
| New user | `reg-{timestamp}@telopillo.test` / `TestPass123!` | Created during registration test, cleaned up after |
