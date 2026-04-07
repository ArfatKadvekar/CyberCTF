import express from 'express';
import { Category } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories - Get categories (optionally filter by eventId)
// Using authMiddleware to optionally get user's eventId if not provided
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let { eventId } = req.query;
    
    // If no eventId in query, but user is logged in (player/admin), use their eventId
    if (!eventId && req.user && req.user.eventId) {
      eventId = req.user.eventId;
    }

    const query = {};
    if (eventId) {
      query.eventId = eventId;
    }

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

export default router;
