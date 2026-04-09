import express from 'express';
import { User, Event } from '../models/index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/join - Player joins event with username + PIN
// ✓ FIXED: Removed sessionToken assignment to allow multiple simultaneous sessions
router.post('/join', async (req, res, next) => {
  try {
    const { username, gamePin } = req.body;

    if (!username || !gamePin) {
      return res.status(400).json({ message: 'Username and game PIN are required' });
    }

    // Find the event by PIN
    const event = await Event.findOne({ gamePin, isActive: true });
    
    if (!event) {
      return res.status(404).json({ message: 'Invalid game PIN or event not active' });
    }

    // Check if username already exists in this event
    let player = await User.findOne({ 
      username: username.trim(), 
      eventId: event._id,
      role: 'player'
    });

    const isPlayerBanned = player
      && (player.isBanned || player.status === 'banned')
      && (!player.banExpiresAt || player.banExpiresAt > new Date());

    if (isPlayerBanned) {
      return res.status(403).json({
        message: 'You are banned',
        reason: player.banReason || 'Violation of rules',
        banned: true
      });
    }

    let message = 'Welcome back!';
    let status = 200;

    // If no existing user, create a new one (Join Flow)
    if (!player) {
      player = await User.create({
        username: username.trim(),
        role: 'player',
        eventId: event._id,
        score: 0
      });
      message = 'Joined event successfully';
      status = 201;
    }

    // ✓ FIXED: Removed sessionToken assignment - JWT handles session validity via expiration
    // Multiple simultaneous logins are now supported
    
    const token = generateToken(player);

    res.status(status).json({
      message,
      token,
      user: {
        id: player._id,
        username: player.username,
        role: player.role,
        score: player.score,
        eventId: player.eventId
      },
      event: {
        id: event._id,
        name: event.name,
        description: event.description
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/admin/login - Admin login with username + password
// ✓ FIXED: Removed sessionToken assignment to allow multiple simultaneous sessions
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await User.findOne({ username: username.trim(), role: 'admin' });
    const isAdminBanned = admin
      && (admin.isBanned || admin.status === 'banned')
      && (!admin.banExpiresAt || admin.banExpiresAt > new Date());

    if (isAdminBanned) {
      return res.status(403).json({
        message: 'You are banned',
        reason: admin.banReason || 'Violation of rules',
        banned: true
      });
    }


    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✓ FIXED: Removed sessionToken assignment - JWT handles session validity via expiration
    // Multiple simultaneous admin logins are now supported
    
    const token = generateToken(admin);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;

    let eventData = null;
    if (user.eventId) {
      const event = await Event.findById(user.eventId);
      if (event) {
        eventData = {
          id: event._id,
          name: event.name,
          description: event.description
        };
      }
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        score: user.score,
        eventId: user.eventId
      },
      event: eventData
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/validate-pin - Validate game PIN (public)
router.post('/validate-pin', async (req, res, next) => {
  try {
    const { gamePin } = req.body;

    if (!gamePin) {
      return res.status(400).json({ message: 'Game PIN is required' });
    }

    const event = await Event.findOne({ gamePin, isActive: true });

    if (!event) {
      return res.status(404).json({ valid: false, message: 'Invalid game PIN' });
    }

    res.json({
      valid: true,
      event: {
        id: event._id,
        name: event.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register-admin - Register first admin (protected with secret token)
// IMPORTANT: This endpoint is only for initial admin setup
// In production, use the ADMIN_REGISTRATION_TOKEN from environment variables
router.post('/register-admin', async (req, res, next) => {
  try {
    const { email, password, registrationToken } = req.body;

    // Verify registration token
    const secretToken = process.env.ADMIN_REGISTRATION_TOKEN;
    if (!secretToken || secretToken !== registrationToken) {
      return res.status(403).json({ message: 'Invalid or missing registration token' });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if any admin already exists (first-time setup only)
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({ message: 'Admin account already exists. Contact your system administrator.' });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create admin user
    // ✓ FIXED: Removed sessionToken assignment - JWT handles session validity via expiration
    const admin = await User.create({
      username: email.split('@')[0],
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    const token = generateToken(admin);

    res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
