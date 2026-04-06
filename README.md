# WTL CTF Platform 🚩

A full-stack Capture The Flag (CTF) competition platform built with MERN stack (MongoDB, Express, React, Node.js) and Vite.

## 🔐 Security Notice

**Flags are NOW hashed with BCrypt and NEVER exposed!**
- Plaintext flags stored in database: ❌ **NO** (only BCrypt hashes)
- Flags in API responses: ❌ **NO** (automatically excluded)
- Plaintext in browser: ❌ **NO** (server-side validation only)

See [FLAG_SECURITY_SUMMARY.md](./FLAG_SECURITY_SUMMARY.md) for details.

## Features

### 🎮 Player Features
- Join events with PIN-based authentication
- Solve CTF challenges across multiple categories
- Submit flags and get instant feedback
- View live leaderboard with real-time rankings
- Track personal progress and statistics
- Unlock hints (earn points by solving)
- View challenge details and attachments

### 👨‍💼 Admin Features
- Create and manage CTF events
- Design challenges with custom categories
- Create hints for challenges
- Manage users and permissions
- View comprehensive analytics dashboard
  - Category distribution pie charts
  - Solve rate analysis
  - Submission activity timeline
  - Real-time user rankings
- Export leaderboards as PDF
- Monitor submissions in real-time

### 📊 Analytics & Visualizations
- Interactive charts with recharts
- Real-time leaderboard updates (5-second polling)
- PDF export functionality with pdfkit
- User rank tracking
- Category completion analysis
- Solve rate statistics

## Tech Stack

### Frontend
- **React** 18.3.1 - UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** 3.4.13 - Utility-first CSS
- **Recharts** 3.8.1 - Interactive data visualization
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client with JWT interceptors

### Backend
- **Node.js** v22+ - JavaScript runtime
- **Express.js** 4.21.0 - Web framework
- **MongoDB** 8.6.0 with Mongoose - NoSQL database
- **JWT** (jsonwebtoken) - Stateless authentication
- **bcryptjs** - Password hashing
- **pdfkit** 0.13.0 - PDF generation
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Serverless deployment platform
- **MongoDB Atlas** - Cloud database hosting
- **Git** - Version control

## Project Architecture

```
├── backend/                      # Node.js Express API
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js              # User accounts (admin/player)
│   │   ├── Event.js             # CTF events
│   │   ├── Challenge.js         # Challenge definitions
│   │   ├── Submission.js        # Flag submissions
│   │   └── UnlockedHint.js      # Hint unlock tracking
│   ├── routes/                   # API endpoints
│   │   ├── auth.js              # Login/signup endpoints
│   │   ├── challenges.js        # Challenge CRUD
│   │   ├── admin.js             # Admin-only endpoints
│   │   ├── leaderboard.js       # Leaderboard endpoints
│   │   ├── user.js              # User profile & ranking
│   │   └── index.js             # Route aggregation
│   ├── middleware/               # Express middleware
│   │   ├── auth.js              # JWT verification
│   │   └── errorHandler.js      # Error handling
│   ├── server.js                # Server entry point
│   ├── seed.js                  # Database seeding
│   └── vercel.json              # Vercel deployment config
│
├── frontend/                     # React Vite application
│   ├── src/
│   │   ├── pages/               # Page components
│   │   │   ├── admin/
│   │   │   │   ├── DashboardPage.jsx      # Analytics
│   │   │   │   ├── ChallengesPage.jsx     # Manage challenges
│   │   │   │   ├── CreateChallengePage.jsx # Create challenge
│   │   │   │   └── UsersPage.jsx          # Manage users
│   │   │   ├── player/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── ChallengesPage.jsx     # Browse challenges
│   │   │   │   ├── ChallengePage.jsx      # Solve challenge
│   │   │   │   ├── LeaderboardPage.jsx    # Leaderboard & charts
│   │   │   │   └── ProfilePage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   └── JoinPage.jsx               # Join event with PIN
│   │   ├── components/
│   │   │   ├── charts/                    # Chart components
│   │   │   │   ├── LeaderboardHistoryChart.jsx
│   │   │   │   ├── CategoryDistributionChart.jsx
│   │   │   │   ├── SolveRatesChart.jsx
│   │   │   │   └── ActivityChart.jsx
│   │   │   ├── UserRankDisplay.jsx        # Real-time rank display
│   │   │   └── ui/                        # Reusable UI components
│   │   ├── layouts/
│   │   │   ├── PlayerLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── lib/
│   │   │   ├── api.js                     # API client
│   │   │   └── utils.js                   # Utilities
│   │   ├── context/
│   │   │   ├── SessionContext.jsx         # Auth state
│   │   │   └── DialogContext.jsx          # Dialog/alert state
│   │   └── main.jsx                       # App entry point
│   ├── vite.config.js
│   ├── vercel.json                        # Vercel deployment config
│   └── package.json
│
├── DEPLOYMENT.md                # Vercel deployment guide
├── SECURITY.md                  # Security audit & recommendations
├── QUICKSTART.md                # Local development setup
└── README.md                    # This file

```

## Getting Started

### Local Development (5 minutes)

See **[QUICKSTART.md](./QUICKSTART.md)** for detailed setup instructions.

Quick version:
```bash
# Backend
cd backend
npm install
npm run seed
npm start
# Runs on http://localhost:5000

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Production Deployment on Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment guide.

Quick steps:
1. Create Vercel account and projects for frontend & backend
2. Connect GitHub repository
3. Configure environment variables in Vercel dashboard
4. Deploy!

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/join` - Player join event
- `POST /api/auth/logout` - Logout

### Challenges
- `GET /api/challenges` - List challenges
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges` (admin) - Create challenge
- `PUT /api/challenges/:id` (admin) - Update challenge
- `DELETE /api/challenges/:id` (admin) - Delete challenge
- `POST /api/challenges/:id/submit` - Submit flag

### Leaderboard
- `GET /api/leaderboard` - Get current leaderboard
- `GET /api/leaderboard/history` - Get score progression
- `GET /api/user/rank` - Get current user rank

### Admin
- `GET /api/admin/analytics/:eventId` - Get analytics data
- `GET /api/admin/leaderboard/:eventId/export` - Export PDF

### Hints
- `GET /api/challenges/:id/hints` - Get available hints
- `POST /api/challenges/:id/unlock-hint` - Unlock hint (costs points)

## Default Credentials

After seeding the database:

**Admin Panel:**
- Username: `admin`
- Password: `admin123`
- URL: `/admin/login`

**Player Join:**
- PIN: `4K80P9` (or generated during seed)
- URL: `/join`

⚠️ **Change these credentials before production deployment!**

## Security

⭐ **CRITICAL: Flags are securely hashed!**

See comprehensive documentation:
- [FLAG_SECURITY_SUMMARY.md](./FLAG_SECURITY_SUMMARY.md) - Quick overview of changes
- [FLAG_SECURITY_IMPLEMENTATION.md](./FLAG_SECURITY_IMPLEMENTATION.md) - Technical deep dive
- [SECURITY.md](./SECURITY.md) - Complete security audit

**Flag Protection Features:**
- ✅ Flags hashed with BCrypt before storage (one-way, salted, expensive)
- ✅ Flaghashes NEVER exposed in API responses (`.select('-flagHash')`)
- ✅ Flag validation uses constant-time comparison (prevents timing attacks)
- ✅ Incorrect submissions logged for audit, correct ones store null
- ✅ Admin endpoints also hide flags (defense in depth)
- ✅ Brute force resistant (~100ms per guess with BCrypt)
- ✅ All error responses generic (no hints to players)

**Other Security Features:**
- ✅ Passwords hashed with bcryptjs
- ✅ JWT-based authentication  
- ✅ Environment variables protected (.gitignore)
- ✅ CORS configured
- ⚠️ Generate new JWT_SECRET for production
- ⚠️ Restrict MongoDB IP whitelist in production

## Key Features Implementation

### Analytics Dashboard
- Category distribution pie chart
- Solve rate bar chart  
- Submission activity timeline
- Real-time user rank display
- PDF leaderboard export

### Real-time Features
- User rank updates every 5 seconds
- Live leaderboard updates
- Instant flag submission feedback
- Real-time chart updates

### User Experience
- Responsive design (mobile-friendly)
- Dark theme with neon accents (#00ff88)
- Loading states and error handling
- Confirmation dialogs for destructive actions
- Toast notifications for feedback

## Development

### Running in Development Mode

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Both watch for file changes and hot-reload.

### Database Operations

```bash
# Seed/reset database
cd backend
npm run seed

# Access MongoDB locally
mongo ctf-platform
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
# Creates optimized dist/ folder

# Backend is ready as-is for Vercel
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` in affected directory |
| `MongoDB connection error` | Start MongoDB or verify Atlas connection string |
| `API returns 401` | Token expired or invalid, login again |
| `Port already in use` | Change PORT in .env or kill existing process |
| `CORS errors` | Verify VITE_API_URL matches backend URL |

See **[QUICKSTART.md](./QUICKSTART.md#troubleshooting)** for more solutions.

## Project Statistics

- **Total Routes:** 10+ API endpoints
- **Database Models:** 5 (User, Event, Challenge, Submission, UnlockedHint)
- **Frontend Pages:** 10+ pages
- **Components:** 30+ reusable UI components
- **Chart Types:** 4 (BarChart, LineChart, PieChart)
- **Authentication Methods:** 2 (Admin password, Player PIN)

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## Performance Optimizations

- React.memo for expensive components
- Vite for fast builds and HMR
- MongoDB aggregation pipelines for efficient queries
- JWT for stateless auth (no session storage)
- Image optimization (Cloudinary integration)

## Future Enhancements

- [ ] Two-factor authentication for admins
- [ ] Challenge categories with filtering
- [ ] Team-based competitions
- [ ] Real-time notifications
- [ ] Mobile app with React Native
- [ ] Social features (comments, hints from community)
- [ ] Integration with CTFd for importing challenges

## License

This project is part of the WTL platform. All rights reserved.

## Support

- **Documentation:** See `DEPLOYMENT.md`, `SECURITY.md`, `QUICKSTART.md`
- **Issues:** Check GitHub Issues or troubleshooting section
- **Questions:** Review code comments and component documentation

---

**Status:** 🚀 Production Ready (requires Vercel setup)

**Last Updated:** December 2024

**Maintainers:** WTL Development Team
