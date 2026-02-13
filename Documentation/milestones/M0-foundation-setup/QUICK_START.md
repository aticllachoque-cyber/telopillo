# M0 Quick Start Guide

**Goal:** Get from zero to a working Next.js + Supabase development environment in under 2 hours.

---

## ⚡ Prerequisites (5 minutes)

```bash
# Verify you have the required software
node --version   # Should be 18+
npm --version    # Should be 9+
git --version    # Should be 2.30+

# Install Supabase CLI
npm install -g supabase
supabase --version
```

**Accounts needed:**
- ✅ Supabase account → [Sign up](https://supabase.com)
- ✅ GitHub account (optional) → [Sign up](https://github.com)

---

## 🚀 Phase 1: Initialize Project (30 minutes)

### Step 1: Create Next.js Project

```bash
cd ~/Documents/personal-projects

npx create-next-app@latest telopillo.com \
  --typescript \
  --tailwind \
  --app \
  --use-npm

# When prompted:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ src/ directory? No
# ✔ App Router? Yes
# ✔ Import alias? Yes (@/*)

cd telopillo.com
```

### Step 2: Install shadcn/ui

```bash
npx shadcn-ui@latest init

# Choose: Default style, Slate color, CSS variables: yes

# Install common components
npx shadcn-ui@latest add button input card avatar dropdown-menu
```

### Step 3: Create Project Structure

```bash
mkdir -p components/{ui,layout,shared}
mkdir -p lib/supabase
mkdir -p types
mkdir -p supabase/{migrations,functions}
mkdir -p Documentation

touch lib/utils.ts lib/constants.ts types/index.ts
```

### Step 4: Configure TypeScript (Strict Mode)

Edit `tsconfig.json` and add these to `compilerOptions`:

```json
{
  "compilerOptions": {
    // ... existing config ...
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Step 5: Test

```bash
npm run dev
# Open http://localhost:3000 - should see Next.js welcome page
```

✅ **Checkpoint:** Next.js app running on localhost:3000

---

## 🗄️ Phase 2: Supabase Setup (30 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - Name: `telopillo-bo`
   - Database Password: (generate and SAVE IT!)
   - Region: South America (São Paulo)
   - Plan: Free
4. Wait 2-3 minutes for creation

### Step 2: Get Credentials

In Supabase Dashboard → Settings → API, copy:
- Project URL
- anon public key
- service_role key

### Step 3: Configure Environment

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# Create example file
cp .env.local .env.example
# Edit .env.example and replace real values with placeholders
```

### Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 5: Create Supabase Clients

**File: `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File: `lib/supabase/server.ts`**

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
            // Ignore errors from Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}
```

### Step 6: Test Connection

**File: `app/api/test/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    
    if (error && error.code !== 'PGRST116') throw error
    
    return NextResponse.json({ success: true, message: 'Connected!' })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
```

```bash
npm run dev
curl http://localhost:3000/api/test
# Should return: {"success":true,"message":"Connected!"}
```

### Step 7: Configure Supabase

**In Supabase Dashboard:**

1. **Database → Extensions** - Enable:
   - `uuid-ossp`
   - `pgcrypto`
   - `pg_trgm`

2. **Storage → Buckets** - Create:
   - `product-images` (public, 5MB limit)
   - `avatars` (public, 2MB limit)

3. **Authentication → URL Configuration** - Add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`

✅ **Checkpoint:** Supabase connected and configured

---

## 🛠️ Phase 3: Development Tools (20 minutes)

### Step 1: Install Tools

```bash
npm install --save-dev \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier \
  prettier \
  husky \
  lint-staged
```

### Step 2: Configure Prettier

**File: `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Step 3: Configure ESLint

**File: `.eslintrc.json`**

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Step 4: Set Up Git Hooks

```bash
npx husky init
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF
chmod +x .husky/pre-commit
```

**Add to `package.json`:**

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  },
  "scripts": {
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

### Step 5: Test

```bash
npm run format
npm run lint
npm run type-check
npm run build
```

✅ **Checkpoint:** All quality checks pass

---

## 🎨 Phase 4: Base Layout (20 minutes)

### Step 1: Create Header

**File: `components/layout/Header.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Telopillo.bo
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/buscar">Buscar</Link>
          <Link href="/categorias">Categorías</Link>
        </nav>
        <Button asChild>
          <Link href="/publicar">Publicar</Link>
        </Button>
      </div>
    </header>
  )
}
```

### Step 2: Create Footer

**File: `components/layout/Footer.tsx`**

```typescript
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold mb-3">Telopillo.bo</h3>
            <p className="text-sm text-muted-foreground">
              Lo que buscás, ¡telopillo!
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/acerca">Acerca de</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terminos">Términos</Link></li>
              <li><Link href="/privacidad">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Telopillo.bo
        </div>
      </div>
    </footer>
  )
}
```

### Step 3: Update Layout

**File: `app/layout.tsx`**

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### Step 4: Create Home Page

**File: `app/page.tsx`**

```typescript
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-12">
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold sm:text-6xl">
          Lo que buscás, <span className="text-primary">¡telopillo!</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          El marketplace boliviano donde comprás y vendés de todo.
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
    </div>
  )
}
```

### Step 5: Test

```bash
npm run dev
# Open http://localhost:3000
# Check header, footer, and responsive design
```

✅ **Checkpoint:** Layout renders correctly

---

## ✅ Final Verification (10 minutes)

Run all checks:

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Formatting
npm run format:check

# 4. Build
npm run build

# 5. Supabase connection
curl http://localhost:3000/api/test

# 6. Visual check
npm run dev
# Open http://localhost:3000 and verify layout
```

---

## 🎉 Success!

You now have:
- ✅ Next.js 14 with TypeScript
- ✅ Supabase connected
- ✅ Base layout (Header + Footer)
- ✅ Development tools configured
- ✅ Quality checks passing

---

## 📚 Next Steps

1. **Read full documentation:**
   - [PRD.md](./PRD.md) - Complete requirements
   - [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed guide

2. **Add documentation:**
   - Create README.md
   - Create CONTRIBUTING.md
   - Create STRUCTURE.md

3. **Initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "feat(m0): initialize project foundation"
   ```

4. **Move to M1:**
   - [M1: Authentication & Profiles](../M1-authentication-profiles/README.md)

---

## 🆘 Troubleshooting

**Supabase connection fails?**
- Check `.env.local` has correct credentials
- Verify Supabase project is not paused

**TypeScript errors?**
- Run `npm run build` to see all errors
- Restart TypeScript server in VS Code

**Port 3000 in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**More help:** See [IMPLEMENTATION_PLAN.md - Troubleshooting](./IMPLEMENTATION_PLAN.md#8-troubleshooting-guide)

---

**Time to complete:** ~2 hours  
**Difficulty:** Low-Medium  
**Last updated:** February 12, 2026
