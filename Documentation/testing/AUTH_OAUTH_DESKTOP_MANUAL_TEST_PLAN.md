# Auth OAuth Desktop Manual Test Plan

**Scope:** Local desktop manual validation for auth flows, with emphasis on Google OAuth.  
**Goal:** Establish a stable desktop baseline before testing mobile, embedded browsers, or production-only callback issues.  
**Status:** Ready for manual execution.

---

## Environment

- App URL: `http://localhost:3000`
- Supabase: local
- Primary browser: Chrome
- Secondary browser: Firefox or Safari if available
- Google account: existing test account with OAuth access

## Preconditions

- `npx supabase start` is running
- `npm run dev` is running
- Google OAuth is already configured and working locally
- Test account credentials are available
- Browser console is open during test execution

## Evidence to Capture

For any failure, capture:

- starting route
- ending route
- browser and mode (`normal` or `incognito`)
- account used
- visible error text
- screenshot
- whether header/avatar shows authenticated state
- whether a user record or last sign-in changed in Supabase Auth

Use this template:

```text
Case ID:
Browser:
Mode:
Start URL:
End URL:
Account:
Expected:
Actual:
Visible error:
Notes:
```

---

## Test Data

- Existing email/password user: `dev@telopillo.test` / `DevTest123`
- Existing Google account: reuse the same Google test account for all OAuth cases
- Existing authenticated session in Google: required for some retry and session-state cases

---

## Case Matrix

| ID | Area | Browser Mode | Start Route | Account State | Expected |
|---|---|---|---|---|---|
| D-01 | Google login | Incognito | `/login` | No app session | Login succeeds, redirects home |
| D-02 | Google register | Incognito | `/register` | No app session | OAuth succeeds, session active |
| D-03 | Google login retry | Incognito | `/login` | No app session | Back/retry does not leave broken state |
| D-04 | Google login | Normal | `/login` | Existing Google session | Login succeeds without auth loop |
| D-05 | Protected redirect + OAuth | Incognito | `/profile` | No app session | Redirect to login, OAuth returns to app authenticated |
| D-06 | Auth page while logged in | Normal | `/login` and `/register` | App session active | Auth pages redirect away or remain inaccessible |
| D-07 | Logout then Google login | Normal | `/` | App session active, then logged out | Re-login succeeds cleanly |
| D-08 | Email/password control | Incognito | `/login` | Existing user | Standard login still works |
| D-09 | Existing user path | Normal | `/login` | Prior user already exists | OAuth does not strand user between states |
| D-10 | Multi-tab behavior | Normal | `/login` in two tabs | Shared browser session | OAuth in one tab does not corrupt the other |

---

## Detailed Cases

### D-01 Google login from `/login` in incognito

**Steps**
1. Open an incognito window.
2. Go to `http://localhost:3000/login`.
3. Click `Continuar con Google`.
4. Complete Google authentication.
5. Wait for return to the app.

**Expected**
- OAuth redirects to Google and back without visible error.
- Final URL is home or the intended post-auth route.
- Header reflects authenticated state.
- Refreshing the page preserves session.

### D-02 Google register from `/register` in incognito

**Steps**
1. Open a fresh incognito window.
2. Go to `http://localhost:3000/register`.
3. Click `Continuar con Google`.
4. Complete Google authentication.

**Expected**
- Flow completes without loop or blank state.
- User lands authenticated.
- No duplicate or contradictory onboarding/auth states appear.

### D-03 Back/retry during OAuth

**Steps**
1. Open incognito.
2. Go to `/login`.
3. Click `Continuar con Google`.
4. Before completing auth, use browser back.
5. Trigger `Continuar con Google` again.
6. Complete auth.

**Expected**
- App does not get stuck in a partial auth state.
- Second attempt succeeds.
- No stale error banners remain.

### D-04 Google login with existing Google browser session

**Steps**
1. In a normal browser profile, ensure you are already signed into Google.
2. Go to `/login`.
3. Trigger Google OAuth.

**Expected**
- Flow completes quickly.
- No redirect loop between app, Supabase, and Google.
- Session appears in-app after return.

### D-05 Protected route redirect followed by OAuth

**Steps**
1. Open incognito.
2. Navigate directly to `/profile`.
3. Confirm redirect to `/login`.
4. Use Google OAuth.

**Expected**
- Unauthenticated access redirects correctly.
- OAuth succeeds from redirected login page.
- User ends in a valid authenticated app state.

### D-06 Auth pages while already authenticated

**Steps**
1. Log in successfully.
2. Visit `/login`.
3. Visit `/register`.

**Expected**
- Authenticated user is redirected away or prevented from re-entering auth flows.
- No duplicate session or broken navigation state appears.

### D-07 Logout then re-login with Google

**Steps**
1. Start logged in.
2. Log out from the app.
3. Confirm header returns to logged-out state.
4. Start Google login again from `/login`.

**Expected**
- Logout clears app session.
- Re-login works immediately.
- No stale post-logout redirect remains.

### D-08 Email/password control test

**Steps**
1. Open incognito.
2. Go to `/login`.
3. Log in with `dev@telopillo.test` / `DevTest123`.

**Expected**
- Standard auth still works.
- This serves as control in case OAuth-specific cases fail.

### D-09 Existing-user OAuth behavior

**Steps**
1. Use a normal profile where the app has been used before.
2. Start Google OAuth with an account already seen by the app.
3. Complete login.

**Expected**
- User is not stranded between registration and login states.
- App lands in a single coherent authenticated state.

### D-10 Multi-tab behavior

**Steps**
1. Open `/login` in two tabs.
2. Start Google OAuth in one tab and complete it.
3. Return to the second tab and refresh.

**Expected**
- Second tab converges to the authenticated state cleanly.
- No broken callback or stale anonymous state remains.

---

## Regression Checks After Each Successful OAuth Case

- Visit `/profile`
- Return to `/`
- Refresh the page
- Open a second tab
- Confirm authenticated header state remains correct
- Confirm no unexpected welcome/onboarding modal reappears repeatedly

---

## Failure Classification

Classify each failure into one of these buckets:

- `redirect_loop`
- `callback_error`
- `session_not_persisted`
- `auth_ui_state_incorrect`
- `wrong_final_route`
- `existing_user_conflict`
- `logout_relogin_regression`
- `multi_tab_state_regression`

---

## Exit Criteria

Desktop baseline is considered stable when:

- D-01 through D-08 pass
- no callback errors appear in browser or server logs
- authenticated state persists across refresh
- logout and re-login are clean

After that, move to:

1. mobile browser
2. embedded browser (`Gmail`, `WhatsApp`)
3. staging or production validation
