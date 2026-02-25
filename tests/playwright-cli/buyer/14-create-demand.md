# Buyer Flow 14: Create a Demand Post

## Description

Verifies that a logged-in buyer can create a demand post via the DemandPostForm at `/busco/publicar`. Covers full creation, validation errors, and minimal required-field submission.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests

## Test Steps

### Test A: Create Demand Post Successfully

#### 1. Load auth state and navigate to create demand page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

**Expected:** DemandPostForm renders. Fields visible: title, description, category, subcategory (if category has subcategories), location (department, city), price range (price_min, price_max). "Publicar solicitud" submit button.

#### 2. Fill all form fields

```
playwright-cli fill [title] "Busco Samsung Galaxy usado"
playwright-cli fill [description] "Necesito un Samsung Galaxy en buen estado, de preferencia S21 o superior"
playwright-cli click [category-trigger]
playwright-cli click [category-option-Tecnologia]
playwright-cli click [subcategory-trigger]
playwright-cli click [subcategory-option]
playwright-cli click [location-department-trigger]
playwright-cli click [location-department-option-La Paz]
playwright-cli click [location-city-trigger]
playwright-cli click [location-city-option-La Paz]
playwright-cli fill [price_min] "500"
playwright-cli fill [price_max] "2000"
playwright-cli snapshot
```

**Expected:** All fields populated. Category "Electrónica" or "Tecnologia" (electronics). Subcategory selected if available. Location: La Paz department and city. Price range 500–2000.

**Note:** Replace `[category-option-Tecnologia]` and `[subcategory-option]` with actual refs from snapshot. Category ID may be `electronics` (label "Electrónica y Tecnología").

#### 3. Submit form

```
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Redirect to `/busco/[id]` (new demand post detail page). All entered data displays correctly: title, description, category, location, price range.

---

### Test B: Validation Errors

#### 1. Navigate to create demand page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

#### 2. Submit empty form

```
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Required field errors displayed for title, description, category. Error messages in Spanish (e.g., "El título debe tener al menos 5 caracteres", "La descripción debe tener al menos 20 caracteres", "Selecciona una categoría").

#### 3. Fill title over 100 characters

```
playwright-cli fill [title] "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Error message for title exceeding 100 characters (e.g., "El título no puede exceder 100 caracteres").

#### 4. Fill description over 1000 characters

```
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli fill [description] "[paste or generate 1001+ chars]"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Error message for description exceeding 1000 characters (e.g., "La descripción no puede exceder 1000 caracteres").

#### 5. Fill price_min greater than price_max

```
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli fill [title] "Busco celular"
playwright-cli fill [description] "Necesito un celular en buen estado para uso personal"
playwright-cli click [category-trigger]
playwright-cli click [category-option-electronics]
playwright-cli fill [price_min] "2000"
playwright-cli fill [price_max] "500"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Validation error on price_max (e.g., "El precio máximo debe ser mayor o igual al mínimo"). Form does not submit.

---

### Test C: Create Minimal Demand (Only Required Fields)

#### 1. Navigate to create demand page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

#### 2. Fill required fields: title, description, category, location

```
playwright-cli fill [title] "Busco iPhone 13"
playwright-cli fill [description] "Necesito un iPhone 13 en buen estado, preferiblemente 128GB o más"
playwright-cli click [category-trigger]
playwright-cli click [category-option-electronics]
playwright-cli click [location-department-trigger]
playwright-cli click [location-department-option-La Paz]
playwright-cli click [location-city-trigger]
playwright-cli click [location-city-option-La Paz]
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Redirect to `/busco/[id]`. Demand created with title, description, category, and location. No price range, no subcategory.

---

## Form Fields Reference

| Field | Type | Required | Max Length | Notes |
|-------|------|----------|------------|-------|
| title | text | Yes | 100 | Min 5 chars |
| description | textarea | Yes | 1000 | Min 20 chars |
| category | select | Yes | — | From CategoryGrid/Select |
| subcategory | select | No | — | Depends on category |
| location_department | select | Yes | — | Via LocationSelector |
| location_city | select | Yes | — | Via LocationSelector |
| price_min | number | No | — | BOB |
| price_max | number | No | — | Must be >= price_min if both set |

---

## Verification Checklist

- [ ] DemandPostForm renders at `/busco/publicar` when logged in
- [ ] Full demand creation with all fields succeeds and redirects to `/busco/[id]`
- [ ] Entered data displays correctly on demand detail page
- [ ] Empty form submission shows required field errors (title, description, category)
- [ ] Title over 100 chars shows validation error
- [ ] Description over 1000 chars shows validation error
- [ ] price_min > price_max shows validation error
- [ ] Minimal demand (title, description, category, location) submits successfully
- [ ] Unauthenticated access redirects to login
