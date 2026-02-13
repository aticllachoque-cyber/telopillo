# Supabase Migrations

Migrations for the Telopillo project using Supabase CLI.

## Phase 1: Database Setup (M1) ✅ COMPLETED

### Migrations Applied

1. **20260213111133_create_profiles_table.sql** – profiles table, RLS, triggers
2. **20260213111208_create_avatars_storage.sql** – avatars bucket and storage policies

### How to Use Supabase CLI

```bash
# Link project (already done)
npx supabase link --project-ref apwpsjjzcbytnvtnmmru

# Create new migration
npx supabase migration new migration_name

# Push migrations to remote database
npx supabase db push

# Check for schema differences
npx supabase db diff

# Pull remote schema changes
npx supabase db pull
```

### Verify

- **Table Editor**: `profiles` table exists ✅
- **Storage**: `avatars` bucket exists with policies ✅
- **Authentication**: Create a test user – a profile should auto-create ✅
