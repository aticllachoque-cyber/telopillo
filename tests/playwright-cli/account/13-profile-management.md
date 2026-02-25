# Account Flow 13: Profile Management

## Description

Verifies that a logged-in user can view their profile, edit personal information, upload an avatar, and manage business profile settings.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests, or log in first

## Test Steps

### Test A: View Own Profile

#### 1. Load auth state and navigate to profile

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/profile
playwright-cli snapshot
```

**Expected:** Profile page loads. Avatar, full name, and member-since date are visible. Location and phone if set. "Editar perfil" button. Share profile section. Product listings section ("Mis Publicaciones"). "Crear Publicación" button.

#### 2. Verify share button

```
playwright-cli snapshot
```

**Expected:** Share profile card/button is present. Share functionality can be triggered (actual share dialog may vary by browser).

---

### Test B: Edit Profile

#### 1. Navigate to profile edit

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
```

**Expected:** Edit form loads. Fields: full name (full_name), phone, location (department, city). "Guardar Cambios" and "Cancelar" buttons.

#### 2. Update full name and save

```
playwright-cli fill [full_name] "Updated Name Playwright"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Form submits. Success message "¡Perfil Actualizado!" or redirect to `/profile`. Changes saved.

#### 3. Update location and save

```
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
playwright-cli click [location-department-trigger]
playwright-cli click [location-department-option]
playwright-cli click [location-city-trigger]
playwright-cli click [location-city-option]
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Department and city selected. Form saves. Redirect to profile.

#### 4. Verify changes on profile page

```
playwright-cli navigate http://localhost:3000/profile
playwright-cli snapshot
```

**Expected:** Updated full name and location displayed on profile page.

---

### Test C: Avatar Upload

#### 1. Navigate to profile edit

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
```

**Expected:** "Foto de Perfil" section with avatar upload area. Upload button or clickable zone.

#### 2. Upload test image

Prepare a test image (JPG, under 5MB) at a known path, e.g. `tests/fixtures/avatar-test.jpg`.

```
playwright-cli click [avatar-upload-trigger]
playwright-cli upload [file-input] "tests/fixtures/avatar-test.jpg"
playwright-cli snapshot
```

**Expected:** File selector opens or file is uploaded. Avatar preview updates. No error (e.g. "La imagen debe ser menor a 5MB").

**Note:** If playwright-cli does not support file upload, document as manual step: click avatar area, select image, verify upload.

#### 3. Save and verify on profile

```
playwright-cli click [submit-button]
playwright-cli navigate http://localhost:3000/profile
playwright-cli snapshot
```

**Expected:** New avatar displayed on profile page.

---

### Test D: Business Profile (if applicable)

#### 1. Navigate to profile edit

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/profile/edit
playwright-cli snapshot
```

**Expected:** If user has no business profile: "¿Tienes un negocio?" card with "Crear Perfil de Negocio" button. If user has business profile: "Perfil de Negocio" card with business form.

#### 2a. Create business profile (if none exists)

```
playwright-cli click [create-business-button]
playwright-cli snapshot
```

**Expected:** Business profile created. Form for business name, description, category, etc. appears.

#### 2b. Update business profile (if exists)

```
playwright-cli fill [business_name] "Updated Business CLI"
playwright-cli click [business-save-button]
playwright-cli snapshot
```

**Expected:** Business name updated. Success feedback.

#### 3. Verify on profile page

```
playwright-cli navigate http://localhost:3000/profile
playwright-cli snapshot
```

**Expected:** "Mi Negocio" section shows business name. "Ver mi tienda" or "Editar negocio" links if applicable.

## Profile Edit Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| full_name | text | Yes | Minimum 2 characters |
| phone | tel | No | Optional contact number |
| location_department | select | Yes | Department dropdown |
| location_city | select | Yes | City dropdown (depends on department) |
| business_name | text | No | In business profile section |
| business_category | select | No | In business profile section |

## Verification Checklist

- [ ] Profile page loads at `/profile` when logged in
- [ ] Avatar, full name, and member info displayed
- [ ] Share button/functionality present
- [ ] Product listings section visible
- [ ] Profile edit page loads at `/profile/edit`
- [ ] Full name update saves and reflects on profile
- [ ] Location (department, city) update saves
- [ ] Avatar upload accepts JPG under 5MB
- [ ] New avatar displays on profile after upload
- [ ] Business profile creation works (if no business)
- [ ] Business profile edit works (if business exists)
- [ ] Unauthenticated access redirects to login
