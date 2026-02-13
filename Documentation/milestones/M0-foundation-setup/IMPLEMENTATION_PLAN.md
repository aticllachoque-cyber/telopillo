# Implementation Plan - Milestone 0: Foundation & Setup

**Version:** 1.0  
**Date:** February 12, 2026  
**Author:** Alcides Cardenas  
**Estimated Duration:** 5-7 days  
**Status:** Ready to Execute

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Phase 1: Project Initialization](#3-phase-1-project-initialization)
4. [Phase 2: Supabase Setup](#4-phase-2-supabase-setup)
5. [Phase 3: Development Tools](#5-phase-3-development-tools)
6. [Phase 4: Base Layout](#6-phase-4-base-layout)
7. [Phase 5: Testing & Validation](#7-phase-5-testing--validation)
8. [Troubleshooting Guide](#8-troubleshooting-guide)
9. [Verification Checklist](#9-verification-checklist)

---

## 1. Overview

This implementation plan provides step-by-step instructions to complete Milestone 0: Foundation & Setup. Follow the phases sequentially, as each phase builds upon the previous one.

### 1.1 Timeline

```
Day 1-2: Phase 1 (Project Initialization)
Day 3-4: Phase 2 (Supabase Setup)
Day 5:   Phase 3 (Development Tools)
Day 6:   Phase 4 (Base Layout)
Day 7:   Phase 5 (Testing & Validation)
```

### 1.2 Key Principles

- **Verify each step** before moving to the next
- **Document issues** encountered and solutions
- **Test incrementally** - don't wait until the end
- **Commit frequently** with clear messages

---

## 2. Prerequisites

### 2.1 Required Software

Install the following before starting:

```bash
# Check Node.js version (must be 18+)
node --version  # Should show v18.x.x or higher

# Check npm version (must be 9+)
npm --version   # Should show 9.x.x or higher

# Check Git version
git --version   # Should show 2.30+ or higher

# Install Supabase CLI globally
npm install -g supabase
supabase --version
```

### 2.2 Required Accounts

Create accounts on:
- [Supabase](https://supabase.com) - Free tier
- [GitHub](https://github.com) - For repository
- [Vercel](https://vercel.com) - Free tier (for future deployment)

### 2.3 Recommended IDE Setup (VS Code)

Install VS Code extensions:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- TypeScript Vue Plugin (Volar) (`Vue.volar`)

VS Code settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 3. Phase 1: Project Initialization

**Duration:** 1-2 days  
**Goal:** Create Next.js project with TypeScript and Tailwind CSS

### 3.1 Initialize Next.js Project

```bash
# Navigate to your projects directory
cd ~/Documents/personal-projects

# Create Next.js 14 project with TypeScript
npx create-next-app@latest telopillo.com --typescript --tailwind --app --use-npm

# When prompted, choose:
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … No
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias (@/*)? … Yes
# ✔ What import alias would you like configured? … @/*

# Navigate into project
cd telopillo.com

# Verify installation
npm run dev
# Open http://localhost:3000 - should see Next.js welcome page
```

**✅ Verification:** Next.js app runs on `localhost:3000`

### 3.2 Initialize Git Repository

```bash
# Initialize Git (if not already done by create-next-app)
git init

# Create .gitignore (should already exist, but verify it includes:)
cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# supabase
.supabase
EOF

# Initial commit
git add .
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind CSS"
```

**✅ Verification:** Git repository initialized with initial commit

### 3.3 Configure TypeScript (Strict Mode)

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    },
    // Additional strict checks
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**✅ Verification:** Run `npm run build` - should succeed with no TypeScript errors

### 3.4 Create Project Structure

```bash
# Create directory structure
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/shared
mkdir -p lib/supabase
mkdir -p types
mkdir -p supabase/migrations
mkdir -p supabase/functions
mkdir -p Documentation

# Create placeholder files
touch lib/utils.ts
touch lib/constants.ts
touch types/index.ts
```

**✅ Verification:** Directory structure matches PRD specification

### 3.5 Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# When prompted, choose:
# ✔ Would you like to use TypeScript (recommended)? … yes
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Where is your global CSS file? … app/globals.css
# ✔ Would you like to use CSS variables for colors? … yes
# ✔ Where is your tailwind.config.js located? … tailwind.config.ts
# ✔ Configure the import alias for components: … @/components
# ✔ Configure the import alias for utils: … @/lib/utils
# ✔ Are you using React Server Components? … yes

# Install commonly used components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
```

**✅ Verification:** shadcn/ui components installed in `components/ui/`

### 3.6 Configure Tailwind CSS

Edit `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

**✅ Verification:** Tailwind classes work in components

### 3.7 Commit Phase 1

```bash
git add .
git commit -m "feat(m0): configure TypeScript strict mode, project structure, and shadcn/ui"
```

---

## 4. Phase 2: Supabase Setup

**Duration:** 1-2 days  
**Goal:** Configure Supabase project and integrate with Next.js

### 4.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in details:
   - **Name:** telopillo-bo
   - **Database Password:** (generate strong password - SAVE THIS!)
   - **Region:** South America (São Paulo) - closest to Bolivia
   - **Pricing Plan:** Free
4. Click "Create new project"
5. Wait 2-3 minutes for project to be created

**✅ Verification:** Supabase project dashboard is accessible

### 4.2 Get Supabase Credentials

In Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

**✅ Verification:** All three credentials copied

### 4.3 Configure Environment Variables

```bash
# Create .env.local file
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# Create .env.example (template for other developers)
cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF
```

**⚠️ IMPORTANT:** Replace placeholder values in `.env.local` with your actual Supabase credentials

**✅ Verification:** `.env.local` contains real credentials, `.env.example` contains placeholders

### 4.4 Install Supabase Client

```bash
# Install Supabase JavaScript client
npm install @supabase/supabase-js

# Install Supabase SSR helpers for Next.js
npm install @supabase/ssr
```

**✅ Verification:** Packages installed successfully

### 4.5 Create Supabase Client Utilities

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  await supabase.auth.getUser()

  return response
}
```

Create `middleware.ts` in project root:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**✅ Verification:** Supabase client files created

### 4.6 Test Supabase Connection

Create `app/api/test-supabase/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test database connection
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (expected for now)
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      connected: true
    })
  } catch (error) {
    console.error('Supabase connection error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Supabase connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

Test the connection:

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/test-supabase

# Should return: {"success":true,"message":"Supabase connection successful","connected":true}
```

**✅ Verification:** API returns success response

### 4.7 Configure Supabase Database Extensions

In Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Enable the following extensions:
   - `uuid-ossp` (UUID generation)
   - `pgcrypto` (encryption)
   - `pg_trgm` (trigram similarity for search)

**✅ Verification:** Extensions enabled in Supabase dashboard

### 4.8 Configure Supabase Authentication

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure **Email Templates** (optional for now)
4. Go to **Authentication** → **URL Configuration**
5. Add **Redirect URLs:**
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (for development)

**✅ Verification:** Email auth enabled, redirect URLs configured

### 4.9 Configure Supabase Storage

In Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Create new bucket:
   - **Name:** `product-images`
   - **Public:** Yes
   - **File size limit:** 5MB
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp`
3. Create another bucket:
   - **Name:** `avatars`
   - **Public:** Yes
   - **File size limit:** 2MB
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp`

**✅ Verification:** Both storage buckets created

### 4.10 Test Storage Upload

Create `app/api/test-storage/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Create a test file
    const testContent = 'Test file content'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    // Upload test file
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Storage upload successful',
      path: data.path,
      url: urlData.publicUrl
    })
  } catch (error) {
    console.error('Storage upload error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Storage upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

Test storage:

```bash
curl http://localhost:3000/api/test-storage
# Should return success with file path and URL
```

**✅ Verification:** File uploaded successfully to Supabase Storage

### 4.11 Initialize Supabase CLI (Local Development)

```bash
# Login to Supabase CLI
supabase login

# Initialize Supabase in project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref
# Find project-ref in Supabase Dashboard → Settings → General → Reference ID

# Pull remote schema (if any)
supabase db pull
```

**✅ Verification:** Supabase CLI linked to remote project

### 4.12 Commit Phase 2

```bash
git add .
git commit -m "feat(m0): integrate Supabase (database, auth, storage)"
```

---

## 5. Phase 3: Development Tools

**Duration:** 1 day  
**Goal:** Configure ESLint, Prettier, and Git hooks

### 5.1 Configure ESLint

Edit `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { "prefer": "type-imports" }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

Install ESLint dependencies:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

**✅ Verification:** Run `npm run lint` - should pass

### 5.2 Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```
node_modules
.next
out
build
dist
.supabase
*.md
```

Install Prettier:

```bash
npm install --save-dev prettier
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

**✅ Verification:** Run `npm run format` - files formatted

### 5.3 Configure Husky (Git Hooks)

```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

chmod +x .husky/pre-commit
```

Add lint-staged configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

**✅ Verification:** Make a test commit - hooks should run

### 5.4 Add NPM Scripts

Update `package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "echo \"No tests yet\" && exit 0",
    "prepare": "husky install"
  }
}
```

**✅ Verification:** All scripts run successfully

### 5.5 Commit Phase 3

```bash
git add .
git commit -m "feat(m0): configure ESLint, Prettier, and Husky git hooks"
```

---

## 6. Phase 4: Base Layout

**Duration:** 1 day  
**Goal:** Create Header and Footer components

### 6.1 Create Header Component

Create `components/layout/Header.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Search } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = false // TODO: Replace with actual auth state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Telopillo.bo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
          <Link
            href="/buscar"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Buscar
          </Link>
          <Link
            href="/categorias"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Categorías
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button asChild>
            <Link href="/publicar">Publicar</Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mis-publicaciones">Mis Publicaciones</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mensajes">Mensajes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 space-y-3">
            <Link
              href="/buscar"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Buscar
            </Link>
            <Link
              href="/categorias"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Categorías
            </Link>
            <Link
              href="/publicar"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Publicar
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/perfil"
                  className="block text-sm font-medium transition-colors hover:text-primary"
                >
                  Perfil
                </Link>
                <Link
                  href="/mensajes"
                  className="block text-sm font-medium transition-colors hover:text-primary"
                >
                  Mensajes
                </Link>
                <button className="block text-sm font-medium transition-colors hover:text-primary">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-sm font-medium transition-colors hover:text-primary"
              >
                Iniciar Sesión
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
```

**✅ Verification:** Header component created

### 6.2 Create Footer Component

Create `components/layout/Footer.tsx`:

```typescript
import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold">Telopillo.bo</h3>
            <p className="text-sm text-muted-foreground">
              Lo que buscás, ¡telopillo!
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/acerca" className="text-muted-foreground hover:text-primary">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-primary">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ayuda" className="text-muted-foreground hover:text-primary">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/seguridad" className="text-muted-foreground hover:text-primary">
                  Seguridad
                </Link>
              </li>
              <li>
                <Link href="/reportar" className="text-muted-foreground hover:text-primary">
                  Reportar Problema
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terminos" className="text-muted-foreground hover:text-primary">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-muted-foreground hover:text-primary">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-primary">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Telopillo.bo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
```

**✅ Verification:** Footer component created

### 6.3 Update Root Layout

Edit `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Telopillo.bo - Marketplace Boliviano',
  description: 'Lo que buscás, ¡telopillo!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
```

**✅ Verification:** Layout includes Header and Footer

### 6.4 Create Example Home Page

Edit `app/page.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Lo que buscás, <span className="text-primary">¡telopillo!</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          El marketplace boliviano donde comprás y vendés de todo, fácil y rápido.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/buscar">Buscar Productos</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/publicar">Publicar Gratis</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">¿Por qué Telopillo.bo?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Publicá Gratis</CardTitle>
              <CardDescription>
                Publicá tus productos sin costo y llegá a miles de compradores
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Búsqueda Inteligente</CardTitle>
              <CardDescription>
                Encontrá lo que buscás rápido con nuestra búsqueda avanzada
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Chat Directo</CardTitle>
              <CardDescription>
                Hablá directamente con vendedores y compradores
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">¿Listo para empezar?</CardTitle>
            <CardDescription>
              Creá tu cuenta gratis y comenzá a comprar o vender hoy mismo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" asChild>
              <Link href="/registro">Crear Cuenta Gratis</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
```

**✅ Verification:** Home page displays with Header and Footer

### 6.5 Test Responsive Layout

Test the layout on different screen sizes:

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Test on:
# - Desktop (1920x1080)
# - Tablet (768x1024)
# - Mobile (375x667)
```

Use browser DevTools to test responsive breakpoints.

**✅ Verification:** Layout is responsive on all screen sizes

### 6.6 Commit Phase 4

```bash
git add .
git commit -m "feat(m0): create Header and Footer components with responsive layout"
```

---

## 7. Phase 5: Testing & Validation

**Duration:** 1 day  
**Goal:** Verify all components work and document setup

### 7.1 Run All Quality Checks

```bash
# Type checking
npm run type-check
# Should pass with no errors

# Linting
npm run lint
# Should pass with no errors

# Formatting check
npm run format:check
# Should pass with no errors

# Build
npm run build
# Should succeed

# Start production build
npm run start
# Should run on localhost:3000
```

**✅ Verification:** All checks pass

### 7.2 Test Supabase Integration

Test all Supabase features:

```bash
# Test database connection
curl http://localhost:3000/api/test-supabase

# Test storage upload
curl http://localhost:3000/api/test-storage
```

**✅ Verification:** All API tests return success

### 7.3 Create README.md

Create comprehensive `README.md`:

```markdown
# Telopillo.bo - Marketplace Boliviano

**Lo que buscás, ¡telopillo!**

Telopillo.bo is a Bolivian marketplace platform where anyone can buy and sell products easily and quickly.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Vercel (Frontend), Supabase (Backend)

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))
- Supabase account ([Sign up](https://supabase.com))

## Quick Start

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/your-username/telopillo.com.git
cd telopillo.com
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your Supabase credentials in `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

### 4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

\`\`\`
telopillo.com/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth-related pages
│   ├── (marketplace)/     # Main marketplace pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── shared/           # Shared components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client & helpers
│   ├── utils.ts          # General utilities
│   └── constants.ts      # App constants
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── supabase/              # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge functions
└── Documentation/         # Project documentation
\`\`\`

## Supabase Setup

### Local Development

1. Install Supabase CLI:

\`\`\`bash
npm install -g supabase
\`\`\`

2. Login to Supabase:

\`\`\`bash
supabase login
\`\`\`

3. Link to your project:

\`\`\`bash
supabase link --project-ref your-project-ref
\`\`\`

4. Pull remote schema:

\`\`\`bash
supabase db pull
\`\`\`

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [telopillo.bo](https://telopillo.bo)
- Email: contacto@telopillo.bo

---

Made with ❤️ in Bolivia
\`\`\`

**✅ Verification:** README.md created

### 7.4 Create CONTRIBUTING.md

Create `CONTRIBUTING.md`:

```markdown
# Contributing to Telopillo.bo

Thank you for your interest in contributing to Telopillo.bo! This document provides guidelines for contributing to the project.

## Development Workflow

### 1. Fork and Clone

Fork the repository and clone it locally:

\`\`\`bash
git clone https://github.com/your-username/telopillo.com.git
cd telopillo.com
\`\`\`

### 2. Create a Branch

Create a new branch for your feature or bugfix:

\`\`\`bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
\`\`\`

### 3. Make Changes

- Follow the existing code style
- Write clear, concise commit messages
- Add tests if applicable
- Update documentation if needed

### 4. Run Quality Checks

Before committing, ensure all checks pass:

\`\`\`bash
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run format      # Prettier
npm run build       # Build test
\`\`\`

### 5. Commit Changes

Commit your changes with a descriptive message:

\`\`\`bash
git add .
git commit -m "feat: add new feature"
\`\`\`

Commit message format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 6. Push and Create Pull Request

\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Then create a pull request on GitHub.

## Code Style

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types when possible
- Use type imports: `import type { Type } from 'module'`
- Define interfaces for component props

### React

- Use functional components with hooks
- Use Server Components by default (Next.js 14)
- Add 'use client' directive only when needed
- Keep components small and focused

### Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserData()`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Files: kebab-case for non-components (`user-utils.ts`)

### File Organization

- One component per file
- Co-locate related files (component + styles + tests)
- Use index files for cleaner imports

## Git Hooks

Pre-commit hooks will automatically:
- Run ESLint on staged files
- Format code with Prettier
- Run TypeScript type checking

## Questions?

If you have questions, please open an issue or contact the maintainers.

Thank you for contributing! 🎉
\`\`\`

**✅ Verification:** CONTRIBUTING.md created

### 7.5 Create STRUCTURE.md

Create `Documentation/STRUCTURE.md`:

```markdown
# Project Structure

This document explains the organization of the Telopillo.bo codebase.

## Directory Structure

\`\`\`
telopillo.com/
├── app/                    # Next.js 14 App Router
├── components/            # React components
├── lib/                   # Utility functions and helpers
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── supabase/              # Supabase configuration
└── Documentation/         # Project documentation
\`\`\`

## Detailed Breakdown

### `/app` - Next.js App Router

Next.js 14 uses the App Router for file-based routing.

\`\`\`
app/
├── (auth)/               # Auth route group (login, register)
├── (marketplace)/        # Main marketplace routes
├── api/                  # API routes
├── layout.tsx            # Root layout (Header, Footer)
├── page.tsx              # Home page (/)
└── globals.css           # Global styles
\`\`\`

**Route Groups:** Folders in parentheses `(auth)` don't affect the URL structure but help organize related routes.

### `/components` - React Components

Reusable React components organized by type.

\`\`\`
components/
├── ui/                   # shadcn/ui components (Button, Input, etc.)
├── layout/               # Layout components (Header, Footer)
└── shared/               # Shared components (SearchBar, ProductCard, etc.)
\`\`\`

**Naming Convention:** PascalCase for component files (`Header.tsx`)

### `/lib` - Utilities and Helpers

Utility functions, constants, and helper modules.

\`\`\`
lib/
├── supabase/             # Supabase client and helpers
│   ├── client.ts         # Browser client
│   ├── server.ts         # Server client
│   └── middleware.ts     # Middleware helper
├── utils.ts              # General utility functions
└── constants.ts          # App-wide constants
\`\`\`

### `/types` - TypeScript Types

Shared TypeScript type definitions and interfaces.

\`\`\`
types/
├── index.ts              # Main types export
├── database.ts           # Database types (from Supabase)
├── product.ts            # Product-related types
└── user.ts               # User-related types
\`\`\`

### `/public` - Static Assets

Static files served directly by Next.js.

\`\`\`
public/
├── images/               # Image assets
├── icons/                # Icon files
└── favicon.ico           # Favicon
\`\`\`

### `/supabase` - Supabase Configuration

Supabase-specific files for database migrations and edge functions.

\`\`\`
supabase/
├── migrations/           # Database migration files
├── functions/            # Supabase Edge Functions
└── config.toml           # Supabase configuration
\`\`\`

### `/Documentation` - Project Documentation

All project documentation files.

\`\`\`
Documentation/
├── PRD.md                # Product Requirements Document
├── ARCHITECTURE.md       # System architecture
├── STRUCTURE.md          # This file
└── milestones/           # Milestone-specific docs
\`\`\`

## Import Aliases

The project uses path aliases for cleaner imports:

\`\`\`typescript
// Instead of:
import { Button } from '../../../components/ui/button'

// Use:
import { Button } from '@/components/ui/button'
\`\`\`

**Configured in:** `tsconfig.json` → `paths` → `@/*`

## Component Patterns

### Server Components (Default)

By default, all components in Next.js 14 are Server Components:

\`\`\`typescript
// app/page.tsx
export default function Page() {
  return <div>Server Component</div>
}
\`\`\`

### Client Components

Add `'use client'` directive when you need:
- React hooks (useState, useEffect, etc.)
- Browser APIs
- Event handlers

\`\`\`typescript
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\`

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `UserProfile.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `Product.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| API Routes | kebab-case | `create-product/route.ts` |

## Adding New Features

When adding a new feature:

1. **Create route** in `/app`
2. **Create components** in `/components`
3. **Add types** in `/types`
4. **Add utilities** in `/lib`
5. **Update documentation**

Example: Adding a "Favorites" feature

\`\`\`
1. Create app/favoritos/page.tsx
2. Create components/shared/FavoriteButton.tsx
3. Add types/favorite.ts
4. Add lib/favorites.ts
5. Update Documentation/
\`\`\`

## Questions?

If you have questions about the project structure, please open an issue or contact the maintainers.
\`\`\`

**✅ Verification:** STRUCTURE.md created

### 7.6 Final Testing Checklist

Go through the complete checklist:

```bash
# 1. Clean install test
rm -rf node_modules package-lock.json
npm install
npm run dev

# 2. Type checking
npm run type-check

# 3. Linting
npm run lint

# 4. Formatting
npm run format:check

# 5. Build
npm run build

# 6. Supabase connection
curl http://localhost:3000/api/test-supabase

# 7. Storage upload
curl http://localhost:3000/api/test-storage

# 8. Git hooks
# Make a test change and commit
echo "// test" >> lib/utils.ts
git add lib/utils.ts
git commit -m "test: verify git hooks"
# Should run lint-staged
git reset HEAD~1  # Undo test commit
git checkout lib/utils.ts  # Revert test change
```

**✅ Verification:** All tests pass

### 7.7 Final Commit

```bash
git add .
git commit -m "docs(m0): add comprehensive documentation (README, CONTRIBUTING, STRUCTURE)"
```

---

## 8. Troubleshooting Guide

### Common Issues and Solutions

#### Issue: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Supabase connection fails

**Symptoms:** API test returns error

**Solution:**
1. Verify `.env.local` has correct credentials
2. Check Supabase project is not paused (free tier)
3. Verify network connection
4. Check Supabase status: https://status.supabase.com

#### Issue: TypeScript errors after installation

**Solution:**
```bash
# Restart TypeScript server (VS Code)
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

#### Issue: ESLint errors

**Solution:**
```bash
# Auto-fix errors
npm run lint:fix

# If errors persist, check .eslintrc.json configuration
```

#### Issue: Git hooks not running

**Solution:**
```bash
# Reinstall Husky
npm uninstall husky
npm install --save-dev husky
npx husky install

# Verify .husky/pre-commit exists and is executable
chmod +x .husky/pre-commit
```

#### Issue: Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### Issue: Supabase CLI not found

**Solution:**
```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version

# If still not found, add to PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

---

## 9. Verification Checklist

### Setup Verification

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git installed
- [ ] Supabase CLI installed
- [ ] Supabase account created
- [ ] GitHub repository created (optional)

### Project Initialization

- [ ] Next.js 14 project created
- [ ] TypeScript configured (strict mode)
- [ ] Tailwind CSS working
- [ ] shadcn/ui components installed
- [ ] Project structure created
- [ ] Git repository initialized

### Supabase Integration

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Supabase client installed
- [ ] Database connection works
- [ ] Authentication configured
- [ ] Storage buckets created
- [ ] Supabase CLI linked

### Development Tools

- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Husky git hooks working
- [ ] lint-staged configured
- [ ] All npm scripts work

### Base Layout

- [ ] Header component created
- [ ] Footer component created
- [ ] Root layout updated
- [ ] Home page created
- [ ] Responsive design works

### Documentation

- [ ] README.md created
- [ ] CONTRIBUTING.md created
- [ ] STRUCTURE.md created
- [ ] .env.example created

### Quality Checks

- [ ] `npm run dev` works
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run format:check` passes
- [ ] API test endpoints work
- [ ] Git hooks run on commit

### Final Validation

- [ ] Can clone repo and start in < 15 minutes
- [ ] All documentation is clear
- [ ] No secrets in repository
- [ ] All acceptance criteria met

---

## 10. Next Steps

After completing M0, proceed to:

**Milestone 1: Authentication & Profiles**
- Design database schema
- Implement authentication UI
- Create user profile system

See: `Documentation/milestones/M1-authentication-profiles/`

---

## Appendix A: Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run type-check       # TypeScript check

# Supabase
supabase login           # Login to Supabase
supabase link            # Link to project
supabase db pull         # Pull remote schema
supabase db push         # Push local migrations
supabase functions new   # Create edge function

# Git
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to remote
```

---

## Appendix B: Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret!) | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

**⚠️ Security Note:** Never commit `.env.local` to Git. Only commit `.env.example` with placeholder values.

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** ✅ Ready to Execute
