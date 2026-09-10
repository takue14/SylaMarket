import mongoose, { Schema, Document } from 'mongoose';

export interface AddressDoc extends Document {
  customer: string;
  label: string;
  fullAddress: string;
  contact: string;
  isDefault: boolean;
  createdAt: Date;
}

const addressSchema = new Schema<AddressDoc>({
  customer: { type: String, required: true },
  label: { type: String, required: true },
  fullAddress: { type: String, required: true },
  contact: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Address || mongoose.model<AddressDoc>('Address', addressSchema);