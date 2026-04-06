import mongoose from 'mongoose';

const unlockedHintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  hintIndex: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to check if user has unlocked a specific hint
unlockedHintSchema.index({ userId: 1, challengeId: 1, hintIndex: 1 }, { unique: true });

const UnlockedHint = mongoose.model('UnlockedHint', unlockedHintSchema);

export default UnlockedHint;
