import mongoose, { Schema, Document } from 'mongoose';

export interface ConversationDoc extends Document {
  buyer: string;
  seller: string;
  lastMessage: string;
  lastMessageAt: Date;
  buyerUnread: number;
  sellerUnread: number;
  createdAt: Date;
}

const conversationSchema = new Schema<ConversationDoc>({
  buyer: { type: String, required: true },
  seller: { type: String, required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  buyerUnread: { type: Number, default: 0 },
  sellerUnread: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

conversationSchema.index({ buyer: 1, seller: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });

export default mongoose.models.Conversation || mongoose.model<ConversationDoc>('Conversation', conversationSchema);