# PRD - Milestone 1: Authentication & User Profiles

**Version:** 1.0  
**Date:** February 12, 2026  
**Author:** Alcides Cardenas  
**Status:** Ready for Implementation  
**Milestone Duration:** Week 2-3 (10 working days)  
**Priority:** P0 (Critical - Required for all user-facing features)

---

## 1. Executive Summary

This milestone implements the complete authentication and user profile management system for Telopillo.bo. It enables users to register, login (via email or OAuth), and manage their profiles, establishing the foundation for all user-specific features in the marketplace.

**Success means:** Users can securely create accounts, authenticate via multiple methods, and manage their profile information including avatar, location, and contact details.

---

## 2. Problem Statement

### 2.1 Current State
- No user authentication exists
- No user profiles or identity management
- No way to associate products with sellers
- No way to track user reputation
- Cannot implement protected features (chat, favorites, ratings)

### 2.2 Desired State
- Users can register and login securely
- Multiple authentication methods (email, Google, Facebook)
- User profiles with complete information
- Automatic profile creation on registration
- Avatar upload and management
- Email verification for security
- Foundation for reputation system

---

## 3. Goals & Objectives

### 3.1 Primary Goals
1. **Secure Authentication**: Multiple auth methods with industry-standard security
2. **User Profiles**: Complete profile management with avatar upload
3. **Seamless UX**: Smooth registration and login flows
4. **Foundation for Features**: Enable chat, ratings, product ownership

### 3.2 Success Metrics
- [ ] Users can register with email/password
- [ ] Google OAuth login works
- [ ] Facebook OAuth login works
- [ ] Profile auto-created on registration
- [ ] Users can edit profile (name, location, avatar)
- [ ] Avatar upload to Supabase Storage works
- [ ] Protected routes redirect to login
- [ ] Email verification sent and works
- [ ] JWT tokens stored securely (httpOnly cookies)
- [ ] No authentication errors in production

### 3.3 Key Performance Indicators (KPIs)
- Registration completion rate: >80%
- OAuth login success rate: >95%
- Profile completion rate: >60%
- Avatar upload success rate: >90%
- Average time to register: <2 minutes

---

## 4. Scope

### 4.1 In Scope

#### 4.1.1 Authentication Methods

**Email/Password Authentication**
- Registration form with validation
- Login form
- Password requirements (min 8 chars, 1 uppercase, 1 number)
- Email verification flow
- Password reset flow (forgot password)
- Secure password hashing (handled by Supabase)

**Google OAuth**
- "Sign in with Google" button
- OAuth consent flow
- Automatic profile creation
- Email from Google account

**Facebook OAuth**
- "Sign in with Facebook" button
- OAuth consent flow
- Automatic profile creation
- Email from Facebook account

#### 4.1.2 User Profile System

**Profile Data Structure**
```typescript
interface Profile {
  id: string                    // UUID (same as auth.users.id)
  full_name: string             // Required
  avatar_url: string | null     // Optional, URL to Supabase Storage
  phone: string | null          // Optional, for WhatsApp contact
  location_city: string | null  // Required for products
  location_department: string | null  // Required for products
  rating_average: number        // Default 0, calculated from ratings
  rating_count: number          // Default 0, count of ratings received
  is_verified: boolean          // Email verification status
  created_at: timestamp
  updated_at: timestamp
}
```

**Profile Features**
- View public profile (anyone can see)
- Edit own profile (authenticated users only)
- Avatar upload (max 5MB, JPG/PNG/WebP)
- Location selection (department + city)
- Phone number (optional, for WhatsApp)
- Display user's products on profile
- Display user's ratings and reviews
- Verification badge (if email verified)

#### 4.1.3 Database Schema

**profiles table**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location_city TEXT,
  location_department TEXT,
  rating_average NUMERIC(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_location ON profiles(location_department, location_city);
CREATE INDEX idx_profiles_rating ON profiles(rating_average DESC);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles
CREATE POLICY "view_profiles"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger to auto-create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**avatars storage bucket**
```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- RLS policies for avatars bucket
CREATE POLICY "avatar_upload_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_read_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### 4.1.4 Frontend Pages & Components

**Pages**
- `/login` - Login page
- `/register` - Registration page
- `/profile/[id]` - Public profile view
- `/profile/edit` - Edit own profile
- `/auth/callback` - OAuth callback handler
- `/auth/verify-email` - Email verification page

**Components**
- `LoginForm` - Email/password login
- `RegisterForm` - Registration with validation
- `OAuthButtons` - Google/Facebook login buttons
- `ProfileView` - Public profile display
- `ProfileEditForm` - Edit profile form
- `AvatarUpload` - Avatar upload widget
- `LocationSelector` - Department + City dropdowns
- `AuthGuard` - Protected route wrapper
- `UserMenu` - Header user dropdown

#### 4.1.5 Authentication Flow

**Registration Flow**
```
1. User visits /register
2. Fills form (email, password, full name)
3. Submits form
4. Supabase creates auth.users record
5. Database trigger creates profiles record
6. Verification email sent
7. User redirected to /profile/edit (complete profile)
8. User fills location, avatar (optional)
9. Redirected to home page
```

**OAuth Flow**
```
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. User approves
4. Redirected to /auth/callback
5. Supabase exchanges code for tokens
6. Database trigger creates profiles record
7. User redirected to /profile/edit (if first time)
8. User fills location (required for products)
9. Redirected to home page
```

**Login Flow**
```
1. User visits /login
2. Enters email + password OR clicks OAuth button
3. Supabase validates credentials
4. JWT tokens stored in httpOnly cookies
5. User redirected to intended page or home
```

#### 4.1.6 Security Requirements

**Password Security**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (optional but recommended)
- Hashed with bcrypt (handled by Supabase)

**Session Management**
- JWT access token: 1 hour expiration
- JWT refresh token: 30 days expiration
- Tokens stored in httpOnly cookies (not localStorage)
- Auto-refresh on expiration
- Logout clears all tokens

**Data Protection**
- Row Level Security (RLS) on all tables
- Users can only edit their own profile
- Email addresses not publicly visible
- Phone numbers not publicly visible (only for contact)
- Avatar URLs are public (CDN)

**Email Verification**
- Verification email sent on registration
- Link expires in 24 hours
- Can resend verification email
- Unverified users can still use app but see banner

### 4.2 Out of Scope (Future Milestones)

- Phone number verification (SMS) - Phase 2
- Two-factor authentication (2FA) - Phase 2
- Social login (Twitter, Apple) - Phase 2
- Account deletion - Phase 2
- Profile privacy settings - Phase 2
- Block/report users - M9 (Content Moderation)
- User reputation badges - M6 (Ratings)

---

## 5. User Stories

### 5.1 Registration

**US-1.1: Register with Email**
```
As a new user
I want to register with my email and password
So that I can create an account and start using the platform

Acceptance Criteria:
- Form has fields: email, password, confirm password, full name
- Email validation (valid format)
- Password validation (min 8 chars, 1 uppercase, 1 number)
- Passwords must match
- Shows error messages for invalid inputs
- Shows loading state during submission
- Verification email sent after registration
- Redirects to /profile/edit after successful registration
- Profile auto-created in database
```

**US-1.2: Register with Google**
```
As a new user
I want to register with my Google account
So that I can quickly create an account without a password

Acceptance Criteria:
- "Sign in with Google" button visible
- Redirects to Google consent screen
- Returns to app after approval
- Profile auto-created with Google name and email
- Redirects to /profile/edit to complete location
- No email verification needed (Google email is trusted)
```

**US-1.3: Register with Facebook**
```
As a new user
I want to register with my Facebook account
So that I can quickly create an account without a password

Acceptance Criteria:
- "Sign in with Facebook" button visible
- Redirects to Facebook consent screen
- Returns to app after approval
- Profile auto-created with Facebook name and email
- Redirects to /profile/edit to complete location
- No email verification needed (Facebook email is trusted)
```

### 5.2 Login

**US-1.4: Login with Email**
```
As a registered user
I want to login with my email and password
So that I can access my account

Acceptance Criteria:
- Form has fields: email, password
- "Forgot password?" link visible
- Shows error for invalid credentials
- Shows loading state during submission
- Redirects to home page after successful login
- JWT tokens stored securely
- "Remember me" option (optional)
```

**US-1.5: Login with OAuth**
```
As a registered user
I want to login with Google or Facebook
So that I can quickly access my account

Acceptance Criteria:
- OAuth buttons visible on login page
- Redirects to provider consent screen
- Returns to app after approval
- Recognizes existing account (doesn't create duplicate)
- Redirects to home page after successful login
```

### 5.3 Profile Management

**US-1.6: View Public Profile**
```
As any user (authenticated or not)
I want to view a seller's public profile
So that I can see their information and reputation

Acceptance Criteria:
- Profile shows: name, avatar, location, rating, member since
- Shows user's active products
- Shows user's ratings and reviews
- Shows verification badge if email verified
- Does NOT show: email, phone number
- Works without authentication
```

**US-1.7: Edit Own Profile**
```
As an authenticated user
I want to edit my profile information
So that I can keep my information up to date

Acceptance Criteria:
- Form has fields: full name, phone, location (department + city)
- Avatar upload widget
- Shows current values pre-filled
- Validates inputs (name required, phone format)
- Shows loading state during save
- Shows success message after save
- Updates profile in database
- Cannot edit: email, rating, verification status
```

**US-1.8: Upload Avatar**
```
As an authenticated user
I want to upload a profile picture
So that other users can recognize me

Acceptance Criteria:
- Click to upload or drag-and-drop
- Accepts: JPG, PNG, WebP
- Max file size: 5MB
- Shows image preview before upload
- Crops/resizes to square (200x200px)
- Uploads to Supabase Storage
- Updates avatar_url in profile
- Shows loading state during upload
- Shows error if upload fails
```

### 5.4 Email Verification

**US-1.9: Verify Email**
```
As a registered user
I want to verify my email address
So that I can gain full access to the platform

Acceptance Criteria:
- Verification email sent on registration
- Email contains verification link
- Link redirects to /auth/verify-email
- Shows success message if valid
- Updates is_verified in database
- Shows error if link expired or invalid
- Can resend verification email
```

### 5.5 Password Reset

**US-1.10: Reset Password**
```
As a registered user who forgot password
I want to reset my password
So that I can regain access to my account

Acceptance Criteria:
- "Forgot password?" link on login page
- Form asks for email address
- Sends password reset email
- Email contains reset link
- Link redirects to reset password page
- Form has fields: new password, confirm password
- Password validation applies
- Shows success message after reset
- Can login with new password
```

### 5.6 Protected Routes

**US-1.11: Access Protected Routes**
```
As an authenticated user
I want to access protected pages
So that I can use features requiring authentication

Acceptance Criteria:
- Protected routes: /profile/edit, /products/new, /chat
- Redirects to /login if not authenticated
- Stores intended URL (redirects back after login)
- Shows loading state while checking auth
- Works with both email and OAuth users
```

---

## 6. Technical Requirements

### 6.1 Frontend Requirements

**Framework & Libraries**
- Next.js 14 with App Router
- React 18
- TypeScript (strict mode)
- Tailwind CSS for styling
- shadcn/ui for components
- Supabase SDK for auth
- React Hook Form for forms
- Zod for validation

**Key Files**
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Registration page
│   ├── callback/
│   │   └── route.ts              # OAuth callback handler
│   └── verify-email/
│       └── page.tsx              # Email verification page
├── profile/
│   ├── [id]/
│   │   └── page.tsx              # Public profile view
│   └── edit/
│       └── page.tsx              # Edit profile page
└── middleware.ts                 # Auth middleware

components/
├── auth/
│   ├── LoginForm.tsx             # Login form
│   ├── RegisterForm.tsx          # Registration form
│   ├── OAuthButtons.tsx          # Google/Facebook buttons
│   ├── ForgotPasswordForm.tsx    # Password reset form
│   └── AuthGuard.tsx             # Protected route wrapper
├── profile/
│   ├── ProfileView.tsx           # Public profile display
│   ├── ProfileEditForm.tsx       # Edit profile form
│   ├── AvatarUpload.tsx          # Avatar upload widget
│   └── LocationSelector.tsx      # Department + City selector
└── layout/
    └── UserMenu.tsx              # Header user dropdown

lib/
├── supabase/
│   ├── client.ts                 # Browser Supabase client
│   ├── server.ts                 # Server Supabase client
│   └── middleware.ts             # Auth middleware helpers
├── validations/
│   ├── auth.ts                   # Auth form validations
│   └── profile.ts                # Profile form validations
└── utils/
    └── avatar.ts                 # Avatar upload helpers

types/
└── database.ts                   # Generated Supabase types
```

### 6.2 Backend Requirements (Supabase)

**Database Migrations**
- `20260213000000_create_profiles_table.sql`
- `20260213000001_create_profile_triggers.sql`
- `20260213000002_create_storage_policies.sql`

**Supabase Auth Configuration**
- Enable email/password auth
- Configure Google OAuth (client ID + secret)
- Configure Facebook OAuth (app ID + secret)
- Set redirect URLs
- Configure email templates

**Storage Configuration**
- Create `avatars` bucket
- Set bucket to public
- Configure RLS policies
- Set file size limits (5MB)

### 6.3 Security Requirements

**Authentication**
- JWT tokens in httpOnly cookies
- CSRF protection
- Rate limiting on auth endpoints (10 attempts/hour)
- Password strength validation
- Email verification required

**Authorization**
- Row Level Security (RLS) on all tables
- Users can only edit own profile
- Public profiles viewable by anyone
- Protected routes require authentication

**Data Validation**
- Server-side validation for all inputs
- Client-side validation for UX
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)

---

## 7. Design Requirements

### 7.1 UI/UX Principles

**Authentication Pages**
- Clean, minimal design
- Clear call-to-action buttons
- Prominent OAuth buttons
- Error messages inline (not alerts)
- Loading states for all async actions
- Mobile-first responsive design

**Profile Pages**
- Professional, trustworthy appearance
- Clear information hierarchy
- Easy-to-use edit form
- Visual feedback for all actions
- Avatar prominently displayed

### 7.2 Wireframes

**Login Page**
```
┌─────────────────────────────────┐
│         [Telopillo Logo]        │
│                                 │
│  Iniciar Sesión                 │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Email                     │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Contraseña                │ │
│  └───────────────────────────┘ │
│                                 │
│  [¿Olvidaste tu contraseña?]   │
│                                 │
│  ┌───────────────────────────┐ │
│  │   [Iniciar Sesión]        │ │
│  └───────────────────────────┘ │
│                                 │
│  ──────── o ────────           │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔵 Continuar con Google   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📘 Continuar con Facebook │ │
│  └───────────────────────────┘ │
│                                 │
│  ¿No tienes cuenta? [Regístrate]│
└─────────────────────────────────┘
```

**Profile Edit Page**
```
┌─────────────────────────────────┐
│  Mi Perfil                      │
│                                 │
│  ┌─────┐                        │
│  │ 👤  │  [Cambiar foto]        │
│  └─────┘                        │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Nombre completo *         │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Teléfono (opcional)       │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌──────────┐  ┌──────────┐   │
│  │Depto. *  │  │Ciudad *  │   │
│  └──────────┘  └──────────┘   │
│                                 │
│  ┌───────────────────────────┐ │
│  │   [Guardar Cambios]       │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

### 7.3 Component Specifications

**LoginForm Component**
- Email input (type="email", required)
- Password input (type="password", required, show/hide toggle)
- "Forgot password?" link
- Submit button (disabled while loading)
- Error message display
- Success redirect

**OAuthButtons Component**
- Google button (blue, Google logo)
- Facebook button (blue, Facebook logo)
- Loading state (disabled during OAuth flow)
- Error handling

**AvatarUpload Component**
- Current avatar display (circular)
- Click to upload or drag-and-drop
- File type validation (JPG, PNG, WebP)
- File size validation (max 5MB)
- Image preview before upload
- Crop to square (200x200px)
- Upload progress indicator
- Error handling

---

## 8. Testing Requirements

### 8.1 Unit Tests

**Auth Functions**
- `validateEmail()` - Email format validation
- `validatePassword()` - Password strength validation
- `hashPassword()` - Password hashing (if custom)
- `generateAvatar()` - Avatar URL generation

**Profile Functions**
- `updateProfile()` - Profile update logic
- `uploadAvatar()` - Avatar upload logic
- `getPublicProfile()` - Fetch public profile

### 8.2 Integration Tests

**Auth Flow Tests**
- User can register with email
- User can login with email
- User can login with Google OAuth
- User can login with Facebook OAuth
- User can reset password
- User can verify email

**Profile Flow Tests**
- Profile auto-created on registration
- User can view public profile
- User can edit own profile
- User can upload avatar
- User cannot edit other's profile

### 8.3 E2E Tests (Playwright)

**Critical User Journeys**
1. Complete registration flow (email → verify → complete profile)
2. Login → edit profile → logout
3. OAuth registration → complete profile
4. Forgot password → reset → login

### 8.4 Manual Testing Checklist

- [ ] Register with email works
- [ ] Register with Google works
- [ ] Register with Facebook works
- [ ] Login with email works
- [ ] Login with OAuth works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Profile edit works
- [ ] Avatar upload works
- [ ] Protected routes redirect to login
- [ ] Logout works
- [ ] Mobile responsive
- [ ] Cross-browser (Chrome, Firefox, Safari)

---

## 9. Success Criteria

### 9.1 Functional Requirements
- ✅ All user stories completed
- ✅ All acceptance criteria met
- ✅ All tests passing
- ✅ No critical bugs

### 9.2 Non-Functional Requirements
- ✅ Page load time < 2 seconds
- ✅ Auth response time < 1 second
- ✅ Avatar upload < 5 seconds
- ✅ Mobile responsive (all screen sizes)
- ✅ Accessible (WCAG AA)
- ✅ No console errors

### 9.3 Security Requirements
- ✅ RLS policies tested and working
- ✅ JWT tokens in httpOnly cookies
- ✅ Password validation enforced
- ✅ Email verification working
- ✅ No sensitive data exposed

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OAuth setup complexity | High | Medium | Follow Supabase docs, test early |
| Avatar upload failures | Medium | Low | Implement retry logic, show errors |
| RLS policy errors | High | Medium | Test thoroughly, use Supabase dashboard |
| Email delivery issues | Medium | Low | Use Resend (reliable), test with real emails |
| Session management bugs | High | Low | Use Supabase SDK (battle-tested) |

### 10.2 UX Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex registration flow | High | Medium | Make location optional initially |
| OAuth confusion | Medium | Low | Clear button labels, explain benefits |
| Profile completion friction | Medium | Medium | Make most fields optional |
| Email verification ignored | Low | High | Allow usage without verification, show banner |

---

## 11. Dependencies

### 11.1 Milestone Dependencies
- **M0 (Foundation & Setup)** - MUST be completed first
  - Next.js project initialized
  - Supabase connected
  - Base layout exists

### 11.2 External Dependencies
- Google OAuth credentials (from Google Cloud Console)
- Facebook OAuth credentials (from Facebook Developers)
- Supabase project with Auth enabled
- Email service configured (Supabase default or Resend)

### 11.3 Team Dependencies
- None (can be completed by single developer)

---

## 12. Timeline & Milestones

### Week 2 (Days 1-5)

**Day 1-2: Database & Auth Setup**
- Create profiles table migration
- Set up RLS policies
- Create triggers (auto-create profile)
- Configure OAuth providers
- Test database setup

**Day 3-4: Authentication Pages**
- Build login page
- Build registration page
- Implement email/password auth
- Implement OAuth buttons
- Add form validation
- Test auth flows

**Day 5: Email & Password Reset**
- Configure email templates
- Implement email verification
- Implement password reset
- Test email flows

### Week 3 (Days 6-10)

**Day 6-7: Profile Management**
- Build public profile view
- Build profile edit page
- Implement location selector
- Test profile CRUD

**Day 8: Avatar Upload**
- Create avatars storage bucket
- Implement avatar upload widget
- Add image optimization
- Test upload flow

**Day 9: Protected Routes & Polish**
- Implement auth middleware
- Add protected route guards
- Add user menu in header
- Polish UI/UX

**Day 10: Testing & Bug Fixes**
- Run all tests
- Fix bugs
- Manual testing
- Documentation

---

## 13. Acceptance Criteria

### 13.1 Must Have (P0)
- ✅ Email/password registration works
- ✅ Email/password login works
- ✅ Google OAuth works
- ✅ Profile auto-created on registration
- ✅ Users can edit profile
- ✅ Avatar upload works
- ✅ Protected routes work
- ✅ RLS policies secure data

### 13.2 Should Have (P1)
- ✅ Facebook OAuth works
- ✅ Email verification works
- ✅ Password reset works
- ✅ Public profile view works
- ✅ Location selector works

### 13.3 Nice to Have (P2)
- ⏸️ Remember me checkbox
- ⏸️ Profile completion progress bar
- ⏸️ Avatar crop tool
- ⏸️ Social links on profile

---

## 14. Documentation Requirements

- [ ] API documentation (Supabase functions)
- [ ] Component documentation (Storybook optional)
- [ ] User guide (how to register, login, edit profile)
- [ ] Admin guide (how to manage users)
- [ ] Security documentation (RLS policies, auth flow)

---

## 15. Appendix

### 15.1 Bolivia Departments & Cities

**9 Departments:**
1. Santa Cruz
2. La Paz
3. Cochabamba
4. Potosí
5. Chuquisaca
6. Oruro
7. Tarija
8. Beni
9. Pando

**Major Cities (for dropdowns):**
- Santa Cruz: Santa Cruz de la Sierra, Montero, Warnes
- La Paz: La Paz, El Alto, Viacha
- Cochabamba: Cochabamba, Quillacollo, Sacaba
- (See M7 for complete list)

### 15.2 Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (optional but recommended)

### 15.3 Avatar Specifications

- Formats: JPG, PNG, WebP
- Max size: 5MB
- Recommended dimensions: 200x200px (square)
- Stored in: Supabase Storage (`avatars` bucket)
- URL format: `https://[project].supabase.co/storage/v1/object/public/avatars/[user_id]/avatar.jpg`

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Next Review:** After M1 completion
