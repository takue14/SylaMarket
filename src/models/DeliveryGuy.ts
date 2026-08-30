import mongoose, { Schema, Model, Document } from 'mongoose';

export type DeliveryVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DeliveryGuyDoc extends Document {
  name: string;
  contact: string;
  password: string;
  idPhotoUrl: string;
  livePhotoUrl: string;
  contactVerified: boolean;
  verificationStatus: DeliveryVerificationStatus;
  rejectionReason?: string;
  country?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: Date;
}

const deliveryGuySchema = new Schema<DeliveryGuyDoc>({
  name: { type: String, required: true },
  contact: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
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

export default mongoose.models.DeliveryGuy || mongoose.model<DeliveryGuyDoc>('DeliveryGuy', deliveryGuySchema);