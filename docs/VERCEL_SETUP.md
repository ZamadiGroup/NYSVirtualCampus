# Vercel Deployment Setup Guide

## ✅ Admin Login Credentials

**These credentials are now working in the database:**
- **Email:** admin@nys.com
- **Password:** admin123
- **Role:** admin

---

## 🚀 Setting Up Environment Variables in Vercel

The login is failing on Vercel because environment variables need to be configured in your Vercel dashboard.

### Step 1: Access Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in to your account
3. Navigate to your **NYS Virtual Campus** project

### Step 2: Add Environment Variables

1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Environment Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority` | Production, Preview, Development |
| `JWT_SECRET` | `nys-virtual-campus-super-secret-key-2026` | Production, Preview, Development |
| `JWT_EXPIRES_IN` | `24h` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `PORT` | `5000` | Production, Preview, Development |

### Step 3: Add Each Variable

For each variable:
1. Click **Add New** or **Add Environment Variable**
2. Enter the **Name** (e.g., `MONGODB_URI`)
3. Enter the **Value** (see table above)
4. Select which environments to apply it to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)
5. Click **Save**

### Step 4: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** menu (three dots)
4. Select **Redeploy**
5. Wait for deployment to complete

---

## 🔧 Quick Setup via Vercel CLI (Alternative)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add MONGODB_URI production
# Paste: mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority

vercel env add JWT_SECRET production
# Paste: nys-virtual-campus-super-secret-key-2026

vercel env add JWT_EXPIRES_IN production
# Paste: 24h

vercel env add NODE_ENV production
# Paste: production

# Deploy
vercel --prod
```

---

## 🧪 Testing After Deployment

Once deployed, test the login:

### Using Browser
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Click Login
3. Enter:
   - Email: `admin@nys.com`
   - Password: `admin123`
4. Should successfully login and redirect to admin dashboard

### Using API (curl)
```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nys.com","password":"admin123"}'
```

Should return:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@nys.com",
    "fullName": "System Administrator",
    "role": "admin"
  }
}
```

---

## ⚠️ Important Security Notes

### 1. **Never Commit `.env` File**

The `.env` file contains sensitive credentials and should NEVER be committed to Git:

```bash
# Check .gitignore includes .env
cat .gitignore | grep .env
```

Should show:
```
.env
.env.local
.env.*.local
```

### 2. **Rotate Secrets for Production**

For production, consider using stronger secrets:

```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. **Database IP Whitelist**

Ensure MongoDB Atlas allows Vercel's IP addresses:

1. Go to MongoDB Atlas
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add specific Vercel IP ranges if known

---

## 🐛 Troubleshooting

### Login Still Fails After Setup

**Check 1: Verify Environment Variables**
```bash
# In Vercel dashboard, go to Settings > Environment Variables
# Ensure all variables are set correctly
```

**Check 2: Check Deployment Logs**
```bash
# In Vercel dashboard:
# Deployments > Latest Deployment > View Function Logs
# Look for MongoDB connection errors
```

**Check 3: Test API Health**
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Check 4: Verify Database Connection**

If database shows "disconnected":
- Check MongoDB Atlas Network Access
- Verify MONGODB_URI is correct
- Check MongoDB Atlas cluster is running

### "Invalid Credentials" Error

If you get "Invalid credentials" but you're sure the password is correct:

1. Run the admin creation script again:
```bash
node scripts/create-admin.cjs
```

2. Verify the password is hashed in the database

3. Check if there are duplicate admin users:
```bash
# The script will show all users
```

### CORS Errors

If you get CORS errors, check `server/index.ts` CORS configuration allows your Vercel frontend URL.

---

## 📋 Checklist

Before going live:

- [ ] All environment variables added to Vercel
- [ ] Deployment redeployed with new variables
- [ ] Admin login tested and working
- [ ] API health endpoint returns "connected"
- [ ] MongoDB Atlas allows Vercel IPs
- [ ] `.env` file is in `.gitignore`
- [ ] JWT secret is strong (production)
- [ ] All users can login successfully

---

## 🆘 Still Having Issues?

1. **Check Vercel Function Logs**
   - Deployments → Latest → View Function Logs
   - Look for errors in `/api/auth/login`

2. **Verify Database**
   - Run: `node scripts/create-admin.cjs`
   - Confirms admin user exists and password works

3. **Test Locally First**
   - Run: `npm run dev`
   - Visit: http://localhost:5173
   - Login with admin@nys.com / admin123
   - If works locally but not on Vercel = environment variable issue

4. **Check Network**
   - MongoDB Atlas → Network Access
   - Should allow 0.0.0.0/0 or Vercel IPs

---

## ✅ Success!

Once login works:
- ✅ Admin dashboard accessible
- ✅ Can create courses
- ✅ Can manage users
- ✅ Full system functionality

---

**Last Updated:** 2026-02-14
**Status:** Ready for Deployment
