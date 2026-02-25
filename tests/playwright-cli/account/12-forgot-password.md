# Account Flow 12: Forgot Password

## Description

Verifies that a user can request a password reset email from the forgot-password page. Covers successful request, invalid email handling, and navigation back to login. The full reset flow (clicking the email link) requires external email and is not fully testable via CLI.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- Optional: Registered user email for Test A (or use any email; Supabase may show success for security)

## Test Steps

### Test A: Request Password Reset

#### 1. Navigate to forgot-password page

```
playwright-cli navigate http://localhost:3000/forgot-password
playwright-cli snapshot
```

**Expected:** Page loads. Heading "¿Olvidaste tu Contraseña?" is visible. Email input field is present.

#### 2. Fill email and submit

```
playwright-cli fill [email] "{registered-user-email}"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** Form submits. Success message displayed: "Email Enviado" and "Revisa tu email para restablecer tu contraseña." Link "Volver a Iniciar Sesión" is visible.

#### 3. Navigate back to login

```
playwright-cli click [back-to-login-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/login`. Login form is visible.

---

### Test B: Invalid Email

#### 1. Navigate to forgot-password page

```
playwright-cli navigate http://localhost:3000/forgot-password
playwright-cli snapshot
```

#### 2. Fill non-registered or invalid email

```
playwright-cli fill [email] "nonexistent@example.com"
playwright-cli click [submit-button]
playwright-cli snapshot
```

**Expected:** For security, Supabase typically shows the same success message for both registered and non-registered emails. If validation runs client-side, invalid format (e.g. "not-email") may show "Email inválido".

---

### Test C: Reset Password Page (Token-Based)

The reset-password page at `/reset-password` requires a valid session/token from the email link. Direct navigation without the token will show the form but submission may fail.

#### 1. Navigate to reset-password (without token)

```
playwright-cli navigate http://localhost:3000/reset-password
playwright-cli snapshot
```

**Expected:** Page may load with "Nueva Contraseña" heading. Form fields: "Nueva Contraseña" (password), "Confirmar Contraseña" (confirmPassword). Submit button "Actualizar Contraseña". Link "Volver a Iniciar Sesión".

**Note:** Full flow requires clicking the reset link in the email. That step cannot be automated via CLI without email access. Document this as a manual verification step.

## Verification Checklist

- [ ] Forgot-password page loads at `/forgot-password`
- [ ] Email input field is present
- [ ] Submit button "Enviar Link de Restablecimiento" works
- [ ] Success state shows "Email Enviado" and instructions
- [ ] "Volver a Iniciar Sesión" link navigates to `/login`
- [ ] Invalid email format shows validation error (if client-side)
- [ ] Reset-password page has password and confirmPassword fields
- [ ] Full reset flow (email link) documented as manual test
