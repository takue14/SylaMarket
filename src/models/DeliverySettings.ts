import mongoose, { Schema } from 'mongoose';

const deliverySettingsSchema = new Schema({
  key: { type: String, default: 'default', unique: true },
  baseFee: { type: Number, default: 1 },
  ratePerKm: { type: Number, default: 0.5 },
  valuePct: { type: Number, default: 0.03 }, // fraction: 0.03 = 3% of order value
  valueCap: { type: Number, default: 3 },
  rankingMode: { type: String, enum: ['fee', 'efficiency', 'blended'], default: 'blended' },
  feeWeight: { type: Number, default: 0.6, min: 0, max: 1 }, // blended: 1 = only fee, 0 = only closeness
    commissionRate: { type: Number, default: 0.08, min: 0, max: 0.5 },
  customerDeliveryFee: { type: Number, default: 0.5, min: 0 },
  instantBaseFee: { type: Number, default: 2, min: 0 },
  instantPerItemFee: { type: Number, default: 0.5, min: 0 },
  updatedAt: { type: Date, default: Date.now },

});

export default mongoose.models.DeliverySettings || mongoose.model('DeliverySettings', deliverySettingsSchema);