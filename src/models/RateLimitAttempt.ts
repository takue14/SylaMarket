import mongoose, { Schema, Model, Document } from 'mongoose';

export interface RateLimitAttemptDoc extends Document {
  key: string;
  count: number;
  windowStart: Date;
  blockedUntil?: Date | null;
}

const RateLimitAttemptSchema = new Schema<RateLimitAttemptDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 1 },
    windowStart: { type: Date, required: true },
    blockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// Housekeeping only — windows are short-lived, this just stops the
// collection growing unbounded over time.
RateLimitAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const RateLimitAttempt: Model<RateLimitAttemptDoc> =
  mongoose.models.RateLimitAttempt || mongoose.model<RateLimitAttemptDoc>('RateLimitAttempt', RateLimitAttemptSchema);