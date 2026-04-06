# 🔧 Fix Admin Login 404 Error on Vercel

## Problem
Frontend on Vercel (cyber-ctf-beta.vercel.app) tries to call `/api/auth/admin/login` which resolves to the **frontend domain** instead of the **backend API**.

## Solution

### Step 1: Get Your Backend API URL

Your backend should be deployed on one of these platforms:
- **Render**: https://your-app.onrender.com
- **Railway**: https://your-app-api.up.railway.app
- **Vercel**: https://your-backend-project.vercel.app
- **Heroku**: https://your-app-api.herokuapp.com

Test your backend API is working:
```bash
curl https://your-backend-url/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 2: Set Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Click **Environment Variables**
3. Add new variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url/api` (replace with your actual backend URL)
   - **Environments**: Production
4. Click **Save**

### Step 3: Redeploy on Vercel

1. Commit and push the changes to GitHub:
```bash
git add frontend/src/lib/api.js frontend/.env.production
git commit -m "fix: use environment variable for backend API URL in production"
git push origin main
```

2. Vercel will automatically redeploy. Monitor the deployment in Vercel Dashboard.

### Step 4: Test Login

After deployment completes:
1. Go to https://cyber-ctf-beta.vercel.app/admin/login
2. Enter credentials: 
   - Username: `ctfadmin`
   - Password: `n0thinghere#`
3. Click Login

**Admin login should now work!** ✅

---

## Environment Variables Summary

| Environment | VITE_API_URL | How It Works |
|-------------|--------------|-------------|
| **Development** | Not set | Uses `/api` → Vite proxies to `localhost:5000` |
| **Production** | Set to backend URL | Uses actual backend API domain |

---

## Troubleshooting

### Still getting 404?
1. ✅ Verify `VITE_API_URL` is set in Vercel dashboard
2. ✅ Verify backend API URL is correct and accessible
3. ✅ Wait for Vercel deployment to complete
4. ✅ Hard refresh browser (Ctrl+Shift+R)
5. ✅ Check Network tab in DevTools - should see POST to backend domain, not Vercel domain

### Backend API not responding?
1. Check backend deployment status
2. Verify backend is running: `curl https://your-backend-url/api/health`
3. Check CORS configuration in backend (`CORS_ORIGIN` env var must allow your frontend domain)

---

## Example

```
Frontend: https://cyber-ctf-beta.vercel.app
Backend: https://cyber-ctf-api.onrender.com

VITE_API_URL = https://cyber-ctf-api.onrender.com/api

When you login:
POST https://cyber-ctf-api.onrender.com/api/auth/admin/login
✅ Correct! (goes to backend)

NOT:
POST https://cyber-ctf-beta.vercel.app/api/auth/admin/login
❌ Wrong! (goes to frontend, not backend)
```
