# 🔥 Full-Stack Deployment: 404 Error Fix & Troubleshooting Guide

## 📋 Problem Diagnosis

### Why You're Getting 404 in Production But Not Locally

| Scenario | Local Development | Production (Vercel) |
|----------|------------------|-------------------|
| Frontend URL | `http://localhost:3000` | `https://cyber-ctf-beta.vercel.app` |
| API calls | `/api/auth/admin/login` | `/api/auth/admin/login` |
| Vite proxy resolves to | `http://localhost:5000` ✅ | **Frontend domain** ❌ |
| Backend runs on | `localhost:5000` | `https://cyberctf.onrender.com` (different domain!) |
| CORS check | Bypassed (same origin) | **CORS enforced** (cross-origin) |

**Root Cause**: In production, `/api/...` gets intercepted by Vercel's rewrite rules and stays on the frontend domain instead of reaching your backend.

---

## ✅ Current Frontend Configuration (Already Fixed)

Your `frontend/src/lib/api.js` is correctly configured:

```javascript
const getBaseURL = () => {
  // Priority 1: Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Production fallback - use Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://cyberctf.onrender.com/api';  // ✅ Hardcoded Render URL
  }
  
  // Priority 3: Development - use Vite proxy
  return '/api';
};
```

---

## 🔧 Backend Configuration Required

### Step 1: Check Render Backend Environment Variables

Your backend on Render **MUST** have `CORS_ORIGIN` set:

**Go to Render Dashboard**:
1. Select your backend service
2. Click **Environment**
3. Find or add: `CORS_ORIGIN`
4. Set value to: `https://cyber-ctf-beta.vercel.app`
5. Click **Deploy**

**Backend code** (`backend/server.js`):
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',  // ⚠️ CHANGE THIS!
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};
```

### Step 2: Verify Backend Routes Are Defined

Check `backend/routes/auth.js` has:

```javascript
// POST /api/auth/admin/login
router.post('/admin/login', async (req, res, next) => {
  // Should exist and handle login
  // ...
});
```

Check `backend/routes/index.js` exports auth routes:

```javascript
export { default as authRoutes } from './auth.js';
```

Check `backend/server.js` has auth route mounted:

```javascript
app.use('/api/auth', authRoutes);  // ✅ Must be here
```

---

## 🚀 Complete Setup Checklist

### Frontend (Vercel)
- [x] API client reads `VITE_API_URL` environment variable
- [x] Falls back to hardcoded Render URL: `https://cyberctf.onrender.com/api`
- [x] Works with Vite proxy in development
- [x] Code deployed to GitHub/Vercel ✅

### Backend (Render)
- [ ] `CORS_ORIGIN = https://cyber-ctf-beta.vercel.app` set in environment
- [ ] Routes mounted at `/api/auth`, `/api/challenges`, etc.
- [ ] `/api/auth/admin/login` endpoint returns proper response
- [ ] Health check works: `curl https://cyberctf.onrender.com/api/health`

### Database (MongoDB Atlas)
- [ ] Connection string set in `MONGODB_URI`
- [ ] Has admin user: `ctfadmin` with password `n0thinghere#` (hashed with bcrypt)
- [ ] Connection allows Render IP

---

## 🧪 Testing Steps

### Step 1: Test Backend is Responding

```bash
curl https://cyberctf.onrender.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 2: Test CORS is Configured

```bash
curl -H "Origin: https://cyber-ctf-beta.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://cyberctf.onrender.com/api/auth/admin/login
# Should return 200 with CORS headers
```

### Step 3: Manual Login Test

```bash
curl -X POST https://cyberctf.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ctfadmin",
    "password": "n0thinghere#"
  }'
# Should return token if credentials are correct
```

### Step 4: Test from Browser Console

```javascript
// Open DevTools Console on https://cyber-ctf-beta.vercel.app
// Run:
fetch('https://cyberctf.onrender.com/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'ctfadmin',
    password: 'n0thinghere#'
  })
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e));
```

---

## 🔍 Browser Console Debugging

Open DevTools on `https://cyber-ctf-beta.vercel.app/admin/login`:

1. **Console Tab**:
   - Look for: `✓ Using production Render backend: https://cyberctf.onrender.com/api`
   - Should NOT see: `ℹ Development mode: using /api proxy`

2. **Network Tab**:
   - Click Login
   - Look for request to `https://cyberctf.onrender.com/api/auth/admin/login`
   - Check response headers for `Access-Control-Allow-Origin`
   - Should include: `cyber-ctf-beta.vercel.app`

3. **Common Issues**:
   - ❌ Request going to `https://cyber-ctf-beta.vercel.app/api/auth/admin/login` = Frontend URL issue
   - ❌ 404 from Render = Route not found on backend
   - ❌ CORS error = `CORS_ORIGIN` not set correctly on Render
   - ❌ 401 = Invalid credentials

---

## 🎯 Quick Action Items

### Priority 1: Set CORS_ORIGIN on Render
**This is the most likely fix:**
1. Go to Render Dashboard
2. Select backend service
3. Environment → Add `CORS_ORIGIN=https://cyber-ctf-beta.vercel.app`
4. Deploy
5. Wait 2 minutes
6. Test login

### Priority 2: Clear Browser Cache
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Chrome DevTools → Network → Disable cache while DevTools open
3. Close and reopen browser

### Priority 3: Verify Vercel Deployment
1. Go to Vercel Dashboard
2. Check latest deployment is **GREEN** (not failed)
3. Click deployment to view logs for any errors

---

## 📝 Environment Variables Summary

### Render Backend (.env)
```
# REQUIRED in production
CORS_ORIGIN=https://cyber-ctf-beta.vercel.app

# Already required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production
PORT=5000
```

### Vercel Frontend (.env.production)
```
# Even though hardcoded in code, good practice to set:
VITE_API_URL=https://cyberctf.onrender.com/api
```

---

## ✅ Success Indicators

When everything works:

1. **Console**: See `✓ Using production Render backend: https://cyberctf.onrender.com/api`
2. **Network**: Request goes to `https://cyberctf.onrender.com/api/auth/admin/login` (✅ correct domain)
3. **Response**: Returns `200 OK` with login token (not 404)
4. **UI**: Redirects to dashboard after admin login

---

## 🆘 If Still Not Working

Run all these checks:

```bash
# 1. Backend is running and accessible
curl https://cyberctf.onrender.com/api/health

# 2. Render environment variable is set
# Check Render Dashboard → Environment

# 3. Backend route exists
curl -X POST https://cyberctf.onrender.com/api/auth/admin/login

# 4. Vercel deployment succeeded
# Check Vercel Dashboard → Deployments

# 5. Clear all cache
# Hard refresh browser + Chrome DevTools cache disabled
```

---

## 📚 Reference: Full Request Flow

### Development (localhost)
```
Browser → http://localhost:3000/admin/login
         ↓
React calls /api/auth/admin/login
         ↓
Vite proxy intercepts (defined in vite.config.js)
         ↓
Proxies to http://localhost:5000/api/auth/admin/login
         ↓
Express backend responds
```

### Production (Deployed)
```
Browser → https://cyber-ctf-beta.vercel.app/admin/login
         ↓
React calls https://cyberctf.onrender.com/api/auth/admin/login
         ↓
Direct fetch to Render backend
         ↓
CORS check: is origin cyber-ctf-beta.vercel.app allowed?
         ↓
If YES: Express backend responds + token returned ✅
If NO: CORS error, no response ❌
```

---

## Questions?

If login still doesn't work after these steps, check:
1. ✅ Backend `/api/health` responds
2. ✅ Render has `CORS_ORIGIN=https://cyber-ctf-beta.vercel.app`
3. ✅ Vercel deployment is GREEN
4. ✅ Browser shows correct URL in Network tab
