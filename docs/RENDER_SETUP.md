# Render.com Backend Setup Guide

## 🎯 Your Deployment Architecture

```
User Browser
    ↓
Vercel (Frontend - Static Files)
    ↓ (API requests proxied)
Render.com (Backend - Express API)
    ↓
MongoDB Atlas (Database)
```

**Your API URL:** `https://nysvirtualcampus.onrender.com`

---

## ✅ Admin Credentials (Already Setup in Database)

- **Email:** admin@nys.com
- **Password:** admin123
- **Status:** ✅ Created and verified

---

## 🚀 Configure Environment Variables in Render.com

### Step 1: Access Render Dashboard

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Sign in to your account
3. Find your **NYS Virtual Campus** backend service

### Step 2: Add Environment Variables

1. Click on your **backend service** (Web Service)
2. Go to **Environment** tab (left sidebar)
3. Click **Add Environment Variable**

### Step 3: Add These Variables

Add each of the following environment variables:

#### 1. MONGODB_URI
```
mongodb+srv://vumukundwa_db_user:umukundwa2025@cluster0.xq25eqr.mongodb.net/nys_virtual_campus?retryWrites=true&w=majority
```

#### 2. JWT_SECRET
```
nys-virtual-campus-super-secret-key-2026
```

#### 3. JWT_EXPIRES_IN
```
24h
```

#### 4. NODE_ENV
```
production
```

#### 5. PORT (Usually auto-set by Render)
```
5000
```

#### 6. UPLOAD_DIR
```
./attached_assets/uploads
```

### Step 4: Save and Redeploy

1. After adding all variables, click **Save Changes**
2. Render will automatically redeploy your service
3. Wait for deployment to complete (check the **Events** tab)

---

## 📸 Screenshot Guide

### Adding Environment Variables:

```
1. Service Dashboard
   ↓
2. Environment Tab (left sidebar)
   ↓
3. "Add Environment Variable" button
   ↓
4. Enter Key: MONGODB_URI
   Enter Value: mongodb+srv://...
   ↓
5. Click "Add"
   ↓
6. Repeat for all 6 variables
   ↓
7. Click "Save Changes"
   ↓
8. Automatic redeploy starts
```

---

## 🧪 Testing After Deployment

### Test 1: Health Check

```bash
curl https://nysvirtualcampus.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-14T..."
}
```

### Test 2: Admin Login via API

```bash
curl -X POST https://nysvirtualcampus.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nys.com","password":"admin123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6919a3b5e884df2ffa504882",
    "email": "admin@nys.com",
    "fullName": "System Administrator",
    "role": "admin"
  }
}
```

### Test 3: Full Frontend Login

1. Visit your **Vercel URL** (e.g., `https://nys-virtual-campus.vercel.app`)
2. Click **Login**
3. Enter:
   - **Email:** admin@nys.com
   - **Password:** admin123
4. Should successfully login and show admin dashboard

---

## 🔍 Checking Current Deployment

### View Logs in Render

1. Go to your service in Render dashboard
2. Click **Logs** tab
3. Look for:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ serving on port 5000
   ```

### View Environment Variables

1. Go to **Environment** tab
2. You should see all 6 variables listed
3. Values are hidden for security (shown as `••••`)

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Database not available" error

**Cause:** MONGODB_URI not set or incorrect

**Solution:**
1. Go to Render → Environment tab
2. Check MONGODB_URI is set correctly
3. Verify no extra spaces in the value
4. Save and redeploy

### Issue 2: "Invalid credentials" despite correct password

**Cause:** Environment variables not loaded

**Solution:**
1. Check all environment variables are set
2. Trigger a manual redeploy:
   - Go to **Manual Deploy** (top right)
   - Click **Deploy latest commit**

### Issue 3: MongoDB connection timeout

**Cause:** MongoDB Atlas Network Access blocking Render IPs

**Solution:**
1. Go to MongoDB Atlas dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0)
   - This allows Render.com to connect
5. Click **Confirm**

### Issue 4: Service keeps restarting

**Cause:** Missing required environment variables

**Solution:**
Check Render logs for errors like:
```
Error: Missing MONGODB_URI
```
Add the missing variable in Environment tab.

---

## 🔐 Security Best Practices

### 1. MongoDB Atlas IP Whitelist

For production, you can whitelist specific Render IPs instead of 0.0.0.0/0:

1. Find Render's static IPs (if using paid plan)
2. Add only those IPs to MongoDB Network Access
3. More secure than allowing all IPs

### 2. Strong JWT Secret

For production, use a strong random secret:

```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then update JWT_SECRET in Render environment variables.

### 3. Environment Variable Security

- ✅ Never commit `.env` to Git
- ✅ Use Render's environment variables (encrypted at rest)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for staging/production

---

## 📋 Deployment Checklist

Before considering deployment complete:

- [ ] All 6 environment variables added to Render
- [ ] Service redeployed successfully
- [ ] Health check returns "connected"
- [ ] Admin login works via API
- [ ] Admin login works via frontend
- [ ] MongoDB Atlas allows Render access
- [ ] Logs show no errors
- [ ] All API endpoints tested

---

## 🚀 Quick Start Summary

1. **Add environment variables in Render.com:**
   - MONGODB_URI
   - JWT_SECRET
   - JWT_EXPIRES_IN
   - NODE_ENV
   - PORT
   - UPLOAD_DIR

2. **Save changes** (auto-redeploys)

3. **Wait for deployment** to complete

4. **Test:**
   ```bash
   curl https://nysvirtualcampus.onrender.com/api/health
   curl -X POST https://nysvirtualcampus.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@nys.com","password":"admin123"}'
   ```

5. **Login via frontend** with admin@nys.com / admin123

---

## 📞 Still Not Working?

### Check 1: Render Service Status
- Dashboard → Your Service
- Should show: 🟢 Live

### Check 2: Recent Deploys
- Events tab
- Latest deploy should be successful (green checkmark)

### Check 3: Logs
- Logs tab
- Should see:
  ```
  ✅ Connected to MongoDB Atlas
  ✅ serving on port 5000
  ```

### Check 4: Environment Variables
- Environment tab
- Should have 6 variables set

### Check 5: MongoDB Atlas
- Network Access → Should allow 0.0.0.0/0
- Database Access → User has readWrite permissions

---

## ✅ Success Indicators

When everything is working:

1. **Health Endpoint:**
   ```bash
   curl https://nysvirtualcampus.onrender.com/api/health
   # Returns: {"status":"healthy","database":"connected"}
   ```

2. **Login Works:**
   ```bash
   # Returns JWT token and user object
   ```

3. **Frontend Shows:**
   - ✅ Login successful
   - ✅ Admin dashboard visible
   - ✅ Can create courses, users, etc.

4. **No Errors in Logs:**
   - No MongoDB connection errors
   - No environment variable errors
   - No authentication errors

---

## 🔄 Maintenance

### Updating Environment Variables

If you need to change a variable later:
1. Render Dashboard → Environment tab
2. Find the variable
3. Click **Edit** (pencil icon)
4. Update value
5. Save Changes
6. Service will auto-redeploy

### Viewing Logs

To debug issues:
1. Render Dashboard → Logs tab
2. View real-time logs
3. Filter by severity (errors, warnings)
4. Download logs if needed

### Manual Redeploy

To force a redeploy:
1. Click **Manual Deploy** (top right)
2. Select **Deploy latest commit**
3. Or select **Clear build cache & deploy** for fresh build

---

**Last Updated:** 2026-02-14
**Backend URL:** https://nysvirtualcampus.onrender.com
**Status:** Ready for Configuration
