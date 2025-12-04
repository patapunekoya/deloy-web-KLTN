import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  unsubscribedAt: { type: Date }
});

export default mongoose.model('Subscriber', subscriberSchema);
