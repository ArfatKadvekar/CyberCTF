# 🚀 Full-Stack Deployment Guide: Vercel + Render + MongoDB Atlas

## 📋 Overview

This guide covers deploying your CTF platform across multiple services:
- **Frontend**: Vercel (Next.js/React + Vite)
- **Backend**: Render (Express.js + Node.js)
- **Database**: MongoDB Atlas
- **Media**: Cloudinary

---

## 🔴 Why Admin Login Fails in Production (404 Error)

### The Problem

Local development works perfectly:
```
Client: http://localhost:3000
       ↓ (Vite proxy: /api → http://localhost:5000)
Backend: http://localhost:5000/api/auth/admin/login ✅
```

But in production, it fails:
```
Client (Vercel): https://cyber-ctf-beta.vercel.app
              ↓ (relative path: /api/auth/admin/login)
Resolves to: https://cyber-ctf-beta.vercel.app/api/auth/admin/login ❌
             (This is the FRONTEND domain, not the backend!)
             
Result: 404 Not Found (Route doesn't exist on Vercel frontend)
```

### Root Cause

1. **Relative Paths Are Domain-Relative**
   - `/api/auth/admin/login` doesn't mean "use the /api endpoint"
   - It means "on the current domain, go to /api/auth/admin/login"
   - In production, current domain = Vercel (frontend)
   - Backend is on a different domain (Render)

2. **Frontend Can't Find the Route**
   - Vercel frontend has NO `/api` routes defined
   - Returns 404 (appearing as Vercel error, not backend error)

3. **Even If URL Was Correct without CORS Config**
   - If frontend called `https://cyberctf.onrender.com/api/auth/admin/login`
   - Backend would STILL reject it (unless CORS is configured)
   - Error: "CORS policy: response to preflight request..."

---

## ✅ Solution: 3-Part Fix

### Part 1: Frontend - Absolute Backend URL

**File**: `frontend/src/lib/api.js`

The frontend now uses **absolute URLs** instead of relative paths:

```javascript
const getBaseURL = () => {
  // Priority 1: Check environment variable (from Vercel dashboard)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    return import.meta.env.VITE_API_URL; // e.g., https://cyberctf.onrender.com/api
  }
  
  // Priority 2: Production fallback (hardcoded)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://cyberctf.onrender.com/api';
  }
  
  // Priority 3: Development (Vite proxy)
  return '/api'; // Proxies to http://localhost:5000
};
```

**Key Points:**
- ✅ Uses absolute URLs in production (not relative paths)
- ✅ Respects environment variable if set (more flexible)
- ✅ Falls back to hardcoded URL if env var not set (safety net)
- ✅ Uses relative `/api` proxy only in development

---

### Part 2: Backend - CORS Configuration

**File**: `backend/server.js`

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
```

**How It Works:**
- Backend checks **every request's `Origin` header**
- If `Origin` matches `CORS_ORIGIN` env variable → ✅ Allow request
- If `Origin` doesn't match → ❌ Block request (CORS error)

**Current Issue:**
```
CORS_ORIGIN is not set on Render
├─ Defaults to: http://localhost:3000
├─ Request comes from: https://cyber-ctf-beta.vercel.app
└─ Result: ❌ CORS blocks the response

REQUIRED FIX:
Set CORS_ORIGIN=https://cyber-ctf-beta.vercel.app on Render dashboard
```

---

### Part 3: Render Dashboard Configuration (USER ACTION REQUIRED)

This is the **critical missing step** preventing login from working.

#### Steps to Fix:

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com

2. **Select Your Backend Service**
   - Click on `cyberctf` or your service name
   - Go to **Settings** (or **Environment** tab)

3. **Add/Update Environment Variable**
   - Variable: `CORS_ORIGIN`
   - Value: `https://cyber-ctf-beta.vercel.app`
   - (Use YOUR actual Vercel domain if different)

4. **Deploy**
   - Click **Manual Deploy** or wait for auto-deploy
   - Wait 2-3 minutes for the change to take effect

5. **Verify in Browser**
   - Open browser DevTools → Console
   - You should see: `[API] ✓ Using production Render backend: https://cyberctf.onrender.com/api`
   - Try login again → Should work! ✅

---

## 📚 Environment Variables Reference

### Frontend (Vercel)

**Set in Vercel Dashboard:**
1. Project Settings → Environment Variables

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `VITE_API_URL` | `https://cyberctf.onrender.com/api` | Backend URL (production) |
| `VITE_CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Media uploads |

**Also in Local `.env.production`:**
```
VITE_API_URL=https://cyberctf.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Backend (Render)

**Set in Render Dashboard:**
Environment → Environment Variables

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `CORS_ORIGIN` | `https://cyber-ctf-beta.vercel.app` | **CRITICAL: Frontend domain** |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection |
| `JWT_SECRET` | `your-secret-key` | Token signing |
| `NODE_ENV` | `production` | Environment |
| `PORT` | `5000` | Server port (usually auto) |
| `ADMIN_REGISTRATION_TOKEN` | `random-token-here` | Admin creation security |

**Also in Local `.env`** (must match Render values):
```env
CORS_ORIGIN=https://cyber-ctf-beta.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ctf
JWT_SECRET=your-secret-key
NODE_ENV=production
```

---

## 🔧 How to Test Each Layer

### Test 1: Frontend Is Using Correct URL

**In Browser Console:**
```javascript
// Should show:
// [API] ✓ Using production Render backend: https://cyberctf.onrender.com/api

// Try to check the API client
import { authApi } from './frontend/src/lib/api.js'
```

**Check Network Tab:**
- Open DevTools → Network tab
- Filter by `admin/login`
- Request goes to: `https://cyberctf.onrender.com/api/auth/admin/login` ✅

### Test 2: Backend Route Exists

**Use curl or Postman:**
```bash
curl -X POST https://cyberctf.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ctfadmin","password":"n0thinghere#"}'
```

**Expected Response:**
- ✅ 200 OK with token - Login works!
- ❌ CORS error - Backend CORS not configured (missing CORS_ORIGIN env var)
- ❌ 401 Unauthorized - Route works but credentials wrong

### Test 3: CORS Is Configured

**Check Render Logs:**
1. Render Dashboard → Your service → Logs
2. Look for: `[CORS] Configuration: { allowedOrigin: https://cyber-ctf-beta.vercel.app }`

**In Browser Console:**
After setting CORS_ORIGIN and redeploying:
```
[API] ✓ Using production Render backend: https://cyberctf.onrender.com/api
[API] Request: { method: 'POST', url: '/auth/admin/login', ... }
```

### Test 4: Admin User Exists in Database

**Using MongoDB Atlas Dashboard:**
1. Go to Collections
2. Find `users` collection
3. Search for `{"username": "ctfadmin"}`
4. Should exist with bcrypt-hashed password

**Or in Render Logs:**
- After login attempt, you should see query logs

---

## 🚨 Common Issues & Fixes

### Issue 1: CORS Error in Browser Console

```
Access to XMLHttpRequest at 'https://cyberctf.onrender.com/api/...'
from origin 'https://cyber-ctf-beta.vercel.app' has been blocked by CORS policy
```

**Solution:**
- ✅ Set `CORS_ORIGIN=https://cyber-ctf-beta.vercel.app` on Render
- ✅ Redeploy backend
- ✅ Hard refresh browser (Ctrl+Shift+R)

### Issue 2: Backend URL Shows Hardcoded Value

```
[API] ⚠ Using hardcoded production backend (VITE_API_URL not set)
```

**This is OK** but means environment variable not set. To optimize:
- Set `VITE_API_URL` in Vercel dashboard for flexibility

### Issue 3: 404 Not Found (Route Not Found)

Could mean:
1. Backend never received request (CORS issue)
2. Route path is wrong
3. Request resolved to wrong domain

**Check Network Tab:**
- Request URL should be: `https://cyberctf.onrender.com/api/auth/admin/login`
- NOT: `https://cyber-ctf-beta.vercel.app/api/auth/admin/login`

### Issue 4: 401 Unauthorized

```json
{ "message": "Invalid credentials" }
```

**Means:**
- ✅ Route works
- ✅ CORS configured
- ❌ Username or password wrong or user doesn't exist

---

## 📊 Request Flow Comparison

### Local Development (Works ✅)
```
Browser: http://localhost:3000
  ↓ fetch("/api/auth/admin/login")
Vite Dev Server
  ↓ (proxy: /api → http://localhost:5000)
Backend: http://localhost:5000/api/auth/admin/login
  ↓ ✅ No CORS needed (same port after proxy)
Response: 200 OK
```

### Production with CORS Fix (Works ✅)
```
Browser: https://cyber-ctf-beta.vercel.app
  ↓ fetch via Axios (uses getBaseURL())
API Client: https://cyberctf.onrender.com/api
  ↓ fetch("/auth/admin/login")
Backend: https://cyberctf.onrender.com/api/auth/admin/login
  ↓ Check CORS: Origin=https://cyber-ctf-beta.vercel.app ✅
Response: 200 OK + CORS headers: Access-Control-Allow-Origin approved ✅
Browser: ✅ Accepts response
```

### Production without CORS Fix (Fails ❌)
```
Browser: https://cyber-ctf-beta.vercel.app
  ↓ fetch via Axios
API Client: https://cyberctf.onrender.com/api
  ↓ fetch("/auth/admin/login")
Backend: https://cyberctf.onrender.com/api/auth/admin/login
  ↓ Check CORS: CORS_ORIGIN env var not set (defaults to localhost:3000)
  ✗ Origin doesn't match
Response: 200 OK (but WITHOUT CORS headers)
Browser: ❌ CORS policy blocks response
Error: "CORS policy: response to preflight request..."
```

---

## ✅ Verification Checklist

Use this to verify everything is working:

- [ ] **Frontend code deployed** (`git push` to main branch)
- [ ] **Vercel auto-deployed** (check Vercel dashboard for green checkmark)
- [ ] **Backend CORS_ORIGIN set** on Render dashboard
- [ ] **Backend redeployed** (manual deploy or auto-deploy triggered)
- [ ] **Hard refresh browser** (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
- [ ] **Console shows correct API URL** ([API] ✓ Using production Render backend)
- [ ] **Network tab shows Render URL** (https://cyberctf.onrender.com/api/...)
- [ ] **Admin login test** (credentials: ctfadmin / n0thinghere#)
- [ ] **Login succeeds** (redirected to dashboard, token in localStorage)
- [ ] **Other API calls work** (challenges, leaderboard, etc.)

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Cloudinary Dashboard**: https://cloudinary.com/console

---

## 📞 Support

If login still doesn't work after setting CORS_ORIGIN:

1. **Check Render Logs**
   - Dashboard → Service → Logs
   - Look for errors starting with `[CORS]` or `[API]`

2. **Check Backend Deployment Time**
   - Render deployments take 1-3 minutes
   - Wait and try again after 3 minutes

3. **Verify Environment Variable Set**
   - Render Dashboard → Settings → Environment Variables
   - Search for `CORS_ORIGIN`
   - Value should be: `https://cyber-ctf-beta.vercel.app`

4. **Test Direct Backend Access**
   ```bash
   # In terminal, try accessing backend health check:
   curl https://cyberctf.onrender.com/api/health
   ```
   Should respond with: `{"status":"ok","timestamp":"..."}`

---

## 📝 Next Steps

1. **Set CORS_ORIGIN on Render** (if not done yet) ← START HERE
2. Hard refresh browser
3. Test admin login
4. If successful, all CTF platform features should work!

Good luck! 🎉
