# Phase 2: OAuth Configuration Guide

**Goal:** Configure Google and Facebook OAuth providers in Supabase  
**Duration:** 3-4 hours  
**Status:** Ready to execute

---

## 📋 Overview

You'll need to:
1. Create OAuth apps in Google Cloud Console
2. Create OAuth apps in Facebook Developers
3. Configure both in Supabase Dashboard
4. Test the OAuth flows

---

## 🔵 Part 1: Google OAuth Setup

### Step 1.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Project name: `Telopillo` (or any name)
4. Click **"Create"**
5. Wait for project creation (~30 seconds)

### Step 1.2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for testing with any Google account)
3. Click **"Create"**

**Fill in App Information:**
- **App name:** `Telopillo.bo`
- **User support email:** Your email
- **App logo:** (optional, skip for now)
- **Application home page:** `http://localhost:3003`
- **Application privacy policy:** (skip for now)
- **Application terms of service:** (skip for now)
- **Authorized domains:** (leave empty for now)
- **Developer contact email:** Your email

4. Click **"Save and Continue"**

**Scopes:**
5. Click **"Add or Remove Scopes"**
6. Select:
   - `userinfo.email`
   - `userinfo.profile`
7. Click **"Update"** → **"Save and Continue"**

**Test users:**
8. Click **"Add Users"**
9. Add your email and `dev@telopillo.test`
10. Click **"Save and Continue"**
11. Click **"Back to Dashboard"**

### Step 1.3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Telopillo Web Client`

**Authorized JavaScript origins:**
5. Click **"Add URI"**
6. Add:
   ```
   http://localhost:3003
   https://apwpsjjzcbytnvtnmmru.supabase.co
   ```

**Authorized redirect URIs:**
7. Click **"Add URI"**
8. Add:
   ```
   https://apwpsjjzcbytnvtnmmru.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```

9. Click **"Create"**

**Save Credentials:**
10. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
11. Copy the **Client Secret** (looks like: `GOCSPX-xxxxx`)
12. Click **"OK"**

### Step 1.4: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `apwpsjjzcbytnvtnmmru`
3. Go to **Authentication** → **Providers**
4. Find **"Google"** in the list
5. Toggle **"Enable Sign in with Google"** to ON
6. Fill in:
   - **Client ID:** (paste from Google)
   - **Client Secret:** (paste from Google)
7. Click **"Save"**

### Step 1.5: Test Google OAuth

**Test from Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Click **"Invite user"** → **"Sign in with Google"**
3. Should redirect to Google login
4. After login, should create user in Supabase

**Or test from your app (later in Phase 3):**
- Login page will have "Continue with Google" button
- Click it and test the flow

---

## 🔷 Part 2: Facebook OAuth Setup

### Step 2.1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Use case: **"Other"**
4. Click **"Next"**
5. App type: **"Consumer"**
6. Click **"Next"**

**App Details:**
- **App name:** `Telopillo`
- **App contact email:** Your email
- Click **"Create app"**

### Step 2.2: Add Facebook Login Product

1. In your app dashboard, find **"Add products to your app"**
2. Find **"Facebook Login"** → Click **"Set up"**
3. Platform: **"Web"**
4. Site URL: `http://localhost:3003`
5. Click **"Save"** → **"Continue"**
6. Skip the quickstart (click **"Settings"** in left menu under Facebook Login)

### Step 2.3: Configure Facebook Login Settings

1. Go to **"Facebook Login"** → **"Settings"** (in left sidebar)

**Client OAuth Settings:**
- **Valid OAuth Redirect URIs:** Add these (one per line):
  ```
  https://apwpsjjzcbytnvtnmmru.supabase.co/auth/v1/callback
  http://localhost:54321/auth/v1/callback
  ```
- **Deauthorize Callback URL:** (leave empty)
- **Data Deletion Request URL:** (leave empty)

2. Click **"Save Changes"**

### Step 2.4: Get App Credentials

1. Go to **"Settings"** → **"Basic"** (in left sidebar)
2. Copy **App ID** (looks like: `1234567890123456`)
3. Click **"Show"** next to **App Secret**
4. Enter your Facebook password
5. Copy **App Secret** (looks like: `abcdef1234567890abcdef1234567890`)

### Step 2.5: Make App Public (for testing)

1. Still in **"Settings"** → **"Basic"**
2. Scroll down to **"App Mode"**
3. Toggle from **"Development"** to **"Live"**
4. Click **"Switch Mode"** → Confirm

**Note:** For production, you'll need to complete App Review, but for development this is fine.

### Step 2.6: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `apwpsjjzcbytnvtnmmru`
3. Go to **Authentication** → **Providers**
4. Find **"Facebook"** in the list
5. Toggle **"Enable Sign in with Facebook"** to ON
6. Fill in:
   - **Facebook client ID:** (paste App ID from Facebook)
   - **Facebook secret:** (paste App Secret from Facebook)
7. Click **"Save"**

### Step 2.7: Test Facebook OAuth

**Test from Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Click **"Invite user"** → **"Sign in with Facebook"**
3. Should redirect to Facebook login
4. After login, should create user in Supabase

---

## ✅ Verification Checklist

After completing both OAuth setups:

### Google OAuth
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Secret saved
- [ ] Configured in Supabase Dashboard
- [ ] Test login works

### Facebook OAuth
- [ ] Facebook app created
- [ ] Facebook Login product added
- [ ] Redirect URIs configured
- [ ] App ID and Secret saved
- [ ] App mode set to "Live"
- [ ] Configured in Supabase Dashboard
- [ ] Test login works

### Profile Auto-Creation
- [ ] Test: Login with Google → profile created in `profiles` table
- [ ] Test: Login with Facebook → profile created in `profiles` table

---

## 🔧 Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Check that redirect URI in Google Console exactly matches Supabase callback URL
- Make sure to include both production and local URLs

**Error: "Access blocked: This app's request is invalid"**
- OAuth consent screen not configured properly
- Add test users in OAuth consent screen

### Facebook OAuth Issues

**Error: "Can't Load URL: The domain of this URL isn't included in the app's domains"**
- Add your domain in **Settings** → **Basic** → **App Domains**
- Add `apwpsjjzcbytnvtnmmru.supabase.co`

**Error: "App Not Setup: This app is still in development mode"**
- Switch app to "Live" mode in Settings → Basic

**Error: "Invalid OAuth Redirect URI"**
- Check redirect URIs in Facebook Login → Settings
- Must exactly match Supabase callback URL

---

## 📝 Save Your Credentials

Add to `.env.local` (for reference, not used in code):

```env
# Google OAuth (for reference)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Facebook OAuth (for reference)
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
```

**Note:** These are configured in Supabase Dashboard, not in your code. This is just for your records.

---

## 🎯 Next Steps

After completing Phase 2:

1. ✅ Verify both OAuth providers work
2. ✅ Verify profile auto-creation trigger works
3. → Proceed to **Phase 3: Authentication Pages**
   - Build login/register pages
   - Add OAuth buttons
   - Implement email/password auth

---

**Estimated Time:** 3-4 hours (including testing)  
**Last Updated:** February 13, 2026
