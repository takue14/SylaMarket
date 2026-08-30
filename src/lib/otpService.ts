import crypto from 'crypto';
import { connectToDB } from './mongoose';
import { Otp, OtpPurpose } from '../models/Otp';
export type { OtpPurpose };
import { generateOtp, otpExpiry, isOtpExpired } from './otp';
import { sendOtpEmail } from './mailer';
import { sendOtpSms } from './sms';
import { checkRateLimit } from './rateLimit';

function normalize(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function isEmail(identifier: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function issueOtp(rawIdentifier: string, purpose: OtpPurpose, recordKeyOverride?: string) {
  await connectToDB();
  const deliveryTarget = normalize(rawIdentifier); // where the code actually gets sent
  const recordKey = recordKeyOverride ?? deliveryTarget; // what the OTP record is stored/looked-up under

  const rate = await checkRateLimit({
    key: `otp:${purpose}:${recordKey}`,
    maxAttempts: 5,
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
  });
  if (!rate.allowed) return { sent: false as const, retryAfterSeconds: rate.retryAfterSeconds };

  const code = generateOtp();
  await Otp.findOneAndUpdate(
    { identifier: recordKey, purpose },
    { identifier: recordKey, purpose, codeHash: hashCode(code), expiresAt: otpExpiry(10), attempts: 0, consumed: false },
    { upsert: true }
  );

  if (isEmail(deliveryTarget)) await sendOtpEmail(deliveryTarget, code);
  else await sendOtpSms(deliveryTarget, code);

  return { sent: true as const };
}

export type OtpVerifyResult =
  | { valid: true }
  | { valid: false; reason: 'not_found' | 'expired' | 'too_many_attempts' | 'mismatch' };

export async function verifyOtp(rawIdentifier: string, purpose: OtpPurpose, code: string, recordKeyOverride?: string): Promise<OtpVerifyResult> {
  await connectToDB();
  const recordKey = recordKeyOverride ?? normalize(rawIdentifier);

  const record = await Otp.findOne({ identifier: recordKey, purpose });
  if (!record || record.consumed) return { valid: false, reason: 'not_found' };
  if (isOtpExpired(record.expiresAt)) return { valid: false, reason: 'expired' };
  if (record.attempts >= 5) return { valid: false, reason: 'too_many_attempts' };

  if (record.codeHash !== hashCode(code)) {
    record.attempts += 1;
    await record.save();
    return { valid: false, reason: 'mismatch' };
  }

  record.consumed = true;
  await record.save();
  return { valid: true };
}