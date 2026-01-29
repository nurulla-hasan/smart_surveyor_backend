import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  title: {
    type: String,
    required: [true, 'Please add a report title'],
    trim: true
  },
  content: {
    type: String, 
    required: true
  },
  fileUrl: String
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
