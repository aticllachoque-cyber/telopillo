# Seller Flow 19: Submit an Offer on a Demand Post

## Description

Verifies that a logged-in seller can submit an offer on a demand post from the demand detail page. Covers offer submission with product selection, behavior without product, and restriction when offering on own demand.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests
- User (seller) must have at least one active product
- At least one demand post from another user exists (browse `/busco` to find one)

## Test Steps

### Test A: Submit Offer from Demand Detail

#### 1. Load auth state and navigate to demands browse page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
```

**Expected:** Demand cards listed. Can filter/search. Click a demand to view detail.

#### 2. Click a demand card (from another user)

```
playwright-cli click [demand-card-link]
playwright-cli snapshot
```

**Expected:** Navigate to `/busco/[id]`. Demand detail shows title, description, category, location, price range. "Ofrecer mi producto" button visible (authenticated, not owner).

#### 3. Open offer modal

```
playwright-cli click [button-Ofrecer mi producto]
playwright-cli snapshot
```

**Expected:** OfferProductModal opens. Title: "Ofrecer mi producto". Product grid with seller's active products. Optional message textarea. "Enviar oferta" and "Cancelar" buttons.

#### 4. Select a product and fill message

```
playwright-cli click [product-radio-option]
playwright-cli fill [offer-message] "Tengo este producto disponible en excelente estado"
playwright-cli snapshot
```

**Expected:** Product card selected (radio/checkmark). Message filled. "Enviar oferta" enabled.

#### 5. Submit offer

```
playwright-cli click [button-Enviar oferta]
playwright-cli snapshot
```

**Expected:** Modal closes. Offer appears in the offers list on the demand detail page. Success feedback if shown.

---

### Test B: Submit Offer Without Product

#### 1. Navigate to a demand detail (from another user)

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco
playwright-cli click [demand-card-link]
playwright-cli click [button-Ofrecer mi producto]
playwright-cli snapshot
```

#### 2. Do not select a product; try to submit

```
playwright-cli snapshot
```

**Expected:** "Enviar oferta" button is disabled when no product is selected. Cannot submit without selecting a product. Optional: verify tooltip or message explaining product is required.

---

### Test C: Cannot Offer on Own Demand

#### 1. Create a demand post as the logged-in user (or use existing own demand)

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli fill [title] "Mi propia solicitud"
playwright-cli fill [description] "Esta es una solicitud de prueba creada por mí para verificar que no puedo ofrecer en mi propia demanda."
playwright-cli click [category-trigger]
playwright-cli click [category-option-electronics]
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Redirect to `/busco/[id]`. Note the demand ID.

#### 2. On own demand detail, verify offer form is hidden/disabled

```
playwright-cli snapshot
```

**Expected:** "Ofrecer mi producto" button is NOT visible. Owner sees "Marcar como Encontrado" instead. Offer form/section hidden for own demands. No way to submit an offer on own demand.

---

## Offer Flow Reference

| Element | Description |
|---------|-------------|
| OfferProductModal | Dialog opened by "Ofrecer mi producto" |
| Product selection | Required; radio group of seller's active products |
| Message | Optional textarea, max 500 chars |
| Submit | "Enviar oferta" – disabled until product selected |
| Own demand | Offer button hidden; owner cannot offer on own demand |

---

## Verification Checklist

- [ ] "Ofrecer mi producto" button visible on demand detail when authenticated and not owner
- [ ] Offer modal opens with product grid and message field
- [ ] Product selection is required; submit disabled without selection
- [ ] Offer submits successfully with product and optional message
- [ ] Offer appears in offers list after submission
- [ ] Offer form/button hidden on own demand
- [ ] Unauthenticated users see "Inicia sesión para ofrecer" CTA
- [ ] Duplicate offer (same product, same demand) shows error if applicable
