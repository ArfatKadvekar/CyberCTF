# WTL CTF Platform 🚩

A full-stack Capture The Flag (CTF) competition platform built with **MERN stack** (MongoDB, Express, React, Node.js) and Vite. Perfect for hosting competitive CTF events, workshops, and training challenges.

---

## 🎯 Features

### Player Features
- ✅ Join events with PIN-based authentication
- ✅ Solve challenges across multiple categories  
- ✅ Submit flags with instant validation
- ✅ Live leaderboard with real-time rankings
- ✅ Unlock hints by earning points
- ✅ Track personal progress and statistics
- ✅ Professional dashboard with analytics

### Admin Features
- ✅ Create and manage CTF events
- ✅ Design challenges with custom categories
- ✅ Create and manage hints
- ✅ Manage users and permissions
- ✅ Analytics dashboard with real-time data
- ✅ Streamer mode for broadcasting events
- ✅ Comprehensive event management

### Security
- ✅ **Flags hashed with BCrypt** (never exposed)
- ✅ Passwords securely hashed with bcryptjs
- ✅ JWT-based authentication
- ✅ Environment variables protected
- ✅ CORS configured

---

## 🛠 Tech Stack

### Frontend
- **React** 18+ – UI Framework
- **Vite** – Lightning-fast build tool
- **Tailwind CSS** – Utility-first styling
- **Recharts** – Interactive data visualization
- **Lucide React** – Icon library
- **Axios** – HTTP client

### Backend
- **Node.js** v22+ – JavaScript runtime
- **Express.js** – Web framework
- **MongoDB** + Mongoose – NoSQL database
- **JWT** – Stateless authentication
- **bcryptjs** – Password hashing

### Deployment
- **Vercel** – Frontend hosting
- **Render/Railway** – Backend hosting
- **MongoDB Atlas** – Cloud database

---

## 🚀 Quick Start

### Prerequisites
- Node.js v22+ and npm
- MongoDB (local or MongoDB Atlas)
- Git

### Local Development

**1. Clone and setup backend:**
```bash
cd backend
npm install
```

**2. Configure backend environment:**
Create `.env` with:
```
MONGO_URI=mongodb://localhost:27017/ctf
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=development
PORT=5000
```

**3. Seed database (optional):**
```bash
npm run seed
```

**4. Start backend:**
```bash
npm start
# Server runs on http://localhost:5000
```

**5. In a new terminal, setup frontend:**
```bash
cd frontend
npm install
```

**6. Configure frontend environment:**
Create `.env.local` with:
```
VITE_API_URL=http://localhost:5000/api
```

**7. Start frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### Default Credentials (After Seeding)
- **Admin** – Username: `admin` | Password: `admin123`
- **Admin Panel** – http://localhost:5173/admin/login
- **Join PIN** – `4K80P9` (or check seeded value)
- **Player Join** – http://localhost:5173/join

⚠️ **Change these before production!**

---

## 📁 Project Structure

```
CyberCTF/
├── backend/                          # Express API
│   ├── models/                       # Mongoose schemas
│   │   ├── User.js                   # Admin & player accounts
│   │   ├── Event.js                  # CTF events
│   │   ├── Challenge.js              # Challenge definitions
│   │   ├── Submission.js             # Flag submissions
│   │   ├── UnlockedHint.js           # Hint tracking
│   │   └── Category.js               # Challenge categories
│   ├── routes/                       # API endpoints
│   │   ├── auth.js                   # Login/join
│   │   ├── challenges.js             # Challenge CRUD
│   │   ├── admin.js                  # Admin operations
│   │   ├── leaderboard.js            # Rankings
│   │   ├── user.js                   # User profiles
│   │   └── categories.js             # Category management
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification
│   │   └── errorHandler.js           # Error handling
│   ├── utils/
│   │   └── logger.js                 # Logging utility
│   ├── server.js                     # Server entry point
│   ├── vercel.json                   # Vercel config
│   └── package.json
│
├── frontend/                         # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/                # Admin pages
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── ChallengesPage.jsx
│   │   │   │   ├── StreamerModePage.jsx
│   │   │   │   └── UsersPage.jsx
│   │   │   ├── player/               # Player pages
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── ChallengesPage.jsx
│   │   │   │   ├── ChallengePage.jsx
│   │   │   │   ├── LeaderboardPage.jsx
│   │   │   │   └── ProfilePage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   └── JoinPage.jsx
│   │   ├── components/               # UI components
│   │   │   ├── charts/               # Data visualization
│   │   │   ├── ui/                   # Reusable UI
│   │   │   └── /leaderboard components
│   │   ├── context/                  # React context
│   │   │   ├── SessionContext.jsx
│   │   │   ├── CategoriesContext.jsx
│   │   │   └── DialogContext.jsx
│   │   ├── layouts/
│   │   ├── lib/
│   │   │   ├── api.js                # API client
│   │   │   └── utils.js
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── package.json
│
├── .gitignore
├── README.md                         # This file
└── SECURITY.md                       # Security information
```

---

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/admin/login          Admin login
POST   /api/auth/join                 Join event with PIN
POST   /api/auth/logout               Logout
```

### Challenges
```
GET    /api/challenges                List challenges
GET    /api/challenges/:id            Get challenge details
POST   /api/challenges                Create (admin)
PUT    /api/challenges/:id            Update (admin)
DELETE /api/challenges/:id            Delete (admin)
POST   /api/challenges/:id/submit     Submit flag
GET    /api/challenges/:id/hints      Get hints
POST   /api/challenges/:id/unlock-hint Unlock hint
```

### Categories
```
GET    /api/categories                List categories
POST   /api/admin/categories          Create (admin)
```

### Leaderboard
```
GET    /api/leaderboard               Current rankings
GET    /api/leaderboard/history       Score progression
GET    /api/user/rank                 User's rank
```

### Admin
```
GET    /api/admin/events              List events
GET    /api/admin/events/:id          Event details
POST   /api/admin/events              Create event
```

---

## 🔒 Security Highlights

**Flag Protection:**
- Flags are hashed with BCrypt before storage
- Never exposed in API responses
- Constant-time comparison (prevents timing attacks)
- Brute force resistant

**Authentication:**
- JWT tokens for stateless auth
- Password hashing with bcryptjs
- Secure session management

**Best Practices:**
- Environment variables for sensitive data
- CORS properly configured
- Error messages don't leak information
- Audit logging for suspicious activity

See [SECURITY.md](./SECURITY.md) for complete details.

---

## 🌐 Deployment

### Environment Variables

**Backend (.env):**
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_secret_key
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourfrontend.vercel.app
```

**Frontend (.env):**
```
VITE_API_URL=https://yourbackend.onrender.com/api
```

### Deploy on Vercel (Frontend)
1. Push to GitHub
2. Create Vercel account and link repository
3. Set environment variables in Vercel dashboard
4. Deploy!

### Deploy on Render/Railway (Backend)
1. Push to GitHub
2. Create new service on Render/Railway
3. Connect GitHub repository
4. Set environment variables
5. Deploy!

---

## 📊 Key Components

### Streamer Mode
Professional live broadcast dashboard showing:
- Score progression line chart (top 5 players)
- Top 3 player highlight cards with medals
- Full leaderboard table
- Event statistics panel

### Analytics Dashboard
- Category distribution pie chart
- Solve rate bar chart
- Event participant statistics
- Real-time leaderboard

### Responsive Design
- Works on desktop, tablet, and mobile
- Professional dark theme
- Optimized performance

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5000 (backend) or 5173 (frontend)
npx kill-port 5000
```

**MongoDB connection error:**
- Check MONGO_URI is correct
- Ensure MongoDB is running locally or Atlas is accessible
- Check firewall/network settings

**API errors:**
- Check backend is running on correct port
- Verify VITE_API_URL in frontend .env
- Check browser console for detailed errors

---

## 📝 License

Private repository - Contact for licensing information

---

## 🤝 Support

For issues or questions:
1. Check [SECURITY.md](./SECURITY.md) for security concerns
2. Review API documentation above
3. Check console logs and error messages
4. Review component code comments

---

**Built with ❤️ for competitive CTF events**
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
