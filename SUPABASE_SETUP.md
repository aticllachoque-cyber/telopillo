# Supabase Setup Guide

This guide will help you set up Supabase for the Telopillo.bo project.

## Step 1: Create Supabase Project

1. Go to **https://supabase.com/dashboard**
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name:** `telopillo-bo`
   - **Database Password:** Generate a strong password and **SAVE IT SECURELY**
   - **Region:** South America (São Paulo) - closest to Bolivia
   - **Pricing Plan:** Free
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Credentials

Once your project is ready:

1. In the Supabase Dashboard, navigate to **Settings** → **API**
2. You'll see three important values:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
Copy this entire URL.

### API Keys

**anon public** key (starts with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
This is safe to use in your frontend code.

**service_role** key (starts with `eyJ...`)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
⚠️ **KEEP THIS SECRET!** Never expose this in frontend code or commit to Git.

## Step 3: Update Environment Variables

Open `.env.local` in your project root and replace the placeholder values:

```bash
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# These can stay as is
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 4: Enable Database Extensions

In your Supabase Dashboard:

1. Go to **Database** → **Extensions**
2. Search for and enable these extensions:
   - ✅ **uuid-ossp** - UUID generation
   - ✅ **pgcrypto** - Cryptographic functions
   - ✅ **pg_trgm** - Trigram similarity for search

## Step 5: Create Storage Buckets

In your Supabase Dashboard:

1. Go to **Storage** → **Buckets**
2. Click **"New bucket"**

### Create "product-images" bucket:
- **Name:** `product-images`
- **Public bucket:** ✅ Yes
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg,image/png,image/webp`
- Click **"Create bucket"**

### Create "avatars" bucket:
- **Name:** `avatars`
- **Public bucket:** ✅ Yes
- **File size limit:** 2 MB
- **Allowed MIME types:** `image/jpeg,image/png,image/webp`
- Click **"Create bucket"**

## Step 6: Configure Authentication

In your Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default ✅
3. Go to **Authentication** → **URL Configuration**
4. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`

## Step 7: Test the Connection

Once you've updated `.env.local` with your credentials:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the database connection:
   ```bash
   curl http://localhost:3000/api/test-supabase
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Supabase connection successful! ✅",
     "connected": true,
     "timestamp": "2026-02-13T..."
   }
   ```

3. Test storage upload:
   ```bash
   curl http://localhost:3000/api/test-storage
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Storage upload successful! ✅",
     "path": "test-1234567890.txt",
     "url": "https://...supabase.co/storage/v1/object/public/product-images/test-1234567890.txt",
     "timestamp": "2026-02-13T..."
   }
   ```

## Troubleshooting

### "Supabase connection failed"
- ✅ Check that `.env.local` has the correct credentials
- ✅ Verify your Supabase project is not paused (free tier)
- ✅ Check network connection
- ✅ Verify credentials are copied correctly (no extra spaces)

### "Storage upload failed"
- ✅ Make sure the `product-images` bucket exists
- ✅ Verify the bucket is set to **public**
- ✅ Check bucket policies allow uploads

### "Invalid API key"
- ✅ Make sure you copied the **anon** key, not the **service_role** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Restart the dev server after updating `.env.local`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never expose the `service_role` key in frontend code
- Only use `NEXT_PUBLIC_*` variables in client-side code
- The `service_role` key bypasses Row Level Security - use with caution

## Next Steps

Once Supabase is configured:
1. ✅ Database extensions enabled
2. ✅ Storage buckets created
3. ✅ Authentication configured
4. ✅ Connection tested

You're ready to move to **Phase 3: Development Tools** in the implementation plan!

---

**Need help?** See the [IMPLEMENTATION_PLAN.md](Documentation/milestones/M0-foundation-setup/IMPLEMENTATION_PLAN.md) for detailed instructions.
