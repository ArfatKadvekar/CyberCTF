import express from 'express';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
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

// CORS Configuration - Restrict to frontend domain in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

if (NODE_ENV === 'development') {
  console.log('[CORS] Configuration:', {
    allowedOrigin: corsOptions.origin,
    credentials: corsOptions.credentials,
    fromEnv: !!process.env.CORS_ORIGIN,
    nodeEnv: NODE_ENV
  });
}

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl === '/api/health'
});

app.use('/api', apiRateLimit);

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Connect to MongoDB and start server
let server;

const startServer = async () => {
  try {
    // MongoDB connection with production options
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ctf-platform';

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    if (NODE_ENV !== 'test') {
      console.log('✓ Connected to MongoDB');
    }

    // Start server with error handling
    server = app.listen(PORT, '0.0.0.0', () => {
      if (NODE_ENV !== 'test') {
        console.log(`✓ Server running on port ${PORT} [${NODE_ENV}]`);
      }
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${PORT} is already in use. Please kill the process or use a different port.`);
        process.exit(1);
      }
      throw err;
    });

  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');

  if (server) {
    server.close(async () => {
      console.log('✓ Server closed');
      try {
        await mongoose.disconnect();
        console.log('✓ MongoDB disconnected');
      } catch (error) {
        console.error('✗ Error disconnecting MongoDB:', error.message);
      }
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('✗ Forced shutdown after timeout');
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
  console.error('✗ Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

startServer();
