import mongoose from 'mongoose';

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  image: { type: String, required: true },
  buttonText: { type: String, default: 'BUY NOW' },
  badge: { type: String },
  badgeColor: { type: String, default: '#ef4444' },
  isLarge: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Ad || mongoose.model('Ad', adSchema);