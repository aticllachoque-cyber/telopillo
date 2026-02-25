# Account Flow 10: User Registration

## Description

Verifies that a visitor can create a personal account or a business account via the registration form. Covers form validation, OAuth presence, and post-registration redirect.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running (or configured backend)
- No authentication required (visitor flow)

## Registration Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fullName | text | Yes | Minimum 2 characters |
| email | email | Yes | Valid email format |
| password | password | Yes | Min 8 chars, 1 uppercase, 1 number; has show/hide toggle |
| confirmPassword | password | Yes | Must match password; has show/hide toggle |
| businessName | text | No | In expandable "¿Tienes un negocio?" section |
| businessCategory | select | No | Optional; in expandable section |

## Test Steps

### Test A: Personal Account Registration

#### 1. Navigate to registration page

```
playwright-cli navigate http://localhost:3000/register
playwright-cli snapshot
```

**Expected:** Registration page loads. Card with "Crear Cuenta" heading is visible.

#### 2. Verify form fields and links

```
playwright-cli assert [fullName] --visible
playwright-cli assert [email] --visible
playwright-cli assert [password] --visible
playwright-cli assert [confirmPassword] --visible
playwright-cli snapshot
```

**Expected:** Inputs for fullName, email, password, confirmPassword are present. OAuth buttons (Google, Facebook) exist. "Inicia sesión" link to `/login` is visible.

#### 3. Fill form with valid test data

Use a unique email to avoid conflicts. Replace `{timestamp}` with current Unix timestamp or a random suffix.

```
playwright-cli fill [fullName] "Test User Playwright"
playwright-cli fill [email] "test-{timestamp}@example.com"
playwright-cli fill [password] "TestPass123!"
playwright-cli fill [confirmPassword] "TestPass123!"
playwright-cli snapshot
```

**Expected:** All fields are filled. Submit button "Crear Cuenta" is enabled.

#### 4. Submit form

```
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Form submits. Redirect to home page (`/`) or onboarding. Header shows user avatar/menu instead of "Ingresar" button.

#### 5. Verify logged-in state

```
playwright-cli assert [user-menu] --visible
```

**Expected:** User menu (avatar) is visible in header. User is logged in.

---

### Test B: Registration with Business Account

#### 1. Navigate to registration page

```
playwright-cli navigate http://localhost:3000/register
playwright-cli snapshot
```

**Expected:** Registration page loads.

#### 2. Fill personal fields

```
playwright-cli fill [fullName] "Test User Playwright"
playwright-cli fill [email] "test-business-{timestamp}@example.com"
playwright-cli fill [password] "TestPass123!"
playwright-cli fill [confirmPassword] "TestPass123!"
playwright-cli snapshot
```

**Expected:** Personal fields are filled.

#### 3. Expand business section

```
playwright-cli click [business-toggle]
playwright-cli snapshot
```

**Expected:** Business section expands. Fields for "Nombre del Negocio" and "Categoría del Negocio" appear. Toggle text: "¿Tienes un negocio? Créalo ahora (opcional)".

#### 4. Fill business fields

```
playwright-cli fill [businessName] "Test Business CLI"
playwright-cli click [businessCategory-trigger]
playwright-cli click [businessCategory-option]
playwright-cli snapshot
```

**Expected:** Business name filled. Category selected from dropdown (e.g. "Tecnologia", "Ropa y Moda").

#### 5. Submit form

```
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Redirect to home. User is logged in. Header shows user menu.

---

### Test C: Validation Errors

#### 1. Navigate to registration page

```
playwright-cli navigate http://localhost:3000/register
playwright-cli snapshot
```

#### 2. Submit empty form

```
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Validation errors shown for required fields (fullName, email, password, confirmPassword). User stays on registration page.

#### 3. Fill mismatched passwords

```
playwright-cli fill [fullName] "Test User"
playwright-cli fill [email] "test@example.com"
playwright-cli fill [password] "TestPass123!"
playwright-cli fill [confirmPassword] "DifferentPass1!"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Error message about passwords not matching (e.g. "Las contraseñas no coinciden").

#### 4. Fill invalid email

```
playwright-cli fill [fullName] "Test User"
playwright-cli fill [email] "not-an-email"
playwright-cli fill [password] "TestPass123!"
playwright-cli fill [confirmPassword] "TestPass123!"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Email validation error (e.g. "Email inválido").

#### 5. Fill too short password

```
playwright-cli fill [fullName] "Test User"
playwright-cli fill [email] "test@example.com"
playwright-cli fill [password] "short"
playwright-cli fill [confirmPassword] "short"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Password validation error (e.g. minimum 8 characters, uppercase, number).

## Verification Checklist

- [ ] Registration page loads at `/register`
- [ ] Form fields fullName, email, password, confirmPassword are present
- [ ] OAuth buttons (Google, Facebook) exist
- [ ] "Inicia sesión" link navigates to `/login`
- [ ] Personal registration succeeds and redirects to home
- [ ] Header shows user menu after successful registration
- [ ] Business section expands when "¿Tienes un negocio?" is clicked
- [ ] Business registration with name and category succeeds
- [ ] Empty form shows validation errors
- [ ] Mismatched passwords show error
- [ ] Invalid email shows error
- [ ] Too short password shows error
