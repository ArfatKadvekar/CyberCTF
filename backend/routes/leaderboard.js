import express from 'express';
import { User, Submission, Challenge } from '../models/index.js';
import { authMiddleware, requirePlayer } from '../middleware/auth.js';

const router = express.Router();

// GET /api/leaderboard - Get leaderboard for player's event
router.get('/', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const { eventId } = req.user;

    // Get all players in event sorted by score (desc) then by join date (asc)
    const players = await User.find({ 
      eventId, 
      role: 'player' 
    })
      .select('username score createdAt')
      .sort({ score: -1, createdAt: 1 })
      .limit(100);

    // Get solve counts for each player
    const leaderboard = await Promise.all(
      players.map(async (player, index) => {
        const solveCount = await Submission.countDocuments({
          userId: player._id,
          isCorrect: true
        });

        return {
          rank: index + 1,
          id: player._id,
          username: player.username,
          score: player.score,
          solveCount,
          isCurrentUser: player._id.toString() === req.user._id.toString()
        };
      })
    );

    // Find current user's rank if not in top 100
    let currentUserRank = leaderboard.find(p => p.isCurrentUser);
    
    if (!currentUserRank) {
      const user = await User.findById(req.user._id);
      const rankAbove = await User.countDocuments({
        eventId,
        role: 'player',
        $or: [
          { score: { $gt: user.score } },
          { score: user.score, createdAt: { $lt: user.createdAt } }
        ]
      });

      const solveCount = await Submission.countDocuments({
        userId: user._id,
        isCorrect: true
      });

      currentUserRank = {
        rank: rankAbove + 1,
        id: user._id,
        username: user.username,
        score: user.score,
        solveCount,
        isCurrentUser: true
      };
    }

    res.json({
      leaderboard,
      currentUser: currentUserRank,
      totalPlayers: await User.countDocuments({ eventId, role: 'player' })
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/leaderboard/history - Get leaderboard score progression over time
router.get('/history', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const { eventId } = req.user;

    // Get top 10 users by score
    const topUsers = await User.find({ eventId, role: 'player' })
      .sort({ score: -1, createdAt: 1 })
      .limit(10)
      .select('_id username');

    if (topUsers.length === 0) {
      return res.json([]);
    }

    const userIds = topUsers.map(u => u._id);

    // Aggregate submissions by user and time
    const submissions = await Submission.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          isCorrect: true,
          eventId: eventId
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            // Group by hour for better data visualization
            time: {
              $dateToString: {
                format: '%Y-%m-%dT%H:00:00Z',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.time': 1 }
      }
    ]);

    // Get user details to map IDs to usernames
    const userMap = {};
    topUsers.forEach(user => {
      userMap[user._id.toString()] = user.username;
    });

    // Build timeline with cumulative scores
    const timelineMap = {};
    const userScores = {};

    // Initialize user scores
    userIds.forEach(id => {
      userScores[id.toString()] = 0;
    });

    // Process submissions and calculate cumulative scores
    submissions.forEach(sub => {
      const userId = sub._id.userId.toString();
      const time = sub._id.time;

      // Get challenge points for this submission
      userScores[userId] += sub.count;

      if (!timelineMap[time]) {
        timelineMap[time] = {};
      }
      timelineMap[time][userMap[userId]] = userScores[userId];
    });

    // Convert to array and ensure all users are represented at each timestamp
    const timeline = Object.entries(timelineMap).map(([time, data]) => {
      const point = { timestamp: time };
      userIds.forEach(id => {
        const username = userMap[id.toString()];
        point[username] = data[username] || point[username] || 0;
      });
      return point;
    });

    res.json(timeline);
  } catch (error) {
    next(error);
  }
});

export default router;
