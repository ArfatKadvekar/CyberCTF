import express from 'express';
import { Challenge, Submission, UnlockedHint, User } from '../models/index.js';
import { authMiddleware, requirePlayer } from '../middleware/auth.js';
import { invalidateLeaderboardCache } from '../utils/leaderboardCache.js';

const router = express.Router();

// GET /api/challenges - Get all challenges for player's event
router.get('/', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const { eventId } = req.user;

    const [challenges, solvedSubmissions, unlockedHints] = await Promise.all([
      Challenge.find({ eventId, isActive: true })
        .select('-flag')
        .sort({ category: 1, points: 1 })
        .lean(),
      Submission.find({
        userId: req.user._id,
        isCorrect: true,
        eventId
      }).select('challengeId').lean(),
      UnlockedHint.find({ userId: req.user._id }).select('challengeId hintIndex').lean()
    ]);

    // Get user's solved challenges
    const solvedIds = new Set(solvedSubmissions.map((s) => s.challengeId.toString()));

    // Get user's unlocked hints
    const unlockedHintsMap = {};
    unlockedHints.forEach(h => {
      if (!unlockedHintsMap[h.challengeId]) {
        unlockedHintsMap[h.challengeId] = [];
      }
      unlockedHintsMap[h.challengeId].push(h.hintIndex);
    });

    // Map challenges with solved status and hints
    const challengesWithStatus = challenges.map(challenge => {
      const challengeObj = { ...challenge };
      challengeObj.solved = solvedIds.has(challenge._id.toString());
      
      // Only show unlocked hints content
      const unlockedForChallenge = unlockedHintsMap[challenge._id.toString()] || [];
      challengeObj.hints = challenge.hints.map((hint, index) => ({
        index,
        cost: hint.cost,
        unlocked: unlockedForChallenge.includes(index),
        content: unlockedForChallenge.includes(index) ? hint.content : null
      }));

      return challengeObj;
    });

    res.json({ challenges: challengesWithStatus });
  } catch (error) {
    next(error);
  }
});

// GET /api/challenges/:id - Get single challenge
router.get('/:id', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      eventId: req.user.eventId,
      isActive: true
    }).select('-flag').lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if solved
    const [solved, unlockedHints] = await Promise.all([
      Submission.findOne({
        userId: req.user._id,
        challengeId: challenge._id,
        isCorrect: true
      }).select('_id').lean(),
      UnlockedHint.find({
        userId: req.user._id,
        challengeId: challenge._id
      }).select('hintIndex').lean()
    ]);
    const unlockedIndices = unlockedHints.map(h => h.hintIndex);

    const challengeObj = { ...challenge };
    challengeObj.solved = !!solved;
    challengeObj.hints = challenge.hints.map((hint, index) => ({
      index,
      cost: hint.cost,
      unlocked: unlockedIndices.includes(index),
      content: unlockedIndices.includes(index) ? hint.content : null
    }));

    res.json({ challenge: challengeObj });
  } catch (error) {
    next(error);
  }
});

// POST /api/challenges/:id/submit - Submit flag
router.post('/:id/submit', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const { flag } = req.body;
    const challengeId = req.params.id;
    const userId = req.user._id;

    if (!flag) {
      return res.status(400).json({ message: 'Flag is required' });
    }

    // Get challenge with flagHash (needed for validation)
    const challenge = await Challenge.findOne({
      _id: challengeId,
      eventId: req.user.eventId,
      isActive: true
    }).select('+flagHash');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if already solved
    const alreadySolved = await Submission.findOne({
      userId,
      challengeId,
      isCorrect: true
    });

    if (alreadySolved) {
      return res.status(400).json({ message: 'You have already solved this challenge' });
    }

    // Verify flag using bcrypt (secure comparison)
    const isCorrect = await challenge.verifyFlag(flag);

    // Create submission record
    // SECURITY: Only store submitted flag if INCORRECT (prevents plaintext flag storage for correct submissions)
    await Submission.create({
      userId,
      challengeId,
      eventId: req.user.eventId,
      isCorrect,
      submittedFlag: isCorrect ? null : flag.trim()
    });

    if (isCorrect) {
      // Update user score
      const updatedUser = await User.findByIdAndUpdate(userId, {
        $inc: { score: challenge.points }
      }, { new: true }).select('score');

      // Increment solve count
      await Challenge.findByIdAndUpdate(challengeId, {
        $inc: { solveCount: 1 }
      });

      invalidateLeaderboardCache(req.user.eventId);

      // SECURITY: Response does NOT include flag, hash, or any sensitive info
      return res.json({
        correct: true,
        message: 'Correct flag!',
        pointsAwarded: challenge.points,
        newScore: updatedUser.score
      });
    }

    // SECURITY: Generic response for incorrect flag (no hint about what's wrong)
    res.json({
      correct: false,
      message: 'Incorrect flag. Try again!'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/challenges/:id/hints/:hintIndex/unlock - Unlock a hint
router.post('/:id/hints/:hintIndex/unlock', authMiddleware, requirePlayer, async (req, res, next) => {
  try {
    const { id: challengeId, hintIndex } = req.params;
    const userId = req.user._id;
    const hintIdx = parseInt(hintIndex);

    const challenge = await Challenge.findOne({
      _id: challengeId,
      eventId: req.user.eventId,
      isActive: true
    }).select('hints isActive eventId').lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (hintIdx < 0 || hintIdx >= challenge.hints.length) {
      return res.status(400).json({ message: 'Invalid hint index' });
    }

    // Strictly strictly prevent purchasing hints after the challenge is already solved
    const alreadySolved = await Submission.findOne({
      userId,
      challengeId,
      isCorrect: true
    });

    if (alreadySolved) {
      return res.status(400).json({ message: 'Cannot purchase hints for a solved challenge' });
    }

    // Check if already unlocked
    const existing = await UnlockedHint.findOne({
      userId,
      challengeId,
      hintIndex: hintIdx
    });

    if (existing) {
      return res.status(400).json({ message: 'Hint already unlocked' });
    }

    const hint = challenge.hints[hintIdx];
    const cost = hint.cost;

    // Check if user has enough points
    const user = await User.findById(userId).select('score').lean();
    if (user.score < cost) {
      return res.status(400).json({ message: 'Not enough points to unlock this hint' });
    }

    // Deduct points and unlock hint
    const updatedUser = await User.findByIdAndUpdate(userId, {
      $inc: { score: -cost }
    }, { new: true }).select('score');

    await UnlockedHint.create({
      userId,
      challengeId,
      hintIndex: hintIdx,
      cost
    });

    invalidateLeaderboardCache(req.user.eventId);

    res.json({
      message: 'Hint unlocked',
      hint: {
        index: hintIdx,
        content: hint.content,
        cost
      },
      newScore: updatedUser.score
    });
  } catch (error) {
    next(error);
  }
});

export default router;
