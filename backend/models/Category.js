import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#3b82f6' // Default primary blue
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique constraint: category name per event
categorySchema.index({ name: 1, eventId: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
