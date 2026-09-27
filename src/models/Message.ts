import mongoose, { Schema, Document } from 'mongoose';

export interface MessageDoc extends Document {
  conversation: string;
  senderRole: 'buyer' | 'seller';
  senderId: string;
  text: string;
  read: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDoc>({
  conversation: { type: String, required: true },
  senderRole: { type: String, enum: ['buyer', 'seller'], required: true },
  senderId: { type: String, required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model<MessageDoc>('Message', messageSchema);