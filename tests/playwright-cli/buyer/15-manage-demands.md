# Buyer Flow 15: Manage My Demands

## Description

Verifies that a logged-in buyer can view, filter, and manage their demand posts at `/perfil/demandas`. Covers tab navigation, marking demands as found, and deleting demands.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests
- User must have at least one demand post (create one via `/busco/publicar` if needed)

## Test Steps

### Test A: View My Demands

#### 1. Load auth state and navigate to demands dashboard

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

**Expected:** Page loads. Tabs visible: "Activas", "Encontradas", "Expiradas". Demand cards display in the active tab ("Activas" by default). "Nueva solicitud" button. "Volver al perfil" link.

#### 2. Click a demand card to view detail

```
playwright-cli click [demand-card-link]
playwright-cli snapshot
```

**Expected:** Navigate to `/busco/[id]`. Demand detail page shows title, description, category, location, price range, offers section.

#### 3. Navigate back to demands list

```
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

**Expected:** Back at demands dashboard. Demand cards visible.

---

### Test B: Switch Between Tabs

#### 1. Navigate to demands dashboard

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

#### 2. Click "Encontradas" tab

```
playwright-cli click [tab-Encontradas]
playwright-cli snapshot
```

**Expected:** Tab switches to "Encontradas". Filtered results show demands with status "found". Empty state if none: "No tienes solicitudes marcadas como encontradas."

#### 3. Click "Expiradas" tab

```
playwright-cli click [tab-Expiradas]
playwright-cli snapshot
```

**Expected:** Tab switches to "Expiradas". Filtered results show expired demands (expires_at < now). Empty state if none: "No tienes solicitudes expiradas."

#### 4. Click "Activas" tab

```
playwright-cli click [tab-Activas]
playwright-cli snapshot
```

**Expected:** Tab switches back to "Activas". Active demands (status active, expires_at > now) displayed.

---

### Test C: Mark Demand as Found

#### 1. Navigate to demands dashboard, ensure "Activas" tab is selected

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

**Expected:** At least one active demand card with "Encontrado" button (or "Marcar como encontrado" aria-label).

#### 2. Click "Encontrado" on an active demand

```
playwright-cli click [button-Encontrado]
playwright-cli snapshot
```

**Expected:** Demand is removed from "Activas" list (moves to "Encontradas"). No confirmation dialog (immediate action).

#### 3. Switch to "Encontradas" tab and verify

```
playwright-cli click [tab-Encontradas]
playwright-cli snapshot
```

**Expected:** The demand that was marked as found now appears in "Encontradas" tab.

---

### Test D: Delete Demand

#### 1. Navigate to demands dashboard

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/demandas
playwright-cli snapshot
```

#### 2. Click delete action on a demand card

```
playwright-cli click [button-Eliminar]
playwright-cli snapshot
```

**Expected:** Confirmation dialog appears. Title: "¿Eliminar esta solicitud?" Description explains action cannot be undone. "Cancelar" and "Eliminar" buttons.

#### 3. Confirm deletion

```
playwright-cli click [dialog-confirm-Eliminar]
playwright-cli snapshot
```

**Expected:** Dialog closes. Demand is removed from the list. Tab counts update if displayed.

---

## Verification Checklist

- [ ] Demands dashboard loads at `/perfil/demandas` when logged in
- [ ] Tabs "Activas", "Encontradas", "Expiradas" are visible and clickable
- [ ] Demand cards display in active tab
- [ ] Clicking demand card navigates to `/busco/[id]`
- [ ] "Encontradas" tab shows only found demands
- [ ] "Expiradas" tab shows only expired demands
- [ ] "Activas" tab shows only active, non-expired demands
- [ ] "Encontrado" button moves demand from Activas to Encontradas
- [ ] Delete action opens confirmation dialog
- [ ] Confirming deletion removes demand from list
- [ ] Unauthenticated access redirects to login
