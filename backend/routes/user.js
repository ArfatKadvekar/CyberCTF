import express from 'express';
import { User } from '../models/index.js';
import { authMiddleware, requirePlayer } from '../middleware/auth.js';

const router = express.Router();

// GET /api/user/rank - Get current user's rank in their event
router.get('/rank', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const eventId = req.user.eventId;

    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use aggregation pipeline for efficient rank calculation
    const rankResult = await User.aggregate([
      {
        $match: {
          eventId,
          role: 'player'
        }
      },
      {
        $sort: { score: -1, createdAt: 1 }
      },
      {
        $group: {
          _id: null,
          users: {
            $push: {
              userId: '$_id',
              username: '$username',
              score: '$score'
            }
          },
          totalPlayers: { $sum: 1 }
        }
      },
      {
        $project: {
          rank: {
            $add: [
              {
                $indexOfArray: [
                  '$users.userId',
                  userId
                ]
              },
              1
            ]
          },
          totalPlayers: 1
        }
      }
    ]);

    if (!rankResult || rankResult.length === 0) {
      return res.status(404).json({ message: 'User rank not found' });
    }

    const { rank, totalPlayers } = rankResult[0];

    res.json({
      rank,
      score: currentUser.score,
      totalPlayers,
      username: currentUser.username
    });
  } catch (error) {
    next(error);
  }
});

export default router;
