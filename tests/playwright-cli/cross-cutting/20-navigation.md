# Cross-Cutting Flow 20: Navigation, Header, Mobile Menu

## Description

Verifies header elements, desktop and mobile navigation, search bar behavior, and user menu across authenticated and unauthenticated states.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- For authenticated tests: saved auth state (`state-load --name=logged-in`) or valid test credentials

## Test Steps

### Test A: Desktop Header (unauthenticated)

#### 1. Open home page with desktop viewport

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Page loads. Header visible with logo, search bar, "Publicar Gratis" button, and "Ingresar" button.

#### 2. Verify header elements

```
playwright-cli assert [logo] --visible
playwright-cli assert [search-bar] --visible
playwright-cli assert [publicar-gratis] --visible
playwright-cli assert [ingresar] --visible
```

**Expected:** Logo links to `/`. SearchBar in center. "Publicar Gratis" button links to `/publicar`. "Ingresar" button or UserMenu present.

#### 3. Click logo and verify navigation

```
playwright-cli click [logo]
playwright-cli snapshot
```

**Expected:** Navigates to `/`. Home page loads.

#### 4. Click "Publicar Gratis"

```
playwright-cli click [publicar-gratis]
playwright-cli snapshot
```

**Expected:** Navigates to `/publicar` or redirects to `/login` if not authenticated.

#### 5. Use search bar

```
playwright-cli navigate http://localhost:3000
playwright-cli fill [search-input] "laptop"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar?q=laptop`. Search results page loads.

---

### Test B: Desktop Header (authenticated)

#### 1. Load logged-in state and navigate to home

```
playwright-cli state-load --name=logged-in
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** User is logged in. Header shows user avatar dropdown instead of "Ingresar".

#### 2. Click avatar to open dropdown

```
playwright-cli click [user-avatar]
playwright-cli snapshot
```

**Expected:** Dropdown menu appears with: Perfil (or Mi Perfil) → `/profile`, Mis Publicaciones → `/perfil/mis-productos`, Mis Solicitudes → `/perfil/demandas`, Mensajes → `/mensajes`, Cerrar Sesión (button).

#### 3. Navigate to each menu item

```
playwright-cli click [perfil-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/profile`.

```
playwright-cli click [user-avatar]
playwright-cli click [mis-publicaciones-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/perfil/mis-productos`.

```
playwright-cli click [user-avatar]
playwright-cli click [mis-solicitudes-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/perfil/demandas`.

```
playwright-cli click [user-avatar]
playwright-cli click [mensajes-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/mensajes`.

---

### Test C: Mobile Menu (unauthenticated)

#### 1. Resize to mobile viewport

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Mobile layout. Hamburger menu button visible.

#### 2. Open hamburger menu

```
playwright-cli click [hamburger-button]
playwright-cli snapshot
```

**Expected:** Mobile menu opens (aria-controls="mobile-nav-dialog").

#### 3. Verify mobile menu items (unauthenticated)

```
playwright-cli assert [crear-cuenta-banner] --visible
playwright-cli assert [inicio-link] --visible
playwright-cli assert [productos-link] --visible
playwright-cli assert [categorias-link] --visible
playwright-cli assert [se-busca-link] --visible
playwright-cli assert [iniciar-sesion-link] --visible
playwright-cli assert [footer-cta-crear-cuenta] --visible
```

**Expected:** "Crear Cuenta" banner → `/register`. Inicio → `/`. Productos → `/buscar`. Categorías → `/categorias`. Se busca → `/busco`. Iniciar Sesión → `/login`. Footer CTA: "Crear Cuenta" → `/register`.

#### 4. Click each item and verify navigation

```
playwright-cli click [inicio-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/`. Menu closes.

```
playwright-cli click [hamburger-button]
playwright-cli click [productos-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar`. Menu closes.

```
playwright-cli click [hamburger-button]
playwright-cli click [categorias-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/categorias`. Menu closes.

```
playwright-cli click [hamburger-button]
playwright-cli click [se-busca-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/busco`. Menu closes.

```
playwright-cli click [hamburger-button]
playwright-cli click [iniciar-sesion-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/login`. Menu closes.

#### 5. Reopen menu and close with close button

```
playwright-cli navigate http://localhost:3000
playwright-cli click [hamburger-button]
playwright-cli snapshot
playwright-cli click [close-menu-button]
playwright-cli snapshot
```

**Expected:** Menu opens. Clicking close button closes menu.

---

### Test D: Mobile Menu (authenticated)

#### 1. Resize to mobile and load logged-in state

```
playwright-cli resize 375 812
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Mobile layout with logged-in user.

#### 2. Open hamburger menu

```
playwright-cli click [hamburger-button]
playwright-cli snapshot
```

**Expected:** Mobile menu opens.

#### 3. Verify authenticated menu items

```
playwright-cli assert [inicio-link] --visible
playwright-cli assert [productos-link] --visible
playwright-cli assert [categorias-link] --visible
playwright-cli assert [se-busca-link] --visible
playwright-cli assert [perfil-link] --visible
playwright-cli assert [mis-publicaciones-link] --visible
playwright-cli assert [mis-solicitudes-link] --visible
playwright-cli assert [mensajes-link] --visible
playwright-cli assert [cerrar-sesion-button] --visible
playwright-cli assert [footer-cta-publicar-gratis] --visible
```

**Expected:** Inicio, Productos, Categorías, Se busca. Perfil → `/profile`. Mis Publicaciones → `/perfil/mis-productos`. Mis Solicitudes → `/perfil/demandas`. Mensajes → `/mensajes`. Cerrar Sesión (button). Footer CTA: "Publicar Gratis" → `/publicar`.

---

### Test E: Mobile Search Overlay

#### 1. On mobile viewport, click search icon

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
playwright-cli click [search-icon]
playwright-cli snapshot
```

**Expected:** Search overlay/input appears (aria-label="Buscar productos" or similar).

#### 2. Type and submit search

```
playwright-cli fill [search-overlay-input] "celular"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar?q=celular`. Search overlay closes.

## Verification Checklist

- [ ] Desktop (1280x720): Logo, SearchBar, "Publicar Gratis", "Ingresar" visible
- [ ] Click logo navigates to `/`
- [ ] Click "Publicar Gratis" navigates to `/publicar` or redirects to `/login`
- [ ] Search bar submits and navigates to `/buscar?q=laptop`
- [ ] Authenticated desktop: avatar dropdown shows Perfil, Mis Publicaciones, Mis Solicitudes, Mensajes, Cerrar Sesión
- [ ] Each dropdown item navigates correctly
- [ ] Mobile (375x812): hamburger menu visible
- [ ] Mobile menu opens with correct items (unauthenticated)
- [ ] Mobile menu items navigate and close menu
- [ ] Close button closes mobile menu
- [ ] Mobile menu (authenticated): Perfil, Mis Publicaciones, Mis Solicitudes, Mensajes, Cerrar Sesión, footer "Publicar Gratis"
- [ ] Mobile search icon opens overlay
- [ ] Search overlay: type "celular", submit → navigates to `/buscar?q=celular`, overlay closes
