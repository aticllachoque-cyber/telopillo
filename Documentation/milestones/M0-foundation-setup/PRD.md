# PRD - Milestone 0: Foundation & Setup

**Version:** 1.0  
**Date:** February 12, 2026  
**Author:** Alcides Cardenas  
**Status:** Ready for Implementation  
**Milestone Duration:** Week 1  
**Priority:** P0 (Blocker for all other milestones)

---

## 1. Executive Summary

This milestone establishes the foundational infrastructure for Telopillo.bo marketplace. It includes setting up the development environment, configuring the core technology stack (Next.js 14 + Supabase), and establishing development workflows that will support all future milestones.

**Success means:** A fully functional development environment where developers can build features, with all core services (database, authentication, storage) properly configured and accessible.

---

## 2. Problem Statement

### 2.1 Current State
- No development environment exists
- No infrastructure is configured
- No code repository structure is established
- No development workflows are defined

### 2.2 Desired State
- Developers can clone the repository and start working within 15 minutes
- All core services (Supabase, Next.js) are configured and connected
- Development environment mirrors production architecture
- Code quality tools are enforced automatically
- Clear project structure enables scalable development

---

## 3. Goals & Objectives

### 3.1 Primary Goals
1. **Development Environment Ready**: Complete local development setup with hot-reload
2. **Supabase Integration**: Database, authentication, and storage configured
3. **Code Quality Foundation**: Linting, formatting, and type-checking enabled
4. **Project Structure**: Scalable folder organization established

### 3.2 Success Metrics
- [ ] Next.js app runs on `localhost:3000` with hot-reload
- [ ] Supabase connection established (can query database)
- [ ] Authentication flow works (can sign up/login via Supabase Auth)
- [ ] Environment variables properly configured
- [ ] TypeScript compilation succeeds with no errors
- [ ] ESLint and Prettier run without errors
- [ ] Git workflow documented and tested

---

## 4. Scope

### 4.1 In Scope

#### 4.1.1 Frontend Setup
- **Next.js 14 Project Initialization**
  - App Router (not Pages Router)
  - TypeScript configuration with strict mode
  - Tailwind CSS integration
  - shadcn/ui component library setup
  
- **Project Structure**
  ```
  telopillo.com/
  ├── app/                    # Next.js 14 App Router
  │   ├── (auth)/            # Auth-related pages
  │   ├── (marketplace)/     # Main marketplace pages
  │   ├── api/               # API routes
  │   ├── layout.tsx         # Root layout
  │   └── page.tsx           # Home page
  ├── components/            # Reusable React components
  │   ├── ui/               # shadcn/ui components
  │   ├── layout/           # Layout components (Header, Footer)
  │   └── shared/           # Shared components
  ├── lib/                   # Utility functions
  │   ├── supabase/         # Supabase client & helpers
  │   ├── utils.ts          # General utilities
  │   └── constants.ts      # App constants
  ├── types/                 # TypeScript type definitions
  ├── public/                # Static assets
  ├── supabase/              # Supabase configuration
  │   ├── migrations/       # Database migrations
  │   ├── functions/        # Edge functions
  │   └── config.toml       # Supabase config
  └── Documentation/         # Project documentation
  ```

- **Base Layout Components**
  - Header component (logo, navigation, user menu)
  - Footer component (links, copyright)
  - Container/wrapper components
  - Basic responsive layout

#### 4.1.2 Backend Setup (Supabase)
- **Supabase Project Configuration**
  - Create new Supabase project
  - Configure project settings
  - Set up database connection
  - Enable required extensions (pgvector, pg_trgm)

- **Authentication Setup**
  - Enable email/password authentication
  - Configure OAuth providers (Google, Facebook) - credentials only, no implementation
  - Set up JWT configuration
  - Configure redirect URLs

- **Storage Setup**
  - Create storage buckets (product-images, avatars)
  - Configure bucket policies
  - Set up image transformation settings

- **Supabase CLI Setup**
  - Install Supabase CLI locally
  - Initialize Supabase project locally
  - Configure local development environment
  - Test migration workflow

#### 4.1.3 Development Tools
- **Code Quality**
  - ESLint configuration (Next.js + TypeScript rules)
  - Prettier configuration (consistent formatting)
  - Husky for git hooks (pre-commit, pre-push)
  - lint-staged for staged files only

- **TypeScript Configuration**
  - Strict mode enabled
  - Path aliases configured (@/ for root)
  - Type checking for all files

- **Environment Variables**
  - `.env.local` template created
  - `.env.example` documented
  - Environment variable validation (zod schema)

#### 4.1.4 Git Workflow
- **Repository Setup**
  - Initialize Git repository
  - Create `.gitignore` (Next.js + Node.js template)
  - Set up branch protection rules (documentation)
  - Create initial commit

- **Branching Strategy**
  - `main` branch for production-ready code
  - `develop` branch for integration
  - Feature branches: `feature/milestone-X-description`
  - Hotfix branches: `hotfix/description`

### 4.2 Out of Scope
- ❌ Database schema design (covered in M1)
- ❌ Authentication UI implementation (covered in M1)
- ❌ Product listing features (covered in M2)
- ❌ Search functionality (covered in M3)
- ❌ Messaging system (covered in M4)
- ❌ Payment integration (covered in M5+)
- ❌ Deployment to production (covered in M11)
- ❌ CI/CD pipeline setup (covered in M11)

---

## 5. User Stories

### 5.1 Developer Stories

**US-M0-001: As a developer, I want to clone the repository and start the development server quickly**
- **Acceptance Criteria:**
  - Clone repository
  - Run `npm install` (completes in < 2 minutes)
  - Copy `.env.example` to `.env.local` and fill in Supabase credentials
  - Run `npm run dev`
  - Open `localhost:3000` and see the app running
  - **Time to first run:** < 15 minutes

**US-M0-002: As a developer, I want TypeScript to catch errors before runtime**
- **Acceptance Criteria:**
  - TypeScript strict mode enabled
  - All files type-checked
  - `npm run type-check` passes
  - IDE shows type errors in real-time

**US-M0-003: As a developer, I want code formatting to be automatic**
- **Acceptance Criteria:**
  - Prettier configured with team standards
  - Format on save enabled (IDE)
  - Pre-commit hook formats staged files
  - `npm run format` formats all files

**US-M0-004: As a developer, I want to connect to Supabase from my local environment**
- **Acceptance Criteria:**
  - Supabase client initialized
  - Can query database (test query works)
  - Can authenticate users (test auth works)
  - Can upload files to storage (test upload works)

**US-M0-005: As a developer, I want a consistent project structure**
- **Acceptance Criteria:**
  - Clear folder organization
  - Path aliases work (`@/components`, `@/lib`)
  - Import conventions documented
  - README explains structure

---

## 6. Technical Requirements

### 6.1 Frontend Requirements

#### 6.1.1 Next.js Configuration
```typescript
// next.config.js requirements
{
  reactStrictMode: true,
  images: {
    domains: ['supabase-project-id.supabase.co'], // Supabase storage
    formats: ['image/webp'], // WebP for optimization
  },
  experimental: {
    serverActions: true, // Enable Server Actions
  },
}
```

#### 6.1.2 TypeScript Configuration
```json
// tsconfig.json requirements
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 6.1.3 Tailwind CSS Configuration
```javascript
// tailwind.config.js requirements
{
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Telopillo brand colors (to be defined)
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 6.2 Backend Requirements (Supabase)

#### 6.2.1 Database Configuration
- **PostgreSQL Version:** 15+
- **Required Extensions:**
  - `uuid-ossp` (UUID generation)
  - `pgcrypto` (encryption functions)
  - `pg_trgm` (trigram similarity for search)
  - `vector` (pgvector for semantic search - Phase 2)

#### 6.2.2 Authentication Configuration
- **Providers:**
  - Email/Password (enabled)
  - Google OAuth (credentials configured, not implemented)
  - Facebook OAuth (credentials configured, not implemented)
- **JWT Settings:**
  - Expiry: 1 hour (access token)
  - Refresh token: 30 days
- **Security:**
  - Email confirmation required: No (for MVP)
  - Password requirements: Min 8 characters

#### 6.2.3 Storage Configuration
- **Buckets:**
  - `product-images` (public, max 5MB per file)
  - `avatars` (public, max 2MB per file)
- **Image Transformations:**
  - Thumbnail: 200x200
  - Medium: 800x800
  - Original: max 2000x2000

### 6.3 Development Tools Requirements

#### 6.3.1 ESLint Configuration
```json
// .eslintrc.json requirements
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### 6.3.2 Git Hooks (Husky)
- **pre-commit:**
  - Run lint-staged (ESLint + Prettier on staged files)
  - Run TypeScript type-check on staged files
- **pre-push:**
  - Run full test suite (when tests exist)

### 6.4 Environment Variables

#### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 7. Design Requirements

### 7.1 Base Layout Design

#### 7.1.1 Header Component
- **Desktop (≥768px):**
  - Logo (left)
  - Search bar (center) - placeholder only
  - Navigation links (right): "Publicar", "Mensajes", "Perfil"
  - User avatar/login button (far right)
  
- **Mobile (<768px):**
  - Logo (left)
  - Hamburger menu (right)
  - Search bar (full width below header)

#### 7.1.2 Footer Component
- **Content:**
  - Logo + tagline
  - Links: "Acerca de", "Términos", "Privacidad", "Contacto"
  - Social media icons (placeholder)
  - Copyright notice

#### 7.1.3 Color Scheme (Initial)
- **Primary:** To be defined (Bolivian-inspired colors)
- **Secondary:** To be defined
- **Neutral:** Tailwind default grays
- **Success:** Green (#10B981)
- **Error:** Red (#EF4444)
- **Warning:** Yellow (#F59E0B)

### 7.2 Responsive Breakpoints
- **Mobile:** 0-767px
- **Tablet:** 768-1023px
- **Desktop:** 1024px+

---

## 8. Dependencies & Prerequisites

### 8.1 Required Accounts
- [ ] Supabase account (free tier)
- [ ] Vercel account (for future deployment)
- [ ] GitHub account (repository hosting)

### 8.2 Required Software
- [ ] Node.js 18+ (LTS recommended)
- [ ] npm 9+ or pnpm 8+
- [ ] Git 2.30+
- [ ] VS Code (recommended) or preferred IDE
- [ ] Supabase CLI (`npm install -g supabase`)

### 8.3 Optional Tools
- [ ] Docker (for local Supabase instance - optional)
- [ ] Postman or similar (API testing)

---

## 9. Risks & Mitigations

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase free tier limits exceeded during development | Medium | Low | Monitor usage, use local Supabase instance for heavy testing |
| Next.js 14 App Router learning curve | Medium | Medium | Follow official docs, use examples from Vercel |
| TypeScript strict mode slows initial development | Low | Medium | Accept trade-off for long-term code quality |
| Environment variable misconfiguration | High | Medium | Provide clear `.env.example`, validation script |

### 9.2 Process Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Unclear project structure leads to inconsistent code | High | Medium | Document structure clearly, enforce via code reviews |
| Git workflow not followed | Medium | Medium | Document workflow, use branch protection |
| Dependencies become outdated quickly | Low | High | Use Dependabot, regular dependency updates |

---

## 10. Success Criteria

### 10.1 Functional Criteria
- ✅ Next.js app runs on `localhost:3000` without errors
- ✅ Supabase connection established (test query succeeds)
- ✅ Can create a test user via Supabase Auth
- ✅ Can upload a test image to Supabase Storage
- ✅ Base layout (Header + Footer) renders correctly on all breakpoints
- ✅ TypeScript compilation succeeds (`npm run build`)
- ✅ ESLint passes (`npm run lint`)
- ✅ Prettier formatting is consistent (`npm run format:check`)

### 10.2 Documentation Criteria
- ✅ README.md includes setup instructions
- ✅ `.env.example` documents all required variables
- ✅ Project structure is documented
- ✅ Git workflow is documented
- ✅ Contribution guidelines exist (basic)

### 10.3 Quality Criteria
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ All files formatted with Prettier
- ✅ Git hooks working (pre-commit, pre-push)
- ✅ No secrets committed to repository

---

## 11. Deliverables

### 11.1 Code Deliverables
1. **Next.js Project**
   - Initialized with TypeScript
   - Configured with Tailwind CSS + shadcn/ui
   - Base layout components (Header, Footer)
   - Example page demonstrating layout

2. **Supabase Configuration**
   - Project created and configured
   - Database extensions enabled
   - Storage buckets created
   - Auth providers configured

3. **Development Tools**
   - ESLint + Prettier configured
   - Husky git hooks set up
   - TypeScript strict mode enabled
   - Environment variable validation

### 11.2 Documentation Deliverables
1. **README.md** - Project overview and setup instructions
2. **CONTRIBUTING.md** - Contribution guidelines
3. **`.env.example`** - Environment variable template
4. **STRUCTURE.md** - Project structure explanation

### 11.3 Configuration Deliverables
1. `package.json` - Dependencies and scripts
2. `tsconfig.json` - TypeScript configuration
3. `next.config.js` - Next.js configuration
4. `tailwind.config.js` - Tailwind CSS configuration
5. `.eslintrc.json` - ESLint rules
6. `.prettierrc` - Prettier rules
7. `.gitignore` - Git ignore patterns

---

## 12. Timeline

### Week 1 Breakdown

#### Day 1-2: Project Initialization
- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS
- Set up shadcn/ui
- Configure ESLint + Prettier
- Set up Git repository

#### Day 3-4: Supabase Setup
- Create Supabase project
- Configure database extensions
- Set up authentication
- Create storage buckets
- Install and configure Supabase CLI
- Test Supabase connection from Next.js

#### Day 5: Base Layout Components
- Create Header component
- Create Footer component
- Implement responsive layout
- Test on different screen sizes

#### Day 6-7: Testing & Documentation
- Test complete development workflow
- Write setup documentation
- Create contribution guidelines
- Final testing and validation

---

## 13. Acceptance Criteria Checklist

### Setup & Configuration
- [ ] Node.js 18+ installed
- [ ] Next.js 14 project initialized with TypeScript
- [ ] Tailwind CSS configured and working
- [ ] shadcn/ui installed and configured
- [ ] ESLint + Prettier configured
- [ ] Husky git hooks working
- [ ] TypeScript strict mode enabled
- [ ] Path aliases configured (`@/`)

### Supabase Integration
- [ ] Supabase project created
- [ ] Database extensions enabled (uuid-ossp, pgcrypto, pg_trgm)
- [ ] Supabase client configured in Next.js
- [ ] Test database query succeeds
- [ ] Authentication configured (email/password enabled)
- [ ] Test user signup/login works
- [ ] Storage buckets created (product-images, avatars)
- [ ] Test file upload succeeds
- [ ] Supabase CLI installed and configured

### Project Structure
- [ ] Folder structure follows documented pattern
- [ ] Path aliases work correctly
- [ ] Components organized logically
- [ ] Types directory created

### Base Layout
- [ ] Header component created and responsive
- [ ] Footer component created and responsive
- [ ] Layout renders correctly on mobile
- [ ] Layout renders correctly on tablet
- [ ] Layout renders correctly on desktop

### Code Quality
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run format:check` passes
- [ ] Pre-commit hook runs successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Documentation
- [ ] README.md written with setup instructions
- [ ] `.env.example` created and documented
- [ ] CONTRIBUTING.md created
- [ ] STRUCTURE.md created
- [ ] Git workflow documented

### Testing
- [ ] Can clone repo and start dev server in < 15 minutes
- [ ] Can connect to Supabase from local environment
- [ ] Can create test user
- [ ] Can upload test file
- [ ] Layout renders correctly

---

## 14. Post-Milestone Actions

### Immediate Next Steps (M1)
- Design database schema
- Implement authentication UI
- Create user profile system

### Technical Debt to Address Later
- Set up automated testing (Jest + React Testing Library)
- Configure CI/CD pipeline
- Set up monitoring and error tracking
- Implement feature flags

---

## 15. References

### Documentation
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Related Documents
- [Telopillo.bo PRD](../../PRD.md)
- [System Architecture](../../ARCHITECTURE.md)
- [Milestone 1: Authentication & Profiles](../M1-authentication-profiles/README.md)

---

## 16. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | Alcides Cardenas | 2026-02-12 | ✅ |
| Tech Lead | Alcides Cardenas | 2026-02-12 | ✅ |
| Security Review | Pending | - | - |

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** February 12, 2026  
**Next Review:** After M0 completion
