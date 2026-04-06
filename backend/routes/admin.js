import express from 'express';
import PDFDocument from 'pdfkit';
import { User, Event, Challenge, Submission, UnlockedHint } from '../models/index.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin auth
router.use(authMiddleware, requireAdmin);

// ============ DASHBOARD ============

// GET /api/admin/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    
    const stats = await Promise.all(
      events.map(async (event) => {
        const playerCount = await User.countDocuments({ eventId: event._id, role: 'player' });
        const challengeCount = await Challenge.countDocuments({ eventId: event._id });
        const submissionCount = await Submission.countDocuments({ eventId: event._id, isCorrect: true });

        return {
          event: {
            id: event._id,
            name: event.name,
            gamePin: event.gamePin,
            isActive: event.isActive,
            startDate: event.startDate,
            endDate: event.endDate
          },
          playerCount,
          challengeCount,
          submissionCount
        };
      })
    );

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

// ============ EVENTS ============

// GET /api/admin/events - Get all events
router.get('/events', async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/events - Create event
router.post('/events', async (req, res, next) => {
  try {
    const { name, description, startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Event name is required' });
    }

    const gamePin = await Event.generatePin();
    
    // Validate PIN format before creating
    if (!/^[A-Z0-9]{6}$/.test(gamePin)) {
      return res.status(500).json({ message: 'PIN generation failed - invalid format' });
    }

    const event = await Event.create({
      name,
      description,
      gamePin,
      startDate: startDate || new Date(),
      endDate,
      isActive: true,
      createdBy: req.user._id
    });

    if (!event) {
      return res.status(500).json({ message: 'Failed to create event' });
    }

    res.status(201).json({ 
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        gamePin: event.gamePin,
        startDate: event.startDate,
        endDate: event.endDate,
        isActive: event.isActive,
        createdAt: event.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/events/:id - Update event
router.put('/events/:id', async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, isActive } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { name, description, startDate, endDate, isActive },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/events/:id - Delete event
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Also delete related data
    await Challenge.deleteMany({ eventId: event._id });
    await User.deleteMany({ eventId: event._id, role: 'player' });
    await Submission.deleteMany({ eventId: event._id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============ CHALLENGES ============

// GET /api/admin/challenges - Get all challenges (optionally filter by event)
router.get('/challenges', async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const query = eventId ? { eventId } : {};

    const challenges = await Challenge.find(query)
      .populate('eventId', 'name')
      .select('-flagHash -flag') // SECURITY: Never expose flag or hash in API responses
      .sort({ eventId: 1, category: 1, points: 1 });

    res.json({ challenges });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/challenges - Create challenge
router.post('/challenges', async (req, res, next) => {
  try {
    const { 
      title, description, category, difficulty, points, 
      flag, flagFormat, attachments, hints, eventId 
    } = req.body;

    if (!title || !description || !category || !difficulty || !points || !flag || !eventId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Create challenge with plaintext flag
    // Pre-save middleware will hash it before storing
    const challenge = await Challenge.create({
      title,
      description,
      category,
      difficulty,
      points,
      flag,
      flagFormat: flagFormat || 'FLAG{...}',
      attachments: attachments || [],
      hints: hints || [],
      eventId,
      isActive: true
    });

    // Return challenge WITHOUT flag or flagHash (SECURITY)
    const responseChallenge = challenge.toObject();
    delete responseChallenge.flag;
    delete responseChallenge.flagHash;

    res.status(201).json({ challenge: responseChallenge });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/challenges/:id - Update challenge
router.put('/challenges/:id', async (req, res, next) => {
  try {
    const { 
      title, description, category, difficulty, points, 
      flag, flagFormat, attachments, hints, isActive, eventId
    } = req.body;

    // Build update object
    const updateData = {
      title,
      description,
      category,
      difficulty,
      points,
      flagFormat,
      attachments,
      hints,
      isActive,
      eventId
    };

    // If flag is provided, it will be hashed by pre-save middleware
    if (flag) {
      updateData.flag = flag;
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-flagHash -flag'); // SECURITY: Never expose flag or hash

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json({ challenge });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/challenges/:id - Delete challenge
router.delete('/challenges/:id', async (req, res, next) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Delete related submissions
    await Submission.deleteMany({ challengeId: challenge._id });

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============ USERS ============

// GET /api/admin/users - Get all users (optionally filter by event)
router.get('/users', async (req, res, next) => {
  try {
    const { eventId, role } = req.query;
    const query = {};
    
    if (eventId) query.eventId = eventId;
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('eventId', 'name')
      .sort({ score: -1, createdAt: 1 });

    // Get solve counts
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const solveCount = await Submission.countDocuments({
          userId: user._id,
          isCorrect: true
        });

        return {
          ...user.toObject(),
          solveCount
        };
      })
    );

    res.json({ users: usersWithStats });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin' });
    }

    user.status = status;
    // Forcibly clear active sessions if banned
    if (status === 'banned') {
      user.sessionToken = null; 
    }
    
    await user.save();
    res.json({ message: `User ${status}`, user });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/users/:id/reset - Reset user score and unlocks
router.post('/users/:id/reset', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.score = 0;
    await user.save();

    await Submission.deleteMany({ userId: user._id });
    
    // Also delete any UnlockedHint documents for this user
    await UnlockedHint.deleteMany({ userId: user._id });

    res.json({ message: 'User progress reset successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/users/:id - Delete user (players only)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ userId: user._id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============ ANALYTICS ============

// GET /api/admin/analytics/:eventId - Get visual analytics for an event
router.get('/analytics/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 1. CATEGORY DISTRIBUTION - Count challenges by category
    const categoryDistribution = await Challenge.aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // 2. SOLVE RATES - Count correct submissions per challenge
    const challenges = await Challenge.find({ eventId }).select('_id title category');
    
    const solveRates = await Promise.all(
      challenges.map(async (challenge) => {
        const totalSubmissions = await Submission.countDocuments({
          challengeId: challenge._id,
          eventId
        });

        const correctSubmissions = await Submission.countDocuments({
          challengeId: challenge._id,
          isCorrect: true,
          eventId
        });

        const percent = totalSubmissions > 0 
          ? Math.round((correctSubmissions / totalSubmissions) * 100)
          : 0;

        return {
          challenge: challenge.title,
          category: challenge.category,
          percent,
          solves: correctSubmissions,
          total: totalSubmissions
        };
      })
    );

    // 3. ACTIVITY TIMELINE - Submissions over time (hourly)
    const activity = await Submission.aggregate([
      {
        $match: { eventId }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%dT%H:00:00Z',
              date: '$createdAt'
            }
          },
          submissions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          time: '$_id',
          submissions: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      categoryDistribution,
      solveRates,
      activity
    });
  } catch (error) {
    next(error);
  }
});

// ============ EXPORTS ============

// GET /api/admin/leaderboard/:eventId/export - Export leaderboard as PDF
router.get('/leaderboard/:eventId/export', async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch leaderboard for this event
    const players = await User.find({ 
      eventId, 
      role: 'player' 
    })
      .select('username score createdAt')
      .sort({ score: -1, createdAt: 1 });

    if (players.length === 0) {
      return res.status(400).json({ message: 'No players found for this event' });
    }

    // Get solve counts for each player
    const leaderboard = await Promise.all(
      players.map(async (player, index) => {
        const solveCount = await Submission.countDocuments({
          userId: player._id,
          isCorrect: true
        });

        return {
          rank: index + 1,
          username: player.username,
          score: player.score,
          solveCount
        };
      })
    );

    // Generate PDF
    const doc = new PDFDocument({
      bufferPages: true,
      margin: 50
    });

    // Set filename for download
    const filename = `leaderboard_${event.name.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe to response
    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Event Leaderboard', { align: 'center' });
    
    // Event info
    doc.fontSize(12).font('Helvetica').text(`Event: ${event.name}`, 50, 80);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 100);
    doc.text(`Total Players: ${leaderboard.length}`, 50, 120);

    // Table header
    const tableTop = 160;
    const col1X = 50;    // Rank
    const col2X = 120;   // Username
    const col3X = 280;   // Solves
    const col4X = 380;   // Score

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Rank', col1X, tableTop);
    doc.text('Username', col2X, tableTop);
    doc.text('Solves', col3X, tableTop);
    doc.text('Score', col4X, tableTop);

    // Horizontal line under header
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    // Table rows
    let yPosition = tableTop + 30;
    const rowHeight = 20;

    doc.fontSize(10).font('Helvetica');
    leaderboard.forEach((player) => {
      doc.text(`#${player.rank}`, col1X, yPosition);
      doc.text(player.username, col2X, yPosition);
      doc.text(player.solveCount.toString(), col3X, yPosition);
      doc.text(player.score.toString(), col4X, yPosition);
      yPosition += rowHeight;

      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Footer
    doc.fontSize(9).font('Helvetica').fillColor('#999');
    doc.text(`Generated on ${new Date().toISOString()}`, 50, doc.page.height - 30);

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;
