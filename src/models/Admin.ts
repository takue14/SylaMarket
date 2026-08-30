import mongoose, { Schema, Model, Document } from 'mongoose';

export interface AdminDoc extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
}

const adminSchema = new Schema<AdminDoc>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Admin: Model<AdminDoc> = mongoose.models.Admin || mongoose.model<AdminDoc>('Admin', adminSchema);