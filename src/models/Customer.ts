import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);