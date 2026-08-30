import mongoose, { Schema, Model, Document } from 'mongoose';

export type NotificationRole = 'customer' | 'seller' | 'delivery' | 'admin';

export interface NotificationDoc extends Document {
  userId: string;
  role: NotificationRole;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>({
  userId: { type: String, required: true },
  role: { type: String, enum: ['customer', 'seller', 'delivery', 'admin'], required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, role: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<NotificationDoc>('Notification', notificationSchema);