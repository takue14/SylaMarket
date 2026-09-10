import mongoose, { Schema, Document } from 'mongoose';

export interface PushSubscriptionDoc extends Document {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema<PushSubscriptionDoc>({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PushSubscription ||
  mongoose.model<PushSubscriptionDoc>('PushSubscription', pushSubscriptionSchema);