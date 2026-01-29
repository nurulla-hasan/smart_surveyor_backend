import mongoose from 'mongoose';

const savedMapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a map name'],
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('SavedMap', savedMapSchema);
