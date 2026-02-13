# Milestone 1: Authentication & User Profiles

**Duration:** Week 2-3  
**Goal:** Users can register, login, and manage profiles

## Progress: 0/13 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Create `profiles` table with RLS policies
- [ ] Set up auth triggers (auto-create profile)

### Frontend - Auth Pages
- [ ] Login page (email + Google + Facebook OAuth)
- [ ] Register page with form validation
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
- [ ] Implement RLS policies for profiles
- [ ] Create auth helper functions

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
