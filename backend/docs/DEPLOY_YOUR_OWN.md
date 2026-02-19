# Deploy Your Own Instance - Complete Guide

## 🚀 Deploy Backend to Your Own Render.com Account

### Prerequisites
- GitHub account
- Render.com account (free tier is fine)
- This codebase pushed to GitHub

---

## Step 1: Push Code to GitHub (If Not Already)

```bash
cd NYSVirtualCampus

# Initialize git if needed
git init

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/nys-virtual-campus.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - NYS Virtual Campus"

# Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy to Render.com

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **Sign Up**
3. Sign up with GitHub (recommended for easy deployment)

### 2.2 Create New Web Service

1. Click **New +** button (top right)
2. Select **Web Service**
3. Connect your GitHub repository
4. Select the **NYS Virtual Campus** repository

### 2.3 Configure Service

**Basic Settings:**
- **Name:** `nys-virtual-campus-backend` (or your choice)
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** Leave empty
- **Runtime:** `Node`

**Build Settings:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx tsx server/index.ts`

**Instance Type:**
- Select **Free** (or paid if you need more resources)

### 2.4 Add Environment Variables

Click **Advanced** → **Add Environment Variable**

Add these 6 variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority` |
| `JWT_SECRET` | `nys-virtual-campus-super-secret-key-2026` |
| `JWT_EXPIRES_IN` | `24h` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `UPLOAD_DIR` | `./attached_assets/uploads` |

### 2.5 Create Service

1. Click **Create Web Service**
2. Wait 5-10 minutes for initial deployment
3. Your backend will be live at: `https://YOUR-SERVICE-NAME.onrender.com`

---

## Step 3: Update Vercel Frontend

Now update your frontend to point to YOUR backend:

### 3.1 Update vercel.json

Edit `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "status": 307,
      "headers": {
        "Location": "https://YOUR-SERVICE-NAME.onrender.com/api/$1"
      }
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Replace:** `https://YOUR-SERVICE-NAME.onrender.com` with your actual Render URL

### 3.2 Redeploy Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Or just push to GitHub and Vercel will auto-deploy.

---

## Step 4: Test Your Deployment

### Test Backend Health

```bash
curl https://YOUR-SERVICE-NAME.onrender.com/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Test Login

```bash
curl -X POST https://YOUR-SERVICE-NAME.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nys.com","password":"admin123"}'
```

**Expected:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "email": "admin@nys.com",
    "role": "admin"
  }
}
```

### Test Frontend

1. Visit your Vercel URL
2. Login with: admin@nys.com / admin123
3. Should work! ✅

---

## 🎯 Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying NYS Virtual Campus"

# 1. Commit changes
git add .
git commit -m "Update deployment configuration"
git push

echo "✅ Pushed to GitHub"
echo "⏳ Render will auto-deploy from GitHub"
echo "⏳ Vercel will auto-deploy from GitHub"
echo ""
echo "🔍 Check deployment status:"
echo "   Render: https://dashboard.render.com"
echo "   Vercel: https://vercel.com/dashboard"
```

Run with: `bash deploy.sh`

---

## 📊 Cost Breakdown

### Free Tier Limitations

**Render.com Free Tier:**
- ✅ 750 hours/month free
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ First request after sleep takes 30-60 seconds
- ✅ Automatic SSL
- ✅ Custom domains

**MongoDB Atlas Free Tier:**
- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ Perfect for development/small apps

**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ 100 GB bandwidth/month

**Total Cost: $0** for free tier

### Paid Options (If Needed)

**Render.com:**
- **Starter:** $7/month
  - No sleep
  - 0.5 GB RAM
  - Always-on

**MongoDB Atlas:**
- **Serverless:** Pay per use ($0.10/million reads)
- **Shared M2:** $9/month (2GB storage)

---

## 🔄 Continuous Deployment Setup

### Auto-deploy from GitHub

**Render:**
1. Dashboard → Your Service → Settings
2. **Auto-Deploy:** Enabled by default
3. Deploys automatically when you push to `main` branch

**Vercel:**
1. Dashboard → Your Project → Settings → Git
2. **Production Branch:** `main`
3. Auto-deploys on push

**Workflow:**
```
You push to GitHub
    ↓
Render auto-deploys backend
    ↓
Vercel auto-deploys frontend
    ↓
Both live in 2-5 minutes!
```

---

## 🐛 Troubleshooting

### Render Service Won't Start

**Check Build Logs:**
1. Render Dashboard → Your Service → Logs
2. Look for errors during build

**Common Issues:**
- Missing environment variables
- Build command failed
- Port not set correctly

### Frontend Can't Connect to Backend

**Check CORS:**
Ensure `server/index.ts` allows your Vercel domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app'  // Add your Vercel URL
  ]
}));
```

### Database Connection Fails

**Check MongoDB Atlas:**
1. Network Access → Allow 0.0.0.0/0
2. Database Access → User has readWrite permissions
3. MONGODB_URI is correct in Render environment variables

---

## 📋 Post-Deployment Checklist

- [ ] Backend deployed to Render
- [ ] All environment variables added
- [ ] Health endpoint returns "connected"
- [ ] Admin login works via API
- [ ] Frontend deployed to Vercel
- [ ] vercel.json points to new Render URL
- [ ] Frontend login works
- [ ] All features tested
- [ ] Custom domain configured (optional)

---

## 🎉 You're Live!

Once deployed, you have:
- ✅ Your own Render backend
- ✅ Your own Vercel frontend
- ✅ Full control over deployments
- ✅ Auto-deploy from GitHub
- ✅ Free tier (or paid if chosen)

---

**Deployment Time:** ~15 minutes
**Cost:** $0 (free tier)
**Your URLs:**
- Backend: https://YOUR-SERVICE-NAME.onrender.com
- Frontend: https://YOUR-APP.vercel.app
