# Milestone 1: Authentication & User Profiles

**Duration:** Week 2-3  
**Goal:** Users can register, login, and manage profiles  
**Status:** In Progress (Phase 1-3 Complete)

## Progress: 7/13 (54%)

```
[███░░░░░░░░░░░░░░░░░] 15%
```

## Tasks

### Database ✅ COMPLETE
- [x] Create `profiles` table with RLS policies
- [x] Set up auth triggers (auto-create profile)
- [x] Configure Supabase CLI and migrations

### Frontend - Auth Pages ✅ COMPLETE
- [x] Login page (email + Google + Facebook OAuth)
- [x] Register page with form validation
- [x] Forgot/Reset password pages
- [ ] Auth middleware for protected routes

### Frontend - Profile Management
- [ ] Profile view page (public profile with ratings)
- [ ] Profile edit page (full name, phone optional, location, avatar)
- [ ] User avatar upload to Supabase Storage
- [ ] Display user's products on profile
- [ ] Display user's ratings and reviews
- [ ] Email verification status

### Backend
- [ ] Configure Supabase Auth (OAuth providers)
- [x] Implement RLS policies for profiles
- [ ] Create auth helper functions

## 📋 Current Phase: Phase 1 Complete ✅

**Phase 1: Database Setup** (Complete)
- ✅ Supabase CLI installed and linked
- ✅ `profiles` table created with RLS policies
- ✅ Auto-create profile trigger on user registration
- ✅ `avatars` storage bucket with RLS policies
- ✅ Migrations applied to remote database

**Next: Phase 2 - OAuth Configuration**

## Deliverables
- ✅ Complete authentication flow
- ✅ User profiles with avatar upload

## Success Criteria
- Users can register with email
- OAuth login works (Google, Facebook)
- Profile creation is automatic
- Users can edit their profile
- Avatar upload works
- Protected routes redirect to login

## Dependencies
- M0 completed
- Google OAuth credentials
- Facebook OAuth credentials

## Notes
- Use Supabase Auth (not NextAuth)
- Store JWT in httpOnly cookies
- Implement proper error handling
- Add loading states
- Profile fields: full_name, avatar_url, phone (optional), location_city, location_department, rating_average, rating_count, is_verified
- Auto-create profile on registration (database trigger)
- Email verification required
- Phone verification optional (future)

## 📚 Documentation

- **[PRD](./PRD.md)** - Complete requirements and user stories
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Detailed step-by-step guide with code
- **[DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md)** - Development & testing setup (test users, auth bypass)
- **[PHASE2_OAUTH_GUIDE.md](./PHASE2_OAUTH_GUIDE.md)** ⭐ - Step-by-step OAuth configuration (Google + Facebook)
- **[PROGRESS.md](./PROGRESS.md)** - Progress report and task tracking
- **[Quick Start](./QUICK_START.md)** - Fast-track implementation guide

## 🚀 Getting Started

1. Read the [Quick Start Guide](./QUICK_START.md) for a 3-day implementation plan
2. Follow the [Implementation Plan](./IMPLEMENTATION_PLAN.md) for detailed code and instructions
3. Reference the [PRD](./PRD.md) for requirements and acceptance criteria
