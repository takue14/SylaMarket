import mongoose, { Schema, Model, Document } from 'mongoose';

export type OtpPurpose = 'signup-verify' | 'password-reset' | 'login-verify';

export interface OtpDoc extends Document {
  identifier: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumed: boolean;
}

const OtpSchema = new Schema<OtpDoc>(
  {
    identifier: { type: String, required: true },
    purpose: { type: String, enum: ['signup-verify', 'password-reset', 'login-verify'], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSchema.index({ identifier: 1, purpose: 1 }, { unique: true });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 }); // housekeeping only

export const Otp: Model<OtpDoc> = mongoose.models.Otp || mongoose.model<OtpDoc>('Otp', OtpSchema);