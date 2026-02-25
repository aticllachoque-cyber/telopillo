# Milestone 7: Trust & Verification

**Priority:** MEDIUM (trust layer for marketplace quality)
**Duration:** TBD (estimated 3-5 days)
**Dependencies:** M1 (Authentication), M4.5 (Account Types & KYC), M6 (Favorites & Ratings)
**Status:** Not Started
**Planned:** Post-launch (after initial 1,000 users)

---

## Overview

Add voluntary identity verification features to the user profile, allowing users to earn trust badges that are visible to buyers. This builds on the existing `verification_level` (0-3) and `is_verified` fields in the `profiles` table.

> **Key principle:** All verification is voluntary. No features are blocked for unverified users. Badges serve as trust signals to help buyers make decisions.

---

## Goals

1. Users can voluntarily verify their email from their profile page
2. Verified email earns a visible "Email Verificado" trust badge
3. Badge appears where buyers make decisions (product cards, seller cards, seller profile)
4. Foundation for future verification methods (WhatsApp, SMS, document KYC)
5. Combined trust score integrates with ratings from M6

---

## PM Analysis (Feb 2026)

### Why deferred from MVP

- Email verification does not increase signups or activation
- Expected voluntary adoption: 5-15% in Bolivian market
- WhatsApp-first culture makes email secondary
- Shared/family email accounts reduce motivation
- Trust at MVP comes from phone (verification_level 1) and future ratings (M6)
- Engineering effort better spent on core flows pre-launch

### When to implement

- After launch, once there are real users and data on trust/fraud patterns
- Ideally after M6 (Ratings) so email verification can be combined into a unified trust score
- If fake accounts or spam become a problem before M6, can be fast-tracked

---

## Technical Design

### Database

- [ ] Migration: Update `handle_new_user()` trigger to set `is_verified = false` (currently sets true due to auto-confirm)
- [ ] Migration: Create trigger on `auth.users` to sync `is_verified = true` when `email_confirmed_at` changes from NULL to a value
- [ ] Consider: Add `email_verified_at` timestamp to `profiles` for audit trail

### Supabase Config

- [ ] Set `enable_confirmations = true` in `config.toml` (allows resend flow)
- [ ] Verify that login still works without email confirmation (auto-confirm on signup, voluntary confirm later)
- [ ] Test rate limits for verification emails (`email_sent` in config)

### Frontend - Profile Page

- [ ] Add "Email Verification" card to `/profile` page (between header and Share Profile)
- [ ] Card shows when `is_verified = false`: Mail icon, explanation text, "Enviar email de verificacion" button
- [ ] Button calls `supabase.auth.resend({ type: 'signup', email })`
- [ ] Loading state while sending, success toast after ("Te enviamos un email de verificacion")
- [ ] Card hidden when `is_verified = true` (badge in header is sufficient)
- [ ] Rate limit: disable button for 60 seconds after sending

### Frontend - Badge Visibility

- [ ] Show "Email Verificado" badge on product cards (where buyers decide)
- [ ] Show badge on seller cards in search results
- [ ] Show badge on seller profile header (public view at `/vendedor/[id]`)
- [ ] Integrate with existing `verification_level` badges ("Vendedor con Telefono", etc.)

### Auth Callback

- [ ] Update `/auth/callback` to detect email confirmation (vs OAuth)
- [ ] Redirect to `/profile` with success query param on email confirmation
- [ ] Profile page shows success toast when redirected from confirmation

### Email Template

- [ ] Customize verification email template (Supabase templates)
- [ ] Brand with Telopillo.bo logo and colors
- [ ] Spanish language copy
- [ ] Clear CTA button: "Verificar mi Email"

---

## User Flow

```
1. User registers (frictionless, no email required)
2. User visits /profile
3. Sees card: "Verifica tu email para ganar confianza"
4. Clicks "Enviar email de verificacion"
5. Receives email with verification link
6. Clicks link -> /auth/callback -> redirects to /profile
7. "Verificado" badge appears next to name
8. Badge visible to buyers on product cards and seller profile
```

---

## Future Scope (not in this milestone)

- **WhatsApp verification**: Stronger trust signal for Bolivian market
- **SMS OTP verification**: Phone number verification via code
- **Document KYC**: CI/NIT upload and manual review
- **Combined trust score**: Unified "Confiable" badge combining email + phone + ratings
- **Verification levels**: Progressive trust (Level 1: email, Level 2: phone, Level 3: document)

---

## Success Criteria

- Users can verify email from profile page
- Verification email is received (test via Mailpit locally)
- Clicking verification link confirms email and updates badge
- Badge appears on product cards and seller profiles
- No features are blocked for unverified users
- Rate limiting prevents email spam

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Low adoption (5-15%) | High | Badge is a bonus, not required. Revisit if needed. |
| Email deliverability in Bolivia | Medium | Test with common providers (Gmail, Hotmail). Add SPF/DKIM. |
| Confusion with verification_level | Medium | Clear UI hierarchy. Single trust section in profile. |
| Supabase config mismatch | Medium | Thorough testing of enable_confirmations + auto-login. |

---

## Notes

- `profiles.is_verified` already exists (boolean, default false)
- `profiles.verification_level` already exists (0-3, phone-based)
- `handle_new_user()` trigger in `20260215140000_refactor_business_addon.sql` sets `is_verified` from `email_confirmed_at`
- With `enable_confirmations = false` (current), `email_confirmed_at` is auto-set, making `is_verified` always true
- Local Supabase has Mailpit at `http://127.0.0.1:54324` for email testing
