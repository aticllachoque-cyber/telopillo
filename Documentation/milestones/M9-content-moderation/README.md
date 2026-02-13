# Milestone 9: Content Moderation & Reports

**Duration:** Week 13  
**Goal:** Users can report inappropriate content

## Progress: 0/11 (0%)

```
[░░░░░░░░░░░░░░░░░░░░] 0%
```

## Tasks

### Database
- [ ] Create `reports` table
- [ ] Set up RLS policies
- [ ] Add admin role support

### Frontend - User Reporting
- [ ] Report button on products/users
- [ ] Report form (reason, description)

### Frontend - Admin Panel
- [ ] Admin panel (basic)
- [ ] Review reported content
- [ ] Ban/delete actions

### Backend
- [ ] Submit report
- [ ] Admin queries
- [ ] Ban user/product logic

## Deliverables
- ✅ Content moderation system
- ✅ Basic admin panel

## Success Criteria
- Users can report products/users
- Reports are stored securely
- Admins can review reports
- Admins can ban users/products
- Banned content is hidden
- Email notifications for reports
- Audit trail exists

## Dependencies
- M2 completed (products)
- M1 completed (users)

## Notes
- Implement report categories
- Add admin role in Supabase Auth
- Protect admin routes
- Log all moderation actions
- Consider automated flagging
- Add appeal process (future)
