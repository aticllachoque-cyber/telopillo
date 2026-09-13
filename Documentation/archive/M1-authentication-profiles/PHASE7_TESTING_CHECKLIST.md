# Phase 7: Testing & Polish - Checklist

**Last Updated:** February 13, 2026  
**Status:** In Progress

---

## ✅ Code Quality Checks (COMPLETE)

### ESLint
- ✅ No errors
- ✅ No warnings
- ✅ All unused imports removed
- ✅ All unused variables removed

### TypeScript
- ✅ No type errors
- ✅ Strict mode enabled
- ✅ All implicit any types fixed

### Prettier
- ✅ Code formatted consistently
- ✅ Pre-commit hooks working

---

## 🧪 Manual Testing

### Authentication Flows

#### Email Registration
- [ ] Navigate to `/register`
- [ ] Fill form with valid data
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Verify redirect to login or home

#### Email Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] Verify redirect to home or intended page
- [ ] Verify UserMenu shows user info

#### OAuth - Google
- [ ] Click "Continuar con Google" button
- [ ] Authorize with Google account
- [ ] Verify redirect back to app
- [ ] Verify profile auto-created
- [ ] Verify UserMenu shows user info

#### OAuth - Facebook
- [ ] Click "Continuar con Facebook" button
- [ ] Authorize with Facebook account
- [ ] Verify redirect back to app
- [ ] Verify profile auto-created
- [ ] Verify UserMenu shows user info

#### Forgot Password
- [ ] Navigate to `/forgot-password`
- [ ] Enter registered email
- [ ] Submit form
- [ ] Verify success message
- [ ] Check email for reset link
- [ ] Click reset link
- [ ] Verify redirect to `/reset-password`

#### Reset Password
- [ ] From reset link, land on `/reset-password`
- [ ] Enter new password (twice)
- [ ] Submit form
- [ ] Verify success message
- [ ] Try logging in with new password
- [ ] Verify login works

#### Logout
- [ ] Click UserMenu dropdown
- [ ] Click "Cerrar Sesión"
- [ ] Verify redirect to `/login`
- [ ] Verify session cleared
- [ ] Try accessing `/profile/edit` (should redirect to login)

---

### Profile Management

#### View Profile
- [ ] Login as user
- [ ] Navigate to `/profile`
- [ ] Verify profile info displays:
  - Avatar or initials
  - Full name
  - Email
  - Member since date
  - Location (if set)
  - Phone (if set)
  - Rating (placeholder)
- [ ] Verify "Editar" button present

#### Edit Profile
- [ ] From profile, click "Editar"
- [ ] Verify redirect to `/profile/edit`
- [ ] Verify form pre-filled with current data
- [ ] Update full name
- [ ] Update phone
- [ ] Select department
- [ ] Select city (should update based on department)
- [ ] Click "Guardar Cambios"
- [ ] Verify success message or redirect
- [ ] Navigate back to `/profile`
- [ ] Verify changes saved

#### Avatar Upload
- [ ] Navigate to `/profile/edit`
- [ ] Click "Cambiar Foto" button
- [ ] Select valid image (JPG, PNG, WebP < 5MB)
- [ ] Verify loading spinner appears
- [ ] Verify preview updates
- [ ] Verify "Eliminar" button appears
- [ ] Navigate to `/profile`
- [ ] Verify avatar displays

#### Avatar Remove
- [ ] Navigate to `/profile/edit` (with avatar uploaded)
- [ ] Click "Eliminar" button
- [ ] Verify loading state
- [ ] Verify avatar removed (shows initials)
- [ ] Navigate to `/profile`
- [ ] Verify initials show instead of avatar

#### Avatar Validation
- [ ] Try uploading non-image file
- [ ] Verify error message: "Por favor selecciona una imagen"
- [ ] Try uploading image > 5MB
- [ ] Verify error message: "La imagen debe ser menor a 5MB"

---

### Protected Routes

#### Unauthenticated Access
- [ ] Logout completely
- [ ] Try accessing `/profile/edit` directly
- [ ] Verify redirect to `/login?redirect=/profile/edit`
- [ ] Login successfully
- [ ] Verify redirect back to `/profile/edit`

#### Authenticated Redirect
- [ ] Login as user
- [ ] Try accessing `/login` directly
- [ ] Verify redirect to home `/`
- [ ] Try accessing `/register` directly
- [ ] Verify redirect to home `/`

#### UserMenu
- [ ] Verify UserMenu shows in header when logged in
- [ ] Click UserMenu avatar
- [ ] Verify dropdown opens with:
  - User name
  - Email
  - "Mi Perfil" link
  - "Editar Perfil" link
  - "Cerrar Sesión" button
- [ ] Click "Mi Perfil" → verify redirect to `/profile`
- [ ] Click "Editar Perfil" → verify redirect to `/profile/edit`

---

### Security Testing

#### RLS Policies
- [ ] Create two test users (user1, user2)
- [ ] Login as user1
- [ ] Try to access user2's profile edit page
- [ ] Verify cannot edit (should see own profile or error)
- [ ] Verify can view user2's public profile

#### Session Persistence
- [ ] Login as user
- [ ] Refresh page
- [ ] Verify still logged in
- [ ] Close browser
- [ ] Reopen and navigate to site
- [ ] Verify still logged in (if "remember me" or session valid)

#### Token Security
- [ ] Open DevTools → Application → Cookies
- [ ] Verify auth tokens are httpOnly
- [ ] Verify no sensitive data in localStorage
- [ ] Verify no passwords in console logs

---

### UI/UX Testing

#### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all pages responsive
- [ ] Verify forms usable on mobile
- [ ] Verify dropdown menus work on mobile

#### Loading States
- [ ] Verify spinner shows during:
  - Login
  - Registration
  - Profile load
  - Profile save
  - Avatar upload
  - OAuth redirect

#### Error Messages
- [ ] Test invalid email format
- [ ] Test password too short
- [ ] Test mismatched passwords
- [ ] Test wrong login credentials
- [ ] Verify all errors display clearly
- [ ] Verify errors are dismissible or clear on retry

#### Success Messages
- [ ] Verify success message after:
  - Registration
  - Password reset email sent
  - Password reset complete
  - Profile updated
  - Avatar uploaded

#### Form Validation
- [ ] Test all required fields
- [ ] Test email format validation
- [ ] Test password strength requirements
- [ ] Test location selector (department → city)
- [ ] Verify validation messages clear and helpful

---

### Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all forms
- [ ] Verify focus visible
- [ ] Verify can submit with Enter
- [ ] Verify can escape dropdowns with Esc
- [ ] Verify skip link works

#### Screen Reader
- [ ] Test with screen reader (if available)
- [ ] Verify form labels read correctly
- [ ] Verify error messages announced
- [ ] Verify success messages announced
- [ ] Verify ARIA attributes present

#### Color Contrast
- [ ] Verify text readable on all backgrounds
- [ ] Verify error messages have sufficient contrast
- [ ] Verify disabled states clear

---

### Browser Testing

#### Chrome (Latest)
- [ ] All authentication flows
- [ ] All profile features
- [ ] Avatar upload
- [ ] Responsive design

#### Firefox (Latest)
- [ ] All authentication flows
- [ ] All profile features
- [ ] Avatar upload
- [ ] Responsive design

#### Safari (Latest)
- [ ] All authentication flows
- [ ] All profile features
- [ ] Avatar upload
- [ ] Responsive design

#### Mobile Chrome
- [ ] Login/Register
- [ ] Profile view/edit
- [ ] Avatar upload
- [ ] UserMenu dropdown

#### Mobile Safari
- [ ] Login/Register
- [ ] Profile view/edit
- [ ] Avatar upload
- [ ] UserMenu dropdown

---

## 🐛 Known Issues

### Warnings (Non-blocking)
1. **Hydration Warning (UserMenu)**
   - **Severity:** Low
   - **Impact:** Console warning only, no functional impact
   - **Reason:** UserMenu renders differently on server (no user) vs client (with user)
   - **Status:** Expected behavior for auth components
   - **Action:** Document, no fix needed for MVP

2. **Middleware Deprecation Warning**
   - **Severity:** Low
   - **Impact:** Console warning only
   - **Reason:** Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`
   - **Status:** Documented, will address in future refactor
   - **Action:** Works correctly, defer to post-MVP

### Bugs Found
_Document any bugs found during testing here_

---

## 📊 Performance Metrics

### Lighthouse Audit (Target: >90)
- [ ] Performance: ___ / 100
- [ ] Accessibility: ___ / 100
- [ ] Best Practices: ___ / 100
- [ ] SEO: ___ / 100

### Load Times
- [ ] Homepage: ___ ms
- [ ] Login page: ___ ms
- [ ] Profile page: ___ ms
- [ ] Profile edit: ___ ms

---

## ✅ Final Checklist

- [x] Code quality checks passed (ESLint, TypeScript)
- [ ] All manual tests passed
- [ ] All browsers tested
- [ ] Security verified
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Known issues documented
- [ ] README updated
- [ ] Final commit made

---

## 📝 Notes

- Auth bypass is enabled for development (`NEXT_PUBLIC_DISABLE_AUTH=true`)
- Dev user credentials: `dev@telopillo.test` / `DevTest123`
- Test OAuth with real Google/Facebook accounts
- RLS policies tested via Supabase dashboard
- Avatar storage uses `avatars` bucket with public access

---

**Testing Started:** February 13, 2026  
**Testing Completed:** _Pending_  
**Tester:** _Your Name_
