# Account Flow 11: Login and Logout

## Description

Verifies that a user can log in with email/password, persist session state, and log out. Covers successful login, invalid credentials, logout, and session persistence.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- Test user credentials (email and password) for successful login tests

## Test Steps

### Test A: Successful Login

#### 1. Navigate to login page

```
playwright-cli navigate http://localhost:3000/login
playwright-cli snapshot
```

**Expected:** Login page loads. Card with "Iniciar Sesión" heading is visible.

#### 2. Verify form fields and links

```
playwright-cli assert [email] --visible
playwright-cli assert [password] --visible
playwright-cli snapshot
```

**Expected:** Email and password inputs present. OAuth buttons exist. "Regístrate" link to `/register`. "¿Olvidaste tu contraseña?" link to `/forgot-password`.

#### 3. Fill valid credentials and submit

```
playwright-cli fill [email] "{valid-test-email}"
playwright-cli fill [password] "{valid-test-password}"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Form submits. Redirect to home (`/`) or previous page. Header shows user avatar/menu.

#### 4. Verify logged-in state

```
playwright-cli assert [user-menu] --visible
```

**Expected:** User avatar in header is visible. "Ingresar" button is not shown.

#### 5. Save auth state for reuse

```
playwright-cli state-save --name=logged-in
```

**Expected:** Auth state saved. Can be restored with `state-load --name=logged-in`.

---

### Test B: Login with Invalid Credentials

#### 1. Navigate to login page

```
playwright-cli navigate http://localhost:3000/login
playwright-cli snapshot
```

#### 2. Fill wrong credentials

```
playwright-cli fill [email] "wrong@example.com"
playwright-cli fill [password] "WrongPassword123!"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Error message displayed (e.g. "Invalid login credentials" or similar). User stays on login page. No redirect.

---

### Test C: Logout

#### 1. Load saved auth state (or log in first)

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** User is logged in. Header shows avatar.

#### 2. Open user menu

```
playwright-cli click [user-avatar]
playwright-cli snapshot
```

**Expected:** Dropdown menu opens with "Mi Perfil", "Mis Publicaciones", "Editar Perfil", "Cerrar Sesión".

#### 3. Click logout

```
playwright-cli click [logout-item]
playwright-cli snapshot
```

**Expected:** User is logged out. Redirect to home. Header shows "Ingresar" button. User menu is no longer visible.

---

### Test D: Session Persistence

#### 1. Log in and save state

```
playwright-cli navigate http://localhost:3000/login
playwright-cli fill [email] "{valid-test-email}"
playwright-cli fill [password] "{valid-test-password}"
playwright-cli click [submit-button]
playwright-cli state-save --name=logged-in
```

**Expected:** Login succeeds. State saved.

#### 2. Close session and reopen with saved state

Start a new Playwright CLI session, then:

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/profile
playwright-cli snapshot
```

**Expected:** User is still logged in. Profile page loads. User data is visible. No redirect to login.

## Verification Checklist

- [ ] Login page loads at `/login`
- [ ] Form fields email and password are present
- [ ] OAuth buttons exist
- [ ] "Regístrate" link navigates to `/register`
- [ ] "¿Olvidaste tu contraseña?" link navigates to `/forgot-password`
- [ ] Valid login redirects to home and shows user menu
- [ ] Invalid credentials show error and keep user on login page
- [ ] Logout via "Cerrar Sesión" redirects to home
- [ ] After logout, header shows "Ingresar" button
- [ ] Saved auth state restores session correctly
- [ ] Profile page is accessible when logged in via state-load
