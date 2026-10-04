import mongoose, { Schema } from 'mongoose';

const driverEarningSchema = new Schema({
  driver: { type: Schema.Types.ObjectId, ref: 'DeliveryGuy', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true }, // idempotency
  fee: { type: Number, required: true },
  distanceKm: { type: Number, default: null },
  orderValue: { type: Number, required: true },
  deliveredAt: { type: Date, default: Date.now },
  weekStart: { type: Date, required: true }, // Monday 00:00 UTC of the delivery week
    status: { type: String, enum: ['unpaid', 'processing', 'paid'], default: 'unpaid' },
  paidAt: { type: Date, default: null },
  paidBy: { type: String, default: null },
  note: { type: String, default: '' },
    payoutReference: { type: String, default: null },
  processedBy: { type: String, default: null },
});

driverEarningSchema.index({ driver: 1, weekStart: 1, status: 1 });

export default mongoose.models.DriverEarning || mongoose.model('DriverEarning', driverEarningSchema);