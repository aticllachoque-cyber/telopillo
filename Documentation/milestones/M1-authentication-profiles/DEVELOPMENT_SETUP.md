# M1 Development Setup Guide

**Purpose:** Configure development environment for testing authentication without creating new accounts constantly.

---

## 🧪 Testing Strategy

### Problem
- Need to test authentication repeatedly
- Don't want to create new accounts every time
- Want to build features without authentication blocking progress

### Solution
Two-part approach:

1. **Test User Management** (Opción A + D)
2. **Auth Bypass Feature Flag** (Opción A)

---

## 1️⃣ Test User Management

### Option A: Fixed Development User (Immediate) ⭐

**Setup Steps:**

#### Method 1: Via Supabase Dashboard (GUI)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Authentication → Users

2. Click **"Invite user"** or **"Create user"**

3. Fill in:
   - **Email:** `dev@telopillo.test`
   - **Password:** `DevTest123!`
   - **Auto Confirm User:** ✅ (check this box - important!)

4. Click **"Create user"**

5. **Verify:** The user should appear in the users list with status "Confirmed"

#### Method 2: Via Supabase SQL Editor (CLI-style)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor

2. Click **"New query"**

3. Paste and run:
   ```sql
   -- Create dev user with confirmed email
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     raw_user_meta_data,
     created_at,
     updated_at,
     confirmation_token,
     recovery_token
   )
   VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'dev@telopillo.test',
     crypt('DevTest123!', gen_salt('bf')),
     now(),
     '{"full_name": "Usuario de Prueba"}'::jsonb,
     now(),
     now(),
     '',
     ''
   );
   ```

4. **Verify:** Go to Authentication → Users and confirm the user was created

#### Add to `.env.local`

After creating the user (either method):

```env
# Development Test User
DEV_TEST_EMAIL=dev@telopillo.test
DEV_TEST_PASSWORD=DevTest123!
```

**Usage:**
- Use these credentials every time you test login
- To reset: Delete user from Dashboard → Authentication → Users (trash icon)
- Recreate with the same credentials using either method

**To Delete User:**
```sql
-- Via SQL Editor
DELETE FROM auth.users WHERE email = 'dev@telopillo.test';
```
Or click the trash icon in Authentication → Users

**Pros:**
- ✅ Simple and fast
- ✅ No code changes needed
- ✅ Works immediately

**Cons:**
- ⚠️ Manual deletion/recreation
- ⚠️ Shares same remote database

---

### Option D: Supabase Local Development (Future) 🐳

**When to use:**
- When you need complete isolation
- When testing migrations
- When you want to reset everything quickly

**Setup Steps:**

1. **Install Docker** (if not already installed)
   ```bash
   # Check if Docker is installed
   docker --version
   ```

2. **Start local Supabase**
   ```bash
   npx supabase start
   ```

   This creates:
   - Local PostgreSQL database
   - Local API at `http://localhost:54321`
   - Local Studio at `http://localhost:54323`
   - All Supabase services running locally

3. **Update `.env.local` to use local instance**
   ```env
   # Local Supabase (when running npx supabase start)
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```

4. **Stop local Supabase when done**
   ```bash
   npx supabase stop
   ```

**Usage:**
- Start local instance when developing
- All data is isolated and can be reset
- Stop when switching back to remote

**Pros:**
- ✅ Complete isolation
- ✅ Fast reset (just restart)
- ✅ No impact on production data
- ✅ Test migrations safely

**Cons:**
- ⚠️ Requires Docker
- ⚠️ More setup time
- ⚠️ Need to switch .env variables

---

## 2️⃣ Auth Bypass Feature Flag

### Option A: Environment Variable ⭐

**Purpose:** Disable authentication checks during development so you can build features without logging in.

**Setup:**

Add to `.env.local`:
```env
# Auth Bypass - set to true to disable auth checks
NEXT_PUBLIC_DISABLE_AUTH=false
```

**Usage:**

1. **When building features (no auth needed):**
   ```env
   NEXT_PUBLIC_DISABLE_AUTH=true
   ```
   - Restart dev server: `npm run dev`
   - All protected routes are accessible
   - No login required

2. **When testing authentication:**
   ```env
   NEXT_PUBLIC_DISABLE_AUTH=false
   ```
   - Restart dev server: `npm run dev`
   - Normal auth behavior
   - Protected routes require login

**Implementation:**

The middleware (Phase 6) will check this flag:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Check bypass flag
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
  
  if (disableAuth) {
    console.log('🔓 Auth bypass enabled - skipping authentication')
    return NextResponse.next()
  }
  
  // Normal auth checks...
}
```

**Pros:**
- ✅ Simple toggle
- ✅ No code changes in components
- ✅ Can switch anytime

**Cons:**
- ⚠️ Must restart dev server to apply changes
- ⚠️ Easy to forget it's enabled

---

## 📋 Quick Reference

### Development Workflow

**Scenario 1: Testing Authentication**
```bash
# .env.local
NEXT_PUBLIC_DISABLE_AUTH=false
DEV_TEST_EMAIL=dev@telopillo.test
DEV_TEST_PASSWORD=DevTest123!

# Use dev user to login
```

**Scenario 2: Building Features (no auth needed)**
```bash
# .env.local
NEXT_PUBLIC_DISABLE_AUTH=true

# Access any route without login
```

**Scenario 3: Clean Slate Testing**
```bash
# Option 1: Delete user in Supabase Dashboard
# Option 2: Use local Supabase
npx supabase start
# Update .env.local to local URL
```

---

## ⚙️ Configuration Summary

### `.env.local` (Complete)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://apwpsjjzcbytnvtnmmru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3003

# Development Features (M1)
NEXT_PUBLIC_DISABLE_AUTH=false

# Development Test User
DEV_TEST_EMAIL=dev@telopillo.test
DEV_TEST_PASSWORD=DevTest123!
```

### `.env.example` (Updated)

Already updated with all development configuration options.

---

## 🎯 Implementation Timeline

| Phase | Feature | Status |
|-------|---------|--------|
| Phase 1 | Database Setup | ✅ Complete |
| Phase 2 | OAuth Configuration | ⏳ Next |
| Phase 3 | Auth Pages | ⏳ Pending |
| Phase 6 | Auth Bypass Middleware | ⏳ Pending |

**Note:** Auth bypass will be implemented in Phase 6 (Protected Routes).

---

## 📝 Notes

- **Security:** `NEXT_PUBLIC_DISABLE_AUTH` should NEVER be `true` in production
- **Git:** `.env.local` is in `.gitignore` - never commit it
- **Team:** Each developer sets their own `.env.local`
- **Testing:** Always test with auth enabled before committing

---

## 🚀 Quick Commands Reference

### Create Dev User (SQL)

```sql
-- Run in Supabase Dashboard → SQL Editor
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dev@telopillo.test',
  crypt('DevTest123!', gen_salt('bf')),
  now(),
  '{"full_name": "Usuario de Prueba"}'::jsonb,
  now(), now(), '', ''
);
```

### Delete Dev User (SQL)

```sql
-- Run in Supabase Dashboard → SQL Editor
DELETE FROM auth.users WHERE email = 'dev@telopillo.test';
```

### Check if User Exists (SQL)

```sql
-- Run in Supabase Dashboard → SQL Editor
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'dev@telopillo.test';
```

### Check Profile was Created (SQL)

```sql
-- Run in Supabase Dashboard → SQL Editor
-- Should return a profile if trigger worked
SELECT p.id, p.full_name, p.created_at, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'dev@telopillo.test';
```

---

**Last Updated:** February 13, 2026  
**Next:** Create dev user and proceed with Phase 2
