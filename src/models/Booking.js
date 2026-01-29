import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a booking title'],
    trim: true
  },
  description: String,
  bookingDate: {
    type: Date,
    required: [true, 'Please add a booking date'],
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'pending', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  propertyAddress: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  amountReceived: {
    type: Number,
    default: 0
  },
  amountDue: {
    type: Number,
    default: 0
  },
  paymentNote: String
}, { timestamps: true });

bookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'clientId',
    select: 'name email phone'
  });
  next();
});

export default mongoose.model('Booking', bookingSchema);
