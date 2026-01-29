import mongoose from 'mongoose';

const calculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  type: {
    type: String,
    required: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  resultData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Calculation', calculationSchema);
