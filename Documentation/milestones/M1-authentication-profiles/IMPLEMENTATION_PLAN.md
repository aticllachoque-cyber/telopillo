# Implementation Plan - Milestone 1: Authentication & User Profiles

**Version:** 1.0  
**Date:** February 12, 2026  
**Author:** Alcides Cardenas  
**Estimated Duration:** 10 working days (2 weeks)  
**Status:** Ready to Execute

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Database Setup](#3-phase-1-database-setup)
4. [Phase 2: OAuth Configuration](#4-phase-2-oauth-configuration)
5. [Phase 3: Authentication Pages](#5-phase-3-authentication-pages)
6. [Phase 4: Profile Management](#6-phase-4-profile-management)
7. [Phase 5: Avatar Upload](#7-phase-5-avatar-upload)
8. [Phase 6: Protected Routes](#8-phase-6-protected-routes)
9. [Phase 7: Testing & Polish](#9-phase-7-testing--polish)
10. [Troubleshooting Guide](#10-troubleshooting-guide)
11. [Verification Checklist](#11-verification-checklist)

---

## 1. Overview

This implementation plan provides step-by-step instructions to complete Milestone 1: Authentication & User Profiles. Follow the phases sequentially.

### 1.1 Timeline

```
Week 2:
  Day 1-2: Phase 1 (Database Setup)
  Day 3-4: Phase 2 (OAuth Configuration) + Phase 3 (Auth Pages)
  Day 5:   Phase 3 continued (Email & Password Reset)

Week 3:
  Day 6-7: Phase 4 (Profile Management)
  Day 8:   Phase 5 (Avatar Upload)
  Day 9:   Phase 6 (Protected Routes & Polish)
  Day 10:  Phase 7 (Testing & Bug Fixes)
```

### 1.2 Key Principles

- **Security first**: Always test RLS policies
- **Test incrementally**: Don't wait until the end
- **Mobile-first**: Design for mobile, enhance for desktop
- **Commit frequently**: Clear, descriptive commit messages

---

## 2. Prerequisites

### 2.1 Completed Milestones
- ✅ M0: Foundation & Setup completed
- ✅ Next.js app running
- ✅ Supabase connected
- ✅ Base layout exists

### 2.2 Required Accounts & Credentials

**Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback (for local testing)
   ```
7. Copy Client ID and Client Secret

**Facebook OAuth Setup**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create new app or select existing
3. Add Facebook Login product
4. Settings → Basic:
   - Copy App ID and App Secret
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     ```
     https://[your-project-ref].supabase.co/auth/v1/callback
     http://localhost:54321/auth/v1/callback
     ```

### 2.3 Tools Needed
```bash
# Verify Supabase CLI is installed
supabase --version

# If not installed:
npm install -g supabase
```

---

## 3. Phase 1: Database Setup

**Duration:** Day 1-2 (8-10 hours)  
**Goal:** Create profiles table with RLS policies and triggers

### 3.1 Create Migration File

```bash
cd supabase
supabase migration new create_profiles_table
```

This creates: `supabase/migrations/[timestamp]_create_profiles_table.sql`

### 3.2 Write Migration SQL

Edit the migration file:

```sql
-- supabase/migrations/[timestamp]_create_profiles_table.sql

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location_city TEXT,
  location_department TEXT,
  rating_average NUMERIC(3,2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location 
  ON public.profiles(location_department, location_city);

CREATE INDEX IF NOT EXISTS idx_profiles_rating 
  ON public.profiles(rating_average DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
  ON public.profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  USING (true);

-- RLS Policy: Users can insert their own profile (via trigger)
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can delete their own profile
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
```

### 3.3 Apply Migration

```bash
# Push migration to Supabase
supabase db push

# Or if using remote database:
supabase db push --db-url "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### 3.4 Verify Migration

```bash
# Check if table exists
supabase db diff

# Or use Supabase Dashboard:
# 1. Go to Table Editor
# 2. Should see "profiles" table
# 3. Check columns match schema
```

### 3.5 Test RLS Policies

Create test file: `supabase/tests/profiles_rls.test.sql`

```sql
-- Test 1: Anyone can view profiles
BEGIN;
  SET LOCAL ROLE anon;
  SELECT * FROM profiles; -- Should work
ROLLBACK;

-- Test 2: Users can only update own profile
BEGIN;
  SET LOCAL ROLE authenticated;
  SET LOCAL request.jwt.claims TO '{"sub": "test-user-id"}';
  
  -- This should work (own profile)
  UPDATE profiles SET full_name = 'Test' WHERE id = 'test-user-id';
  
  -- This should fail (other's profile)
  UPDATE profiles SET full_name = 'Hacker' WHERE id = 'other-user-id';
ROLLBACK;
```

Run tests:
```bash
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" < supabase/tests/profiles_rls.test.sql
```

### 3.6 Create Storage Bucket for Avatars

```bash
# Create migration for storage
supabase migration new create_avatars_bucket
```

Edit migration:

```sql
-- supabase/migrations/[timestamp]_create_avatars_bucket.sql

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload their own avatar
CREATE POLICY "avatar_upload_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can update their own avatar
CREATE POLICY "avatar_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can delete their own avatar
CREATE POLICY "avatar_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Anyone can view avatars (public bucket)
CREATE POLICY "avatar_read_policy"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
```

Apply migration:
```bash
supabase db push
```

### 3.7 Verify Storage Setup

1. Go to Supabase Dashboard → Storage
2. Should see "avatars" bucket
3. Try uploading a test image
4. Check if URL is publicly accessible

**✅ Phase 1 Complete Checklist:**
- [ ] profiles table created
- [ ] RLS policies applied
- [ ] Triggers working (test by creating user)
- [ ] Storage bucket created
- [ ] Storage policies applied
- [ ] Migration committed to git

---

## 4. Phase 2: OAuth Configuration

**Duration:** Day 3 (3-4 hours)  
**Goal:** Configure Google and Facebook OAuth providers

### 4.1 Configure Google OAuth in Supabase

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Find "Google" and click "Enable"
4. Enter credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Copy the Redirect URL (you'll need this for Google Console)
6. Click "Save"

### 4.2 Update Google Cloud Console

1. Go back to Google Cloud Console
2. Credentials → Edit OAuth 2.0 Client
3. Add Authorized redirect URIs:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
4. Save

### 4.3 Test Google OAuth

```bash
# Test OAuth flow manually
# 1. Go to Supabase Dashboard → Authentication → Users
# 2. Click "Invite user" → "Sign in with Google"
# 3. Should redirect to Google consent screen
# 4. After approval, should create user in auth.users
# 5. Check if profile was auto-created in profiles table
```

### 4.4 Configure Facebook OAuth in Supabase

1. Go to Supabase Dashboard
2. Authentication → Providers
3. Find "Facebook" and click "Enable"
4. Enter credentials:
   - **App ID**: (from Facebook Developers)
   - **App Secret**: (from Facebook Developers)
5. Copy the Redirect URL
6. Click "Save"

### 4.5 Update Facebook App Settings

1. Go back to Facebook Developers
2. Your App → Facebook Login → Settings
3. Add Valid OAuth Redirect URIs:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
4. Save Changes

### 4.6 Test Facebook OAuth

Similar to Google OAuth test above.

**✅ Phase 2 Complete Checklist:**
- [ ] Google OAuth configured in Supabase
- [ ] Google OAuth tested (can sign in)
- [ ] Facebook OAuth configured in Supabase
- [ ] Facebook OAuth tested (can sign in)
- [ ] Profile auto-created for OAuth users

---

## 5. Phase 3: Authentication Pages

**Duration:** Day 3-5 (12-16 hours)  
**Goal:** Build login, registration, and password reset pages

### 5.1 Create Supabase Client Utilities

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle error
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error
          }
        },
      },
    }
  )
}
```

### 5.2 Create Validation Schemas

Create `lib/validations/auth.ts`:

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
```

### 5.3 Create OAuth Buttons Component

Create `components/auth/OAuthButtons.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook } from 'react-icons/fa'

export function OAuthButtons() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth error:', error)
      alert('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('google')}
        disabled={isLoading}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continuar con Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => handleOAuth('facebook')}
        disabled={isLoading}
      >
        <FaFacebook className="mr-2 h-5 w-5 text-blue-600" />
        Continuar con Facebook
      </Button>
    </div>
  )
}
```

Install required packages:
```bash
npm install react-icons
```

### 5.4 Create Login Page

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accede a tu cuenta de Telopillo
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continúa con
            </span>
          </div>
        </div>

        <OAuthButtons />

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
```

Install required packages:
```bash
npm install react-hook-form @hookform/resolvers zod
```

### 5.5 Create Registration Page

Create `app/(auth)/register/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Show success message
      alert('¡Registro exitoso! Revisa tu email para verificar tu cuenta.')
      router.push('/profile/edit')
    } catch (error: any) {
      setError(error.message || 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Únete a Telopillo y empieza a comprar o vender
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Juan Pérez"
              {...register('fullName')}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, 1 mayúscula, 1 número
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O regístrate con
            </span>
          </div>
        </div>

        <OAuthButtons />

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### 5.6 Create OAuth Callback Handler

Create `app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to profile edit if first time, otherwise home
  return NextResponse.redirect(`${origin}/profile/edit`)
}
```

### 5.7 Create Forgot Password Page

Create `app/(auth)/forgot-password/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Error al enviar email')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <h1 className="text-3xl font-bold">Email Enviado</h1>
          <p className="text-muted-foreground">
            Revisa tu email para restablecer tu contraseña.
          </p>
          <Link href="/login">
            <Button className="w-full">Volver a Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">¿Olvidaste tu Contraseña?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tu email y te enviaremos un link para restablecerla
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Link de Restablecimiento'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Volver a Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### 5.8 Create Reset Password Page

Create `app/(auth)/reset-password/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) throw error

      alert('¡Contraseña actualizada exitosamente!')
      router.push('/login')
    } catch (error: any) {
      setError(error.message || 'Error al actualizar contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Nueva Contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### 5.9 Create Auth Layout

Create `app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {children}
    </div>
  )
}
```

**✅ Phase 3 Complete Checklist:**
- [ ] Supabase client utilities created
- [ ] Validation schemas created
- [ ] OAuth buttons component created
- [ ] Login page created and working
- [ ] Registration page created and working
- [ ] OAuth callback handler created
- [ ] Forgot password page created
- [ ] Reset password page created
- [ ] All pages tested manually
- [ ] Code committed to git

---

## 6. Phase 4: Profile Management

**Duration:** Day 6-7 (10-12 hours)  
**Goal:** Build public profile view and edit profile page

### 6.1 Generate TypeScript Types

```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id [your-project-ref] > types/database.ts
```

### 6.2 Create Profile Validation Schema

Create `lib/validations/profile.ts`:

```typescript
import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional().nullable(),
  location_department: z.string().min(1, 'Selecciona un departamento'),
  location_city: z.string().min(1, 'Selecciona una ciudad'),
})

export type ProfileInput = z.infer<typeof profileSchema>
```

### 6.3 Create Location Selector Component

Create `components/profile/LocationSelector.tsx`:

```typescript
'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEPARTMENTS = [
  'Santa Cruz',
  'La Paz',
  'Cochabamba',
  'Potosí',
  'Chuquisaca',
  'Oruro',
  'Tarija',
  'Beni',
  'Pando',
]

const CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  'Santa Cruz': ['Santa Cruz de la Sierra', 'Montero', 'Warnes', 'Camiri'],
  'La Paz': ['La Paz', 'El Alto', 'Viacha', 'Achocalla'],
  'Cochabamba': ['Cochabamba', 'Quillacollo', 'Sacaba', 'Colcapirhua'],
  // Add more cities...
}

interface LocationSelectorProps {
  department: string | null
  city: string | null
  onDepartmentChange: (value: string) => void
  onCityChange: (value: string) => void
  disabled?: boolean
}

export function LocationSelector({
  department,
  city,
  onDepartmentChange,
  onCityChange,
  disabled,
}: LocationSelectorProps) {
  const cities = department ? CITIES_BY_DEPARTMENT[department] || [] : []

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="department">Departamento *</Label>
        <Select
          value={department || ''}
          onValueChange={onDepartmentChange}
          disabled={disabled}
        >
          <SelectTrigger id="department">
            <SelectValue placeholder="Selecciona departamento" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ciudad *</Label>
        <Select
          value={city || ''}
          onValueChange={onCityChange}
          disabled={disabled || !department}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="Selecciona ciudad" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((cityName) => (
              <SelectItem key={cityName} value={cityName}>
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

### 6.4 Create Profile Edit Page

Create `app/profile/edit/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileInput } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocationSelector } from '@/components/profile/LocationSelector'

export default function ProfileEditPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  const department = watch('location_department')
  const city = watch('location_city')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (profile) {
        setValue('full_name', profile.full_name)
        setValue('phone', profile.phone)
        setValue('location_department', profile.location_department)
        setValue('location_city', profile.location_city)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    try {
      setIsSaving(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          location_department: data.location_department,
          location_city: data.location_city,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('¡Perfil actualizado exitosamente!')
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'Error al guardar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Editar Perfil</h1>
          <p className="mt-2 text-muted-foreground">
            Completa tu información para empezar a publicar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Juan Pérez"
              {...register('full_name')}
              disabled={isSaving}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+591 70000000"
              {...register('phone')}
              disabled={isSaving}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Para que los compradores puedan contactarte por WhatsApp
            </p>
          </div>

          <LocationSelector
            department={department}
            city={city}
            onDepartmentChange={(value) => {
              setValue('location_department', value)
              setValue('location_city', '')
            }}
            onCityChange={(value) => setValue('location_city', value)}
            disabled={isSaving}
          />

          {errors.location_department && (
            <p className="text-sm text-destructive">
              {errors.location_department.message}
            </p>
          )}
          {errors.location_city && (
            <p className="text-sm text-destructive">{errors.location_city.message}</p>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### 6.5 Create Public Profile View Page

Create `app/profile/[id]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !profile) {
    notFound()
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.full_name}</h1>
              {profile.is_verified && (
                <Badge variant="secondary">✓ Verificado</Badge>
              )}
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              {profile.location_city && profile.location_department && (
                <span>
                  📍 {profile.location_city}, {profile.location_department}
                </span>
              )}
              <span>
                📅 Miembro desde{' '}
                {new Date(profile.created_at).toLocaleDateString('es-BO')}
              </span>
            </div>

            {profile.rating_count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-semibold">
                  {profile.rating_average.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({profile.rating_count} calificaciones)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User's Products */}
        <div>
          <h2 className="text-2xl font-bold">Publicaciones</h2>
          <p className="mt-4 text-muted-foreground">
            Este usuario aún no tiene publicaciones.
          </p>
        </div>

        {/* User's Ratings */}
        <div>
          <h2 className="text-2xl font-bold">Calificaciones</h2>
          <p className="mt-4 text-muted-foreground">
            Este usuario aún no tiene calificaciones.
          </p>
        </div>
      </div>
    </div>
  )
}
```

**✅ Phase 4 Complete Checklist:**
- [ ] TypeScript types generated
- [ ] Profile validation schema created
- [ ] Location selector component created
- [ ] Profile edit page created and working
- [ ] Public profile view page created
- [ ] Can update profile successfully
- [ ] Location selector works correctly
- [ ] Code committed to git

---

## 7. Phase 5: Avatar Upload

**Duration:** Day 8 (6-8 hours)  
**Goal:** Implement avatar upload functionality

### 7.1 Create Avatar Upload Component

Create `components/profile/AvatarUpload.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onUploadComplete(publicUrl)
    } catch (error: any) {
      setError(error.message || 'Error al subir imagen')
      setPreviewUrl(currentAvatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    try {
      setIsUploading(true)
      setError(null)

      // Remove from storage
      const fileName = `${userId}/avatar`
      await supabase.storage.from('avatars').remove([fileName])

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      setPreviewUrl(null)
      onUploadComplete('')
    } catch (error: any) {
      setError(error.message || 'Error al eliminar imagen')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || undefined} />
          <AvatarFallback>
            <Upload className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        JPG, PNG o WebP. Máximo 5MB.
      </p>
    </div>
  )
}
```

Install required package:
```bash
npm install lucide-react
```

### 7.2 Update Profile Edit Page with Avatar Upload

Update `app/profile/edit/page.tsx` to include avatar upload:

```typescript
// Add to imports
import { AvatarUpload } from '@/components/profile/AvatarUpload'

// Add state
const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
const [userId, setUserId] = useState<string | null>(null)

// Update loadProfile function
const loadProfile = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUserId(user.id)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    if (profile) {
      setValue('full_name', profile.full_name)
      setValue('phone', profile.phone)
      setValue('location_department', profile.location_department)
      setValue('location_city', profile.location_city)
      setAvatarUrl(profile.avatar_url)
    }
  } catch (error: any) {
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}

// Add avatar upload section in form (before full_name input)
{userId && (
  <AvatarUpload
    userId={userId}
    currentAvatarUrl={avatarUrl}
    onUploadComplete={(url) => setAvatarUrl(url)}
  />
)}
```

**✅ Phase 5 Complete Checklist:**
- [ ] Avatar upload component created
- [ ] Avatar upload works (can upload image)
- [ ] Avatar preview works
- [ ] Avatar remove works
- [ ] File validation works (type, size)
- [ ] Profile edit page updated with avatar
- [ ] Storage policies tested
- [ ] Code committed to git

---

## 8. Phase 6: Protected Routes

**Duration:** Day 9 (4-6 hours)  
**Goal:** Implement auth middleware and protected routes

### 8.1 Create Auth Middleware

Create `middleware.ts` in project root:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ['/profile/edit', '/products/new', '/chat']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to home if authenticated and trying to access auth pages
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 8.2 Create User Menu Component

Create `components/layout/UserMenu.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, Settings, LogOut } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profile)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost">Iniciar Sesión</Button>
        </Link>
        <Link href="/register">
          <Button>Registrarse</Button>
        </Link>
      </div>
    )
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Usuario'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.id}`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 8.3 Update Header Component

Update `components/layout/Header.tsx`:

```typescript
import Link from 'next/link'
import { UserMenu } from './UserMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">Telopillo</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Inicio
          </Link>
          <Link
            href="/search"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Buscar
          </Link>
          <Link
            href="/products/new"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Publicar
          </Link>

          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
```

**✅ Phase 6 Complete Checklist:**
- [ ] Auth middleware created
- [ ] Protected routes redirect to login
- [ ] Login redirects back to intended page
- [ ] User menu component created
- [ ] Header updated with user menu
- [ ] Logout works correctly
- [ ] Auth state persists on refresh
- [ ] Code committed to git

---

## 9. Phase 7: Testing & Polish

**Duration:** Day 10 (6-8 hours)  
**Goal:** Test all features and fix bugs

### 9.1 Manual Testing Checklist

**Authentication**
- [ ] Register with email works
- [ ] Email verification email sent
- [ ] Login with email works
- [ ] Login with Google works
- [ ] Login with Facebook works
- [ ] Forgot password works
- [ ] Reset password works
- [ ] Logout works

**Profile Management**
- [ ] Profile auto-created on registration
- [ ] Can view public profile
- [ ] Can edit own profile
- [ ] Location selector works
- [ ] Avatar upload works
- [ ] Avatar remove works
- [ ] Profile updates save correctly

**Protected Routes**
- [ ] Protected routes redirect to login
- [ ] Login redirects back to intended page
- [ ] Auth state persists on refresh
- [ ] User menu shows correct info

**Security**
- [ ] Cannot edit other user's profile
- [ ] RLS policies working
- [ ] JWT tokens in httpOnly cookies
- [ ] No sensitive data exposed

**UI/UX**
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Loading states show correctly
- [ ] Error messages display properly
- [ ] Success messages show
- [ ] Forms validate correctly

### 9.2 Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 9.3 Performance Testing

```bash
# Run Lighthouse audit
npm run build
npm start
# Open Chrome DevTools → Lighthouse → Run audit
```

Target scores:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### 9.4 Bug Fixes

Document and fix any bugs found during testing.

### 9.5 Code Quality

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Format code
npm run format
```

### 9.6 Documentation

Update README with:
- How to set up OAuth
- How to run migrations
- How to test auth flow

**✅ Phase 7 Complete Checklist:**
- [ ] All manual tests passed
- [ ] All browsers tested
- [ ] Lighthouse scores >90
- [ ] All bugs fixed
- [ ] Code quality checks passed
- [ ] Documentation updated
- [ ] Final commit to git

---

## 10. Troubleshooting Guide

### Issue 1: OAuth Not Working

**Symptoms:** OAuth redirect fails or shows error

**Solutions:**
1. Check redirect URLs in provider console match Supabase
2. Verify client ID/secret are correct
3. Check if provider is enabled in Supabase dashboard
4. Test with incognito window (clear cookies)

### Issue 2: Profile Not Auto-Created

**Symptoms:** User registered but no profile in database

**Solutions:**
1. Check if trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
2. Check trigger function: `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'`
3. Test trigger manually:
   ```sql
   INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@test.com');
   SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'test@test.com');
   ```

### Issue 3: RLS Policy Errors

**Symptoms:** "Permission denied" or "Row level security policy violation"

**Solutions:**
1. Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles'`
2. List policies: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
3. Test policy:
   ```sql
   SET ROLE authenticated;
   SET request.jwt.claims TO '{"sub": "user-id-here"}';
   SELECT * FROM profiles WHERE id = 'user-id-here';
   ```

### Issue 4: Avatar Upload Fails

**Symptoms:** Upload returns error or image doesn't appear

**Solutions:**
1. Check if bucket exists in Supabase dashboard
2. Verify bucket is public
3. Check storage policies
4. Verify file size < 5MB
5. Check file type is image/*

### Issue 5: Middleware Redirect Loop

**Symptoms:** Page keeps redirecting

**Solutions:**
1. Check middleware matcher config
2. Verify protected routes list
3. Check if auth state is being set correctly
4. Clear cookies and try again

---

## 11. Verification Checklist

### Database
- [ ] profiles table exists with correct schema
- [ ] RLS policies applied and tested
- [ ] Triggers working (auto-create profile)
- [ ] Storage bucket created with policies
- [ ] Indexes created for performance

### Authentication
- [ ] Email/password registration works
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Facebook OAuth works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Logout works

### Profile Management
- [ ] Can view public profile
- [ ] Can edit own profile
- [ ] Avatar upload works
- [ ] Location selector works
- [ ] Profile updates save correctly

### Security
- [ ] RLS policies prevent unauthorized access
- [ ] JWT tokens in httpOnly cookies
- [ ] Cannot edit other user's profile
- [ ] No sensitive data exposed in API

### UI/UX
- [ ] All pages responsive
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] Success messages show
- [ ] Forms validate correctly

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code formatted with Prettier
- [ ] All files committed to git

### Documentation
- [ ] README updated
- [ ] API documented
- [ ] User guide created
- [ ] Admin guide created

---

## 12. Next Steps

After completing M1, proceed to:

**M2: Product Listings**
- Use authenticated user ID for product ownership
- Use profile data for seller info
- Use avatar in product cards

**Dependencies for M2:**
- User authentication (M1) ✅
- User profiles (M1) ✅
- Avatar upload (M1) ✅

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Ready for Implementation

Good luck with the implementation! 🚀
