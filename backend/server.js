import express from 'express';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { performance } from 'perf_hooks';
import path from 'path';
import { fileURLToPath } from 'url';

import { authRoutes, challengeRoutes, leaderboardRoutes, adminRoutes, userRoutes, categoryRoutes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('trust proxy', 1);

const normalizeOrigin = (value = '') => value.trim().replace(/\/$/, '');
const FRONTEND_URL = normalizeOrigin(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://cyber-ctf-beta.vercel.app');
const isProduction = NODE_ENV === 'production';

const missingRequiredEnv = [];
if (!process.env.JWT_SECRET) {
  missingRequiredEnv.push('JWT_SECRET');
}
if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  missingRequiredEnv.push('MONGO_URI');
}
if (isProduction && !process.env.FRONTEND_URL && !process.env.CORS_ORIGIN) {
  missingRequiredEnv.push('FRONTEND_URL');
}

if (missingRequiredEnv.length > 0) {
  console.error(`[CONFIG] Missing required environment variables: ${missingRequiredEnv.join(', ')}`);
  if (isProduction) {
    process.exit(1);
  }
}

if (!process.env.FRONTEND_URL && !process.env.CORS_ORIGIN) {
  console.warn(`[CONFIG] FRONTEND_URL not set. Falling back to ${FRONTEND_URL}`);
}

// CORS Configuration - allow only the configured frontend origin
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from server-to-server tools (no browser origin header)
    if (!origin) return callback(null, true);
    if (normalizeOrigin(origin) === FRONTEND_URL) return callback(null, true);
    return callback(new Error('CORS policy violation: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

if (NODE_ENV === 'development') {
  console.log('[CORS] Configuration:', {
    allowedOrigin: FRONTEND_URL,
    credentials: corsOptions.credentials,
    fromEnv: !!(process.env.FRONTEND_URL || process.env.CORS_ORIGIN),
    nodeEnv: NODE_ENV
  });
}

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
  const start = performance.now();

  res.on('finish', () => {
    const durationMs = performance.now() - start;
    if (NODE_ENV === 'development' || durationMs >= 500) {
      console.log(`[PERF] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(0)}ms`);
    }
  });

  next();
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl === '/api/health'
});

app.use('/api', apiRateLimit);

// Return a meaningful error when DB is unavailable instead of hanging/crashing.
app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database temporarily unavailable. Please try again shortly.'
    });
  }

  return next();
});

// Request timeout (15 seconds for general requests)
app.use((req, res, next) => {
  req.setTimeout(15000);
  res.setTimeout(15000);
  next();
});

// Security Headers (production-grade)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Connect to MongoDB before accepting traffic (fail-fast startup)
let server;

const connectToMongo = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured');
  }

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] Initial MongoDB connection failed:', error.message);
    throw error;
  }
};

const startServer = async () => {
  try {
    await connectToMongo();

    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[STARTUP] Server running on port ${PORT} [${NODE_ENV}]`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[STARTUP] Port ${PORT} is already in use. Please kill the process or use a different port.`);
        process.exit(1);
      }
      console.error('[STARTUP] Server error:', err);
      process.exit(1);
    });

    mongoose.connection.on('connected', () => {
      console.log('[DB] Connection state: connected');
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] Connection state: disconnected');
      if (NODE_ENV === 'production') {
        console.error('[DB] Lost MongoDB connection in production. Exiting for clean restart.');
        process.exit(1);
      }
    });

    mongoose.connection.on('error', (error) => {
      console.error('[DB] MongoDB error:', error.message);
    });

  } catch (error) {
    console.error('[STARTUP] Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('\n[SHUTDOWN] Shutting down gracefully...');

  if (server) {
    server.close(async () => {
      console.log('[SHUTDOWN] Server closed');
      try {
        await mongoose.disconnect();
        console.log('[SHUTDOWN] MongoDB disconnected');
      } catch (error) {
        console.error('[SHUTDOWN] Error disconnecting MongoDB:', error.message);
      }
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('[SHUTDOWN] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[PROCESS] Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[PROCESS] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
