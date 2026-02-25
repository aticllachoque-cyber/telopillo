# Cross-Cutting Flow 21: Protected Routes and Auth Redirects

## Description

Verifies that protected routes redirect unauthenticated users to `/login`, and that authenticated users can access them. Also verifies public routes remain accessible without auth.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- For authenticated tests: saved auth state (`state-load --name=logged-in`) or valid test credentials
- For product edit test: a valid product ID from your database

## Test Steps

### Test A: Unauthenticated Access to Protected Routes

For each protected route, verify redirect to `/login`.

#### 1. Ensure no auth state

```
playwright-cli open http://localhost:3000 --session=fresh
```

Or start a new session without loading saved state.

#### 2. Test each protected route

**Route: /publicar**

```
playwright-cli navigate http://localhost:3000/publicar
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/publicar`. Login page renders.

**Route: /busco/publicar**

```
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/busco/publicar`. Login page renders.

**Route: /profile/edit**

```
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/profile/edit`. Login page renders.

**Route: /perfil/mis-productos**

```
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/perfil/mis-productos`. Login page renders.

**Route: /perfil/demandas**

```
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/perfil/demandas`. Login page renders.

**Route: /productos/{id}/editar**

Replace `{id}` with a valid product UUID from your database.

```
playwright-cli navigate http://localhost:3000/productos/{id}/editar
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/productos/{id}/editar`. Login page renders.

**Route: /mensajes**

```
playwright-cli navigate http://localhost:3000/mensajes
playwright-cli snapshot
```

**Expected:** Redirects to `/login`. URL contains `redirect=/mensajes`. Login page renders.

---

### Test B: Authenticated Access to Protected Routes

#### 1. Load logged-in state

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** User is logged in.

#### 2. Navigate to each protected route

**Route: /publicar**

```
playwright-cli navigate http://localhost:3000/publicar
playwright-cli snapshot
```

**Expected:** Product form wizard renders. No redirect to login.

**Route: /busco/publicar**

```
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

**Expected:** Demand form renders. No redirect to login.

**Route: /profile/edit**

```
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
```

**Expected:** Profile edit form renders. No redirect to login.

**Route: /perfil/mis-productos**

```
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

**Expected:** Products list renders. No redirect to login.

**Route: /perfil/demandas**

```
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

**Expected:** Demands list renders. No redirect to login.

---

### Test C: Auth State After Login

#### 1. Navigate to protected route (unauthenticated)

```
playwright-cli navigate http://localhost:3000/publicar
playwright-cli snapshot
```

**Expected:** Redirected to `/login` with `?redirect=/publicar`.

#### 2. Login with valid credentials

```
playwright-cli fill [email] "{valid-test-email}"
playwright-cli fill [password] "{valid-test-password}"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Login succeeds. Redirects back to `/publicar` (or home, depending on implementation).

---

### Test D: Public Routes Remain Accessible

Verify these routes work without authentication. Ensure no auth state is loaded.

#### 1. Home

```
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Home page loads. No redirect.

#### 2. Product search

```
playwright-cli navigate http://localhost:3000/buscar
playwright-cli snapshot
```

**Expected:** Search page loads. No redirect.

#### 3. Demand browse

```
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
```

**Expected:** Demand browse page loads. No redirect.

#### 4. Product detail

Replace `{id}` with a valid product UUID.

```
playwright-cli navigate http://localhost:3000/productos/{id}
playwright-cli snapshot
```

**Expected:** Product detail page loads. No redirect.

#### 5. Demand detail

Replace `{id}` with a valid demand post UUID.

```
playwright-cli navigate http://localhost:3000/busco/{id}
playwright-cli snapshot
```

**Expected:** Demand detail page loads. No redirect.

#### 6. Seller profile

Replace `{id}` with a valid profile UUID.

```
playwright-cli navigate http://localhost:3000/vendedor/{id}
playwright-cli snapshot
```

**Expected:** Seller profile page loads. No redirect.

#### 7. Categories

```
playwright-cli navigate http://localhost:3000/categorias
playwright-cli snapshot
```

**Expected:** Categories page loads. No redirect.

#### 8. Login and Register

```
playwright-cli navigate http://localhost:3000/login
playwright-cli snapshot
playwright-cli navigate http://localhost:3000/register
playwright-cli snapshot
```

**Expected:** Login and register pages load. No redirect.

#### 9. Static pages

```
playwright-cli navigate http://localhost:3000/terminos
playwright-cli snapshot
playwright-cli navigate http://localhost:3000/privacidad
playwright-cli snapshot
```

**Expected:** Terms and privacy pages load. No redirect.

## Verification Checklist

- [ ] `/publicar` redirects unauthenticated users to `/login`
- [ ] `/busco/publicar` redirects unauthenticated users to `/login`
- [ ] `/profile/edit` redirects unauthenticated users to `/login`
- [ ] `/perfil/mis-productos` redirects unauthenticated users to `/login`
- [ ] `/perfil/demandas` redirects unauthenticated users to `/login`
- [ ] `/productos/{id}/editar` redirects unauthenticated users to `/login`
- [ ] `/mensajes` redirects unauthenticated users to `/login`
- [ ] Redirect URL includes `redirect=` query param
- [ ] Login page renders after redirect
- [ ] Authenticated users can access all protected routes
- [ ] Product form wizard renders at `/publicar` when authenticated
- [ ] Demand form renders at `/busco/publicar` when authenticated
- [ ] Profile edit form renders at `/profile/edit` when authenticated
- [ ] Products list renders at `/perfil/mis-productos` when authenticated
- [ ] Demands list renders at `/perfil/demandas` when authenticated
- [ ] Login from redirect returns user to intended protected route
- [ ] Public routes (/, /buscar, /busco, /productos/{id}, /busco/{id}, /vendedor/{id}, /categorias, /login, /register, /terminos, /privacidad) remain accessible without auth
