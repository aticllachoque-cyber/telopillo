# Quick Supabase Project Creation

## 1. Go to Supabase
Visit: https://supabase.com/dashboard

## 2. Sign In or Sign Up
- If you have an account: Sign in
- If you're new: Click "Start your project" and create a free account

## 3. Create New Project
Click the **"New Project"** button

## 4. Fill in Project Details

**Organization:** Select or create one (e.g., "Personal" or "Telopillo")

**Project Name:** `telopillo-bo`

**Database Password:** 
- Click "Generate a password" 
- **IMPORTANT:** Copy and save this password somewhere safe!
- You'll need it to access the database directly

**Region:** Select **South America (São Paulo)** - closest to Bolivia

**Pricing Plan:** Free (sufficient for development)

## 5. Create Project
Click **"Create new project"**

⏱️ Wait 2-3 minutes while Supabase provisions your project

## 6. Get Your Credentials

Once the project is ready:

1. Click **Settings** (⚙️) in the left sidebar
2. Click **API**
3. You'll see:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
**Copy this** - it's your `NEXT_PUBLIC_SUPABASE_URL`

### Project API Keys

**anon public**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
**Copy this** - it's your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
**Copy this** - it's your `SUPABASE_SERVICE_ROLE_KEY`

## 7. Update .env.local

Open `.env.local` in your project and replace the placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 8. Test Connection

```bash
# Start the dev server
npm run dev

# In another terminal, test the connection
curl http://localhost:3000/api/test-supabase
```

You should see:
```json
{
  "success": true,
  "message": "Supabase connection successful! ✅"
}
```

## Done! ✅

Your Supabase project is now connected to your Next.js app.

---

## Troubleshooting

**Can't find the Settings menu?**
- Look at the bottom of the left sidebar for the ⚙️ icon

**Project is paused?**
- Free tier projects pause after 1 week of inactivity
- Click "Restore" to reactivate it

**Wrong credentials?**
- Make sure you copied the entire key (they're very long!)
- No extra spaces before or after the keys
- Restart your dev server after updating .env.local

---

**Next:** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete configuration (extensions, storage, auth)
