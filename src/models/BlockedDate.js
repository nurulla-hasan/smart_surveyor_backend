import mongoose from 'mongoose';

const blockedDateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: String
}, { timestamps: true });

blockedDateSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('BlockedDate', blockedDateSchema);
