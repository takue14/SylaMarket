import mongoose from 'mongoose';

const deliveryGuySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.DeliveryGuy || mongoose.model('DeliveryGuy', deliveryGuySchema);