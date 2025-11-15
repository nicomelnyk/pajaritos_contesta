# Manual Facebook Setup Guide

## Step-by-Step Instructions for Facebook App Configuration

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Consumer"** or **"Business"** as app type
5. Fill in:
   - **App Name**: Your app name (e.g., "Pajaritos Contesta")
   - **App Contact Email**: Your email
   - **Business Account** (optional): Leave blank if you don't have one
6. Click **"Create App"**

### 2. Add Facebook Login Product

1. In your app dashboard, find **"Add Product"** section
2. Click **"Set Up"** on **"Facebook Login"**
3. Select **"Web"** as platform
4. Enter your site URL (for now, use `http://localhost:3000` for development)
5. Click **"Save"**

### 3. Configure Facebook Login Settings

**⚠️ IMPORTANT: Disable Vercel Deployment Protection First!**

Before Facebook can verify your Privacy Policy URL, you need to disable Vercel's deployment protection:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **pajaritos_contesta**
3. Go to **Settings** → **Deployment Protection**
4. **Disable** deployment protection (or set it to "Public" for production)
5. This allows Facebook to access your privacy policy URL

**Now configure Facebook settings:**

1. Go to **Settings** → **Basic** (left sidebar)
2. Note down:
   - **App ID** (you'll need this)
   - **App Secret** (click "Show" to reveal - you'll need this)
3. Go to **Settings** → **Basic** and add:
   - **App Domains**: 
     - For development: `localhost`
     - For production: `pajaritoscontesta-4zx9v6ytm-nicolasmelnyks-projects.vercel.app`
   - **Privacy Policy URL**: 
     - For development: `http://localhost:3000/privacy`
     - For production: `https://pajaritoscontesta-4zx9v6ytm-nicolasmelnyks-projects.vercel.app/privacy`
     - ⚠️ **Required even for development mode!** (Use the production URL)
   - **Terms of Service URL**: (optional)
   - **User Data Deletion**: (optional callback URL)

### 4. Configure OAuth Redirect URIs

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://pajaritoscontesta-4zx9v6ytm-nicolasmelnyks-projects.vercel.app/api/auth/callback/facebook
   ```
   (Add both URLs - localhost for local development, Vercel URL for production)

### 5. Request Required Permissions

1. Go to **Facebook Login** → **Settings**
2. Under **"Permissions and Features"**, you'll need to request:
   - `email` (basic permission)
   - `public_profile` (basic permission)
   - `groups_access_member_info` (advanced - requires App Review)
   - `publish_to_groups` (advanced - requires App Review)

### 6. App Review Process (IMPORTANT)

**For Basic Permissions (`email`, `public_profile`):**
- ✅ Available immediately for testing with your own account
- ✅ No review needed for personal use

**For Advanced Permissions (`groups_access_member_info`, `publish_to_groups`):**
- ⚠️ Requires **App Review** by Facebook
- ⚠️ You need to:
  1. Fill out a detailed use case
  2. Provide a screencast/video showing how your app uses the permission
  3. Submit for review (can take 7-14 days)
  4. Facebook may approve or reject

**Alternative for Testing:**
- You can test with your own account without review
- Add yourself and other admins as **"Test Users"** or **"Roles"** → **"Administrators"**
- Go to **Roles** → **Add People** → Add Facebook accounts that can test

### 7. Set App to Development Mode (for testing)

1. In **Settings** → **Basic**
2. Under **"App Mode"**, select **"Development"**
3. This allows you to test with your own account without App Review

### 8. Add Test Users (Optional but Recommended)

1. Go to **Roles** → **Roles** (left sidebar)
2. Click **"Add People"**
3. Add Facebook accounts of admins who will test
4. Assign role: **"Administrator"** or **"Developer"**

### 9. Get Your Credentials

After setup, you'll need these values:

**For local development (`.env.local` file):**
```
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_string_here
```

**For Vercel production (add in Vercel Dashboard → Settings → Environment Variables):**
```
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
NEXTAUTH_URL=https://pajaritoscontesta-4zx9v6ytm-nicolasmelnyks-projects.vercel.app
NEXTAUTH_SECRET=generate_a_random_string_here (use the same secret as dev)
```

**To generate NEXTAUTH_SECRET:**
- Run: `openssl rand -base64 32` in terminal
- Or use: https://generate-secret.vercel.app/32

### 10. Configure Group Permissions

**Important:** Even with API permissions, you need to:

1. Make sure your Facebook account is an **admin** of the target group
2. The group must allow **"Members can post"** (check group settings)
3. Some groups have restrictions - check group **Settings** → **Privacy and Permissions**

### 11. Production Checklist

Before deploying to Vercel:

1. ✅ Add production domain to **App Domains**
2. ✅ Add production callback URL to **Valid OAuth Redirect URIs**
3. ✅ Set **Privacy Policy URL** (required)
4. ✅ Submit for **App Review** if using advanced permissions
5. ✅ Switch app to **"Live"** mode (only after review approval)

---

## Quick Reference: What You'll Need

- [ ] Facebook Developer Account
- [ ] Facebook App created
- [ ] App ID and App Secret
- [ ] OAuth Redirect URIs configured
- [ ] Test users added (for testing)
- [ ] App Review submitted (for production with advanced permissions)
- [ ] Admin access to target Facebook group(s)
- [ ] Environment variables ready (.env.local)

---

## Common Issues & Solutions

**Issue:** "Invalid OAuth Redirect URI"
- **Solution:** Make sure the exact URL in your app matches what's in Facebook settings

**Issue:** "App Not Setup: This app is still in development mode"
- **Solution:** Add test users in Roles, or submit for App Review

**Issue:** "Insufficient Permissions"
- **Solution:** Request permissions in App Dashboard, or use test mode with your own account

**Issue:** "Cannot post to group"
- **Solution:** Check group settings, ensure you're an admin, verify group allows member posts

