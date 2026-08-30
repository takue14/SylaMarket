import mongoose, { Schema, Model, Document } from 'mongoose';

export type SellerVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerDoc extends Document {
  name: string;
  businessName: string;
  contact: string;
  password: string;
  ecocashNumber: string;
  idPhotoUrl: string;
  livePhotoUrl: string;
  contactVerified: boolean;
  verificationStatus: SellerVerificationStatus;
  rejectionReason?: string;
  country?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
}

const sellerSchema = new Schema<SellerDoc>({
  name: { type: String, required: true },
  businessName: { type: String, required: true },
  contact: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  ecocashNumber: { type: String, required: true },
  idPhotoUrl: { type: String, required: true },
  livePhotoUrl: { type: String, required: true },
  contactVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  country: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  createdAt: { type: Date, default: Date.now },
});
  


export const Seller: Model<SellerDoc> = mongoose.models.Seller || mongoose.model<SellerDoc>('Seller', sellerSchema);