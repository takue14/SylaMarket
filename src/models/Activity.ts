import mongoose, { Schema, Model, Document } from 'mongoose';

export type ActivityType = 'view' | 'add_to_cart' | 'wishlist' | 'purchase' | 'login';

export interface ActivityDoc extends Document {
  customer: string;
  type: ActivityType;
  product?: string;
  productName?: string;
  productImage?: string;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityDoc>({
  customer: { type: String, required: true },
  type: { type: String, enum: ['view', 'add_to_cart', 'wishlist', 'purchase', 'login'], required: true },
  product: { type: String },
  productName: { type: String },
  productImage: { type: String },
  createdAt: { type: Date, default: Date.now },
});

activitySchema.index({ customer: 1, createdAt: -1 });
// TTL cleanup — activity older than 90 days is pruned automatically so this
// collection doesn't grow forever for an active user base.
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.models.Activity || mongoose.model<ActivityDoc>('Activity', activitySchema);