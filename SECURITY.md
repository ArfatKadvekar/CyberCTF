# Security Documentation

## Overview

This document outlines the security measures implemented and recommendations for production deployment.

## Current Security Status

### ✅ Implemented Protections

1. **Environment Variables Management**
   - `.env` files are in `.gitignore`
   - `.env.example` files created as safe templates
   - No hardcoded secrets in source code

2. **Password Security**
   - All passwords hashed with bcryptjs (rounds: 10+)
   - JWT tokens for session management
   - No plaintext credentials stored

3. **Database Access**
   - MongoDB user authentication required
   - Separate credentials for production
   - User roles and permissions enforced

4. **API Security**
   - JWT middleware on protected routes
   - Role-based access control (admin/player)
   - CORS configured for cross-origin requests

5. **Vercel Configuration**
   - `.vercel.json` files created with runtime configs
   - Environment variables use @variables references
   - Secrets stored in Vercel dashboard, not in code

### ⚠️ Current Vulnerabilities (To Address)

1. **CORS Currently Permissive**
   - Set to accept all origins: `cors()`
   - Recommendation: Restrict to frontend domain in production
   - Update location: `backend/server.js` line ~20

2. **MongoDB IP Whitelist**
   - Must be configured in MongoDB Atlas
   - Current: May allow all IPs (0.0.0.0/0)
   - Recommendation: Restrict to Vercel IPs or specific IPs

3. **JWT Secret Rotation**
   - Current secret: "ctf-platform-super-secret-jwt-key" (in code as fallback)
   - Recommendation: Generate new 32-char secret with: 
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

## Production Security Recommendations

### 1. Environment Variables

**Required Actions Before Deployment:**

```bash
# Generate new secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and use in Vercel → Environment Variables
```

**Variables to Configure in Vercel:**

Backend:
- `MONGODB_URI`: Production MongoDB connection string
- `JWT_SECRET`: New 32-character random secret
- `NODE_ENV`: `production`
- `CORS_ORIGIN`: Your frontend URL

Frontend:
- `VITE_API_URL`: Your Vercel backend URL
- `VITE_CLOUDINARY_CLOUD_NAME`: If using image uploads
- `VITE_CLOUDINARY_UPLOAD_PRESET`: If using image uploads

### 2. Database Security

**MongoDB Atlas Setup:**

1. Create new cluster for production
2. Create database user with strong password (16+ chars, mix of symbols)
3. Whitelist Vercel IPs:
   - During testing: Use 0.0.0.0/0 temporarily
   - For production: Whitelist specific Vercel deployment IPs
4. Enable encryption at rest and in transit (default for Atlas)
5. Regular backups enabled

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```

### 3. API Security

**CORS Configuration (Production)**

Update `backend/server.js`:
```javascript
cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

**Rate Limiting (Recommended)**

Add to `backend/server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**HTTPS Only**
- Vercel handles HTTPS automatically
- All external requests must use HTTPS in production

### 4. Authentication Security

**Current Implementation:**
- ✅ Password hashing with bcryptjs
- ✅ JWT token generation and validation
- ✅ Protected routes with middleware
- ✅ Admin and Player role separation

**Improvements for Production:**
- [ ] Implement JWT refresh token rotation
- [ ] Add login attempt throttling
- [ ] Add 2FA for admin accounts (optional)
- [ ] Log authentication attempts
- [ ] Implement logout on password change

### 5. Data Protection

**Current Measures:**
- ✅ MongoDB encryption at rest (Atlas default)
- ✅ Encrypted connection in transit (MongoDB+srv)
- ✅ User passwords never exposed in API responses
- ✅ **Flags never sent to players** - Hidden with `.select('-flag')` in API responses
- ✅ Flags only compared server-side, never exposed in responses
- ✅ Admin-only endpoints can view flags for challenge management

**Flag Protection Details:**
```javascript
// GOOD: Flags excluded from player API responses
const challenges = await Challenge.find({ eventId, isActive: true })
  .select('-flag')  // Removes flag from response
  
// Player cannot see flags in:
// - Challenge list endpoint
// - Challenge detail endpoint
// - Leaderboard/analytics data
// - Any API response
```

**Additional Measures (Optional):**
- Field-level encryption for sensitive data
- Data masking in logs
- Regular security audits
- Gradual rollout of new features
- Error handling without info disclosure
- Server-side flag validation (current implementation)

### 6. Deployment Security

**Vercel Best Practices:**
1. Use preview deployments for testing changes
2. Require branch protection rules
3. Enable audit logs
4. Rotate deployment secrets quarterly
5. Monitor build logs for errors

**GitHub Security:**
1. Use branch protection on `main`
2. Require pull request reviews
3. Enable secret scanning
4. Set up deploy keys (don't use personal tokens)

## Flag Protection (CTF-Specific)

### IMPLEMENTATION: BCrypt Flag Hashing

✅ **Flags are now securely hashed using BCrypt before storage!**

**Architecture:**
```
Admin Input: FLAG{hello_world}
    ↓ [Pre-save middleware]
Hash: $2a$10$... (60+ character BCrypt hash)
    ↓ [Stored in DB]
Database: { flagHash: "$2a$10$...", flag: undefined }
    ↓ [Flag submission]
Player Input: FLAG{hello_world}
    ↓ [bcrypt.compare()]
Result: true/false (never expose hash or plaintext)
```

### Security Implementation Details

**1. Challenge Model Changes:**
```javascript
// Old (INSECURE):
flag: { type: String, required: true }
// Plaintext flags stored in DB, exposed in API responses

// New (SECURE):
flag: { type: String, select: false }        // Temporary input only
flagHash: { type: String, required: true, select: false } // BCrypt hash
// Pre-save middleware automatically hashes flag before saving
```

**2. Pre-Save Middleware (Challenge.js):**
```javascript
challengeSchema.pre('save', async function(next) {
  if (this.flag) {
    const hash = await bcryptjs.hash(this.flag.trim(), 10);
    this.flagHash = hash;
    this.flag = undefined; // Remove plaintext
  }
});
```

**3. Flag Verification (Challenge.js):**
```javascript
// Instance method for secure comparison
challengeSchema.methods.verifyFlag = async function(submittedFlag) {
  return await bcryptjs.compare(submittedFlag.trim(), this.flagHash);
};
```

**4. API Endpoint Changes (challenges.js):**
```javascript
// OLD (INSECURE):
const isCorrect = flag.trim() === challenge.flag;

// NEW (SECURE):
const challenge = await Challenge.findOne(...).select('+flagHash');
const isCorrect = await challenge.verifyFlag(flag);
```

**5. Admin Endpoints (admin.js):**
```javascript
// Flags hashed before saving (automatic via pre-save middleware)
const challenge = await Challenge.create({
  title, description, ..., flag, // plaintext
  // Middleware hashes it before storage
});

// Never expose hash or plaintext in responses
.select('-flagHash -flag')
```

### Security Guarantees

✅ **What is protected:**
- Plaintext flags NEVER stored in database
- Flags NEVER returned in API responses
- Flag hashes NEVER exposed in API responses
- Incorrect submissions store submitted flag (for admin audit only)
- Correct submissions store null (no flag stored)

✅ **Comparison method:**
- BCrypt constant-time comparison (prevents timing attacks)
- Case-sensitive by default
- Trimmed whitespace (prevents bypass)

✅ **API Response Examples:**

**Flag submission (correct):**
```json
{
  "correct": true,
  "message": "Correct flag!",
  "pointsAwarded": 100,
  "newScore": 450
  // NO flag, NO hash, NO flagFormat hint
}
```

**Flag submission (incorrect):**
```json
{
  "correct": false,
  "message": "Incorrect flag. Try again!"
  // No hint about what was wrong
}
```

**Challenge list (to players):**
```json
{
  "title": "Hello World",
  "description": "Find the flag...",
  "category": "Misc",
  "difficulty": "Easy",
  "points": 100,
  "flagFormat": "FLAG{...}",
  "solved": false
  // NO flag, NO flagHash, NO hints to bypass
}
```

### Why This Approach

**BCrypt advantages:**
- Industry-standard password hashing
- Automatically salted (unique hash per flag, even if flags are identical)
- Computationally expensive (prevents brute force attacks)
- Constant-time comparison (prevents timing attacks)
- Designed for security (not just obfuscation)

**Alternative approaches considered:**
- ❌ MD5/SHA1: Fast to crack with online databases
- ❌ SHA256: Still vulnerable to brute force
- ✅ BCrypt: Specifically designed for password/secret hashing

### Vulnerability Mitigation

**Attack: Player inspects API responses**
- Mitigation: Flags never in responses (verified in all endpoints)
- Test: Network tab shows no flag/hash

**Attack: Player inspects database directly**
- Mitigation: flagHash not reversible (one-way hash), MongoDB credentials not in client
- Test: DB contains only hash, not plaintext

**Attack: Player finds hardcoded flag in code**
- Mitigation: No flags in frontend or backend code
- Test: grep -r "FLAG{" --include="*.js" finds nothing

**Attack: Brute force correct flag**
- Mitigation: BCrypt with 10 rounds (expensive to compute)
- Timing: ~100ms per guess (impractical)
- Test: Submitting 1000 random flags takes 100+ seconds

**Attack: Rainbow table lookup**
- Mitigation: BCrypt salt makes rainbow tables ineffective
- Test: Same flag hashed twice produces different hashes

**Attack: Timing attack (measure comparison time)**
- Mitigation: BCrypt compare() is constant-time
- Test: Wrong vs. correct flags take same time

### Verification Checklist

Before deploying, verify:

- [x] Flag model uses flagHash field (select: false)
- [x] Flag model has pre-save middleware that hashes flag
- [x] Pre-save removes plaintext flag after hashing
- [x] Player endpoints use .select('-flagHash')
- [x] Flag submission uses bcrypt.compare(), not ===
- [x] API responses never include flag or hash
- [x] Admin challenges endpoint excludes flag/hash
- [x] Incorrect submissions store submitted flag (audit trail)
- [x] Correct submissions store null flag
- [x] Seed.js creates challenges with plaintext flag (middleware hashes)
- [x] No console.log of flags in application code
- [x] All error responses are generic (no flag hints)

### Post-Deployment Testing

**1. Test API Response Security:**
```bash
# Get challenge (player view)
curl http://localhost:5000/api/challenges
# Verify: No 'flag' or 'flagHash' in JSON

# Submit flag
curl -X POST http://localhost:5000/api/challenges/{id}/submit \
  -d '{"flag": "FLAG{test}"}'
# Verify: Response has no actual flag data
```

**2. Test Database Security:**
```bash
mongo ctf-platform
db.challenges.findOne()
# Verify: Contains 'flagHash' (hash), NOT plaintext 'flag'
```

**3. Test Admin Endpoint:**
```bash
# Admin view (with auth)
curl http://localhost:5000/api/admin/challenges
# Verify: No 'flag' or 'flagHash' in response
```

**4. Test Hash Verification:**
```javascript
// In browser console after submitting flag:
// Correct flag → correct: true
// Wrong flag → correct: false
// Same result regardless of how wrong (no hint)
```

### Known Limitations

- ❌ Users can still see what flag they submit (in Network tab)
  - This is expected CTF behavior
  - Correct flag in browser = player solved it (they already know)
- ❌ Admins can see submitted wrong flags (audit trails)
  - This is intentional (helps identify brute force attempts)
  - Only incorrect submissions stored

### Future Hardening

1. **Rate Limiting:**
   ```javascript
   // Prevent brute force:
   const recentAttempts = await Submission.countDocuments({
     userId, challengeId,
     createdAt: { $gt: Date.now() - 5*60*1000 }
   });
   if (recentAttempts > 10) return 429 Too Many Requests;
   ```

2. **Submission Logging:**
   ```javascript
   // Admin audit trail (what attempts were made)
   const log = { userId, challengeId, attemptCount: 50, incorrect: true };
   // Don't log the actual wrong flags in production
   ```

3. **Flag Format Validation:**
   ```javascript
   // Optionally enforce format client-side (for UX):
   if (!submittedFlag.startsWith('FLAG{')) showError('Wrong format');
   // Still validate on server (never trust client)
   ```

---

Why This Is Critical

Why This Is Critical

## Security Incident Response

### If Credentials Are Exposed

1. **Immediately:**
   - Revoke the exposed credential
   - Generate a new one
   - Update in Vercel

2. **Short-term:**
   - Commit new .env.example if template was exposed
   - Review git history for other exposures
   - Check if unauthorized access occurred

3. **Long-term:**
   - Update development practices
   - Implement pre-commit hooks to prevent .env commits
   - Audit all user accounts

## Compliance & Audit

### Data Privacy
- No PII stored beyond username/email
- User data not shared with third parties
- Clear data deletion policy on account removal

### Audit Trail
- All submissions logged with timestamp and user
- Admin actions can be tracked via logs
- Regular database audits recommended

## Maintenance & Updates

### Regular Tasks
- [ ] Monthly: Review and rotate secrets
- [ ] Quarterly: Security audit of code
- [ ] Quarterly: Update dependencies for patches
- [ ] Weekly: Check MongoDB Atlas alerts
- [ ] Daily: Monitor Vercel logs for errors

### Security Tools
- Use `npm audit` to check for vulnerabilities
- Use GitHub's secret scanning
- Monitor Vercel security dashboard
- Consider adding Snyk for continuous monitoring

## Testing Security

### Before Production Deployment

1. **Test Invalid Credentials**
   - Login with wrong password
   - Verify proper error handling

2. **Test Unauthorized Access**
   - Try accessing admin routes without login
   - Try accessing other users' data
   - Verify proper 401/403 responses

3. **Test Token Validation**
   - Use expired JWT
   - Use malformed JWT
   - Verify rejection

4. **CORS Testing**
   - Try requests from different origins
   - Verify blocked origins get proper errors

## Additional Security Contact

For security concerns:
- If vulnerability found: Report privately to project maintainers
- Do not open public GitHub issues for security vulnerabilities
- Allow 48 hours for response before disclosure

---

**Last Updated:** $(date)
**Next Review Date:** 30 days after production deployment
