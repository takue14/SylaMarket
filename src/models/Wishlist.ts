import mongoose, { Schema, Model, Document } from 'mongoose';

export interface WishlistDoc extends Document {
  customer: string;
  product: string;
  notifiedBackInStock: boolean;
  createdAt: Date;
  notifyBackInStock: boolean;
}

const wishlistSchema = new Schema<WishlistDoc>({
  customer: { type: String, required: true },
  product: { type: String, required: true },
  notifiedBackInStock: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
    notifyBackInStock: { type: Boolean, default: true }, // opted in by default when wishlisting; can be turned off
});

wishlistSchema.index({ customer: 1, product: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model<WishlistDoc>('Wishlist', wishlistSchema);