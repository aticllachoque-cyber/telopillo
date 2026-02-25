# Visitor Flow 08: Demand Post Detail

## Description

Verifies that an unauthenticated visitor can view a demand post detail page, see offers, and that the offer form is not shown (or redirects to login).

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- At least one demand post in the database
- No authentication required

## Test Steps

### 1. Navigate to demands and click a demand

```
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
playwright-cli click [demand-card-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/busco/[id]`. DemandPostDetail page loads.

### 2. Verify DemandPostDetail content

```
playwright-cli assert [demand-title] --visible
playwright-cli assert [demand-description] --visible
```

**Expected:** Title, description, category badge, location (city, department), budget range (if set) displayed.

### 3. Verify expiration info

```
playwright-cli snapshot
```

**Expected:** Expiration date or "X días restantes" shown for active demands. Status badge (Activa, Encontrado, Expirada) visible.

### 4. Verify offers list section

```
playwright-cli assert [ofertas-heading] --visible
```

**Expected:** "Ofertas (N)" section. If offers exist, offer cards with product title, seller, price. If no offers, "Aún no hay ofertas" message.

### 5. Verify back link

```
playwright-cli click [volver-a-solicitudes]
playwright-cli snapshot
```

**Expected:** "Volver a solicitudes" link navigates to `/busco`.

### 6. As unauthenticated user: verify offer form behavior

```
playwright-cli navigate http://localhost:3000/busco/[id]
playwright-cli snapshot
```

**Expected:** "Ofrecer mi producto" button is NOT shown. Instead, CTA card: "¿Tienes lo que esta persona busca?" with "Inicia sesión para ofrecer" link to `/login?redirect=/busco/[id]`.

### 7. Verify share functionality (if available)

```
playwright-cli snapshot
```

**Expected:** Share button or link present. Clicking copies URL or opens share dialog.

### 8. Verify buyer contact (WhatsApp)

```
playwright-cli snapshot
```

**Expected:** If poster has phone, "Contactar por WhatsApp" button visible for non-owners. Links to WhatsApp with pre-filled message.

## Verification Checklist

- [ ] DemandPostDetail renders title, description, category, location, budget range
- [ ] Expiration info displayed
- [ ] Offers list section visible
- [ ] Back link to /busco works
- [ ] Unauthenticated: offer form not shown; login CTA displayed
- [ ] Share functionality works if implemented
- [ ] WhatsApp contact button visible when poster has phone
