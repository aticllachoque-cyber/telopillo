# Quick Start - M1: Authentication & User Profiles

**Estimated Time:** 2-3 days for experienced developers, 4-5 days for beginners  
**Prerequisites:** M0 completed

---

## 🎯 What You'll Build

By the end of this milestone, you'll have:
- ✅ Complete authentication system (email + OAuth)
- ✅ User profiles with avatar upload
- ✅ Protected routes
- ✅ User menu in header

---

## 📋 Before You Start

### Required
- [ ] M0 completed (Next.js + Supabase working)
- [ ] Google OAuth credentials
- [ ] Facebook OAuth credentials
- [ ] Supabase CLI installed

### Get OAuth Credentials

**Google OAuth (5 minutes)**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
4. Add redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
5. Copy Client ID + Secret

**Facebook OAuth (5 minutes)**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create app → Add Facebook Login
3. Settings → Add redirect URI: `https://[project-ref].supabase.co/auth/v1/callback`
4. Copy App ID + Secret

---

## 🚀 Quick Implementation (TL;DR)

```bash
# 1. Create database migration
cd supabase
supabase migration new create_profiles_table

# 2. Copy SQL from IMPLEMENTATION_PLAN.md Phase 1
# 3. Apply migration
supabase db push

# 4. Configure OAuth in Supabase Dashboard
# Authentication → Providers → Enable Google & Facebook

# 5. Install dependencies
cd frontend
npm install react-hook-form @hookform/resolvers/zod react-icons lucide-react

# 6. Create auth pages (copy from IMPLEMENTATION_PLAN.md Phase 3-5)
# 7. Create profile pages (copy from IMPLEMENTATION_PLAN.md Phase 4)
# 8. Add middleware (copy from IMPLEMENTATION_PLAN.md Phase 6)

# 9. Test everything
npm run dev
```

---

## 📝 Step-by-Step Guide

### Day 1: Database & OAuth Setup

**Morning (3-4 hours): Database**

1. **Create migration file**
   ```bash
   cd supabase
   supabase migration new create_profiles_table
   ```

2. **Copy SQL from IMPLEMENTATION_PLAN.md** (Phase 1, Section 3.2)
   - profiles table
   - RLS policies
   - Triggers
   - Storage bucket

3. **Apply migration**
   ```bash
   supabase db push
   ```

4. **Verify in Supabase Dashboard**
   - Table Editor → Should see `profiles` table
   - Storage → Should see `avatars` bucket

**Afternoon (2-3 hours): OAuth Configuration**

1. **Configure Google OAuth**
   - Supabase Dashboard → Authentication → Providers
   - Enable Google
   - Enter Client ID + Secret

2. **Configure Facebook OAuth**
   - Same as Google
   - Enable Facebook
   - Enter App ID + Secret

3. **Test OAuth**
   - Try signing in with Google/Facebook
   - Check if profile auto-created

**✅ Day 1 Checkpoint:**
- [ ] profiles table exists
- [ ] Storage bucket exists
- [ ] Google OAuth works
- [ ] Facebook OAuth works

---

### Day 2: Authentication Pages

**Morning (4-5 hours): Login & Registration**

1. **Install dependencies**
   ```bash
   npm install react-hook-form @hookform/resolvers/zod react-icons
   ```

2. **Create validation schemas**
   - Copy from IMPLEMENTATION_PLAN.md Phase 3, Section 5.2
   - File: `lib/validations/auth.ts`

3. **Create OAuth buttons component**
   - Copy from Phase 3, Section 5.3
   - File: `components/auth/OAuthButtons.tsx`

4. **Create login page**
   - Copy from Phase 3, Section 5.4
   - File: `app/(auth)/login/page.tsx`

5. **Create registration page**
   - Copy from Phase 3, Section 5.5
   - File: `app/(auth)/register/page.tsx`

6. **Create OAuth callback**
   - Copy from Phase 3, Section 5.6
   - File: `app/auth/callback/route.ts`

**Afternoon (3-4 hours): Password Reset**

1. **Create forgot password page**
   - Copy from Phase 3, Section 5.7
   - File: `app/(auth)/forgot-password/page.tsx`

2. **Create reset password page**
   - Copy from Phase 3, Section 5.8
   - File: `app/(auth)/reset-password/page.tsx`

3. **Test all auth flows**
   - Register with email
   - Login with email
   - Login with OAuth
   - Reset password

**✅ Day 2 Checkpoint:**
- [ ] Can register with email
- [ ] Can login with email
- [ ] Can login with Google
- [ ] Can login with Facebook
- [ ] Password reset works

---

### Day 3: Profile Management & Polish

**Morning (4-5 hours): Profile Pages**

1. **Generate TypeScript types**
   ```bash
   npx supabase gen types typescript --project-id [project-ref] > types/database.ts
   ```

2. **Create profile validation**
   - Copy from Phase 4, Section 6.2
   - File: `lib/validations/profile.ts`

3. **Create location selector**
   - Copy from Phase 4, Section 6.3
   - File: `components/profile/LocationSelector.tsx`

4. **Create profile edit page**
   - Copy from Phase 4, Section 6.4
   - File: `app/profile/edit/page.tsx`

5. **Create public profile page**
   - Copy from Phase 4, Section 6.5
   - File: `app/profile/[id]/page.tsx`

**Afternoon (3-4 hours): Avatar Upload & Protected Routes**

1. **Install lucide-react**
   ```bash
   npm install lucide-react
   ```

2. **Create avatar upload component**
   - Copy from Phase 5, Section 7.1
   - File: `components/profile/AvatarUpload.tsx`

3. **Update profile edit page**
   - Add avatar upload (Phase 5, Section 7.2)

4. **Create middleware**
   - Copy from Phase 6, Section 8.1
   - File: `middleware.ts` (root)

5. **Create user menu**
   - Copy from Phase 6, Section 8.2
   - File: `components/layout/UserMenu.tsx`

6. **Update header**
   - Copy from Phase 6, Section 8.3
   - File: `components/layout/Header.tsx`

**Evening (2-3 hours): Testing**

1. **Manual testing** (use checklist from Phase 7)
2. **Fix any bugs**
3. **Test on mobile**
4. **Commit to git**

**✅ Day 3 Checkpoint:**
- [ ] Can edit profile
- [ ] Can upload avatar
- [ ] Protected routes work
- [ ] User menu works
- [ ] All tests passed

---

## 🧪 Testing Checklist

### Quick Test (5 minutes)
- [ ] Register new user
- [ ] Login works
- [ ] Can edit profile
- [ ] Can upload avatar
- [ ] Protected routes redirect to login
- [ ] Logout works

### Full Test (30 minutes)
Use checklist from IMPLEMENTATION_PLAN.md Phase 7, Section 9.1

---

## 🐛 Common Issues & Solutions

### Issue: "Profile not created after registration"
**Solution:** Check if trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: "OAuth redirect fails"
**Solution:** Verify redirect URLs match in provider console

### Issue: "Avatar upload fails"
**Solution:** Check if bucket is public and policies are correct

### Issue: "Cannot edit profile (RLS error)"
**Solution:** Verify you're logged in and RLS policies are correct

### Issue: "Middleware redirect loop"
**Solution:** Check middleware matcher config and protected routes list

---

## 📦 Dependencies to Install

```bash
# Required
npm install react-hook-form @hookform/resolvers/zod
npm install react-icons lucide-react

# Already installed from M0
# - @supabase/supabase-js
# - @supabase/ssr
# - zod
```

---

## 📁 Files You'll Create

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── layout.tsx
├── auth/
│   └── callback/route.ts
└── profile/
    ├── [id]/page.tsx
    └── edit/page.tsx

components/
├── auth/
│   └── OAuthButtons.tsx
├── profile/
│   ├── AvatarUpload.tsx
│   └── LocationSelector.tsx
└── layout/
    └── UserMenu.tsx

lib/
├── validations/
│   ├── auth.ts
│   └── profile.ts
└── supabase/
    ├── client.ts (update)
    └── server.ts (update)

supabase/
└── migrations/
    ├── [timestamp]_create_profiles_table.sql
    └── [timestamp]_create_avatars_bucket.sql

middleware.ts (root)
```

---

## 🎓 Learning Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

---

## ✅ Definition of Done

M1 is complete when:
- [ ] All 13 tasks in README.md are checked
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Code committed to git
- [ ] Documentation updated

---

## 🚦 Next Milestone

After M1, you're ready for **M2: Product Listings**!

You'll use:
- ✅ User authentication (to assign products to users)
- ✅ User profiles (to show seller info)
- ✅ Avatar upload (for seller avatar in product cards)

---

**Need Help?**
- Check IMPLEMENTATION_PLAN.md for detailed code
- Check PRD.md for requirements
- Check Troubleshooting section for common issues

**Good luck!** 🚀
