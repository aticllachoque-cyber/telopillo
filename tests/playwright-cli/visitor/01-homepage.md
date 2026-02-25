# Visitor Flow 01: Home Page

## Description

Verifies that an unauthenticated visitor can load the home page, interact with the hero search, browse categories, view trust stats and features, and navigate to key sections.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- No authentication required (visitor flow)

## Test Steps

### 1. Open the home page

```
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Page loads successfully. Hero section is visible.

### 2. Verify hero section elements

```
playwright-cli assert [h1] --text "Lo que buscás"
playwright-cli assert [trust-badge] --text "Marketplace 100% boliviano"
```

**Expected:** H1 heading "Lo que buscás, ¡telopillo!" is present. Trust badge with "Marketplace 100% boliviano" is visible. Search form with input `name="q"` and submit button exists.

### 3. Test hero search

```
playwright-cli fill [search-input] "celular"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Form submits and navigates to `/buscar?q=celular`. Search results page loads.

### 4. Return to home and verify category grid

```
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Category grid displays 8 category cards plus "Ver todas" link. Categories: Electronics, Vehicles, Home, Fashion, Sports, Construction, Baby, Toys.

### 5. Click a category

```
playwright-cli click [category-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar?category={categoryId}` (e.g. `/buscar?category=electronics`). Search page shows filtered results.

### 6. Return and verify trust stats section

```
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Trust section shows: "9 Departamentos", "0% Comisiones", "Vendedores verificados", "24/7 Disponible siempre".

### 7. Verify features section

```
playwright-cli assert [features-heading] --text "¿Por qué Telopillo.bo?"
```

**Expected:** Four feature cards: "Publicá Gratis", "Búsqueda Inteligente", "Chat Directo", "Hecho para Celular".

### 8. Verify CTA strip for unauthenticated users

```
playwright-cli snapshot
```

**Expected:** CTA strip (register/login prompt) is visible for unauthenticated visitors.

### 9. Verify "Se busca" link

```
playwright-cli click [link-to-busco]
playwright-cli snapshot
```

**Expected:** Navigates to `/busco`. Demand posts browse page loads.

### 10. Verify footer links

```
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Footer contains links: Acerca de, Contacto, Ayuda, Seguridad, Términos, Privacidad, Cookies. Social links (Facebook, Instagram, Twitter) are present.

## Verification Checklist

- [ ] Hero section loads with h1, trust badge, and search form
- [ ] Hero search submits and navigates to `/buscar?q=celular`
- [ ] Category grid shows 8 categories + "Ver todas" link
- [ ] Clicking a category navigates to `/buscar?category=X`
- [ ] Trust stats section displays 9 departamentos, 0% comisiones
- [ ] Features section shows 4 cards
- [ ] CTA strip visible for unauthenticated users
- [ ] "Se busca" / demand link navigates to `/busco`
- [ ] Footer links exist and are accessible
