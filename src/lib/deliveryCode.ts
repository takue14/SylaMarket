import crypto from 'crypto';

const CODE_DIGITS = 6;
const CODE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — long enough for a real delivery window
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function generateDeliveryCode(): string {
  const max = 10 ** CODE_DIGITS;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(CODE_DIGITS, '0');
}

export function hashDeliveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function deliveryCodeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MS);
}

export function deliveryCodeLockoutUntil(): Date {
  return new Date(Date.now() + LOCKOUT_MS);
}

export const DELIVERY_CODE_MAX_ATTEMPTS = MAX_ATTEMPTS;

export function verifyDeliveryCode(code: string, hash: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  // Constant-time comparison — avoid leaking timing information about
  // how many leading digits matched.
  const a = Buffer.from(hashDeliveryCode(code));
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}