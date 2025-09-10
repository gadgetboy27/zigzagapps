# Netlify Deployment Guide

## 🚀 Deploy Your Portfolio to Netlify

### Step 1: Prepare Your Backend
Your backend will stay hosted on Replit (or move it to Railway/Vercel). Get your backend URL:
- **Replit**: `https://your-repl-name.your-username.replit.dev`
- **Railway**: `https://your-app.up.railway.app`
- **Vercel**: `https://your-app.vercel.app`

### Step 2: Update Environment Variables
1. Edit `client/.env.production` with your backend URL:
```
VITE_API_BASE_URL=https://your-backend-url.com
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
VITE_GA_MEASUREMENT_ID=G-YOUR_GA_ID
```

### Step 3: Add Build Script
Since I cannot modify package.json directly, you'll need to add this script manually:
```json
{
  "scripts": {
    "build:frontend": "vite build"
  }
}
```

### Step 4: Deploy to Netlify
1. **Push code to GitHub** (if not already there)
2. **Connect to Netlify**:
   - Go to https://netlify.com
   - Click "New site from Git"
   - Connect your GitHub repo
3. **Configure build settings**:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist/public`
   - Node version: 20

### Step 5: Set Environment Variables in Netlify
In Netlify dashboard → Site settings → Environment variables:
- `VITE_API_BASE_URL`: Your backend URL
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe public key
- `VITE_GA_MEASUREMENT_ID`: Your Google Analytics ID

### Step 6: Test & Deploy
- Netlify will auto-deploy on git pushes
- Test all functionality (contact form, payments, etc.)

## 📁 Files Created for Deployment
- `netlify.toml` - Main Netlify configuration
- `_redirects` - SPA routing configuration
- `.nvmrc` - Node.js version specification
- `client/.env.production` - Production environment variables
- Updated `client/src/lib/queryClient.ts` - API URL handling

## 🔧 Backend Hosting Options
**Keep backend on Replit** (easiest):
- Already configured and working
- Just use your Replit app URL

**Or move to Railway** (recommended):
- Better performance for production
- Easy database migration
- Custom domains

**Or move to Vercel**:
- Serverless functions
- Good for simple APIs