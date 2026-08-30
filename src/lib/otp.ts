import crypto from 'crypto';

/**
 * 6-digit numeric OTP using a CSPRNG, not Math.random() — Math.random()
 * is not cryptographically secure and OTP codes are a security boundary.
 */
export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

export function otpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOtpExpired(expiry: Date | null | undefined): boolean {
  if (!expiry) return true;
  return expiry.getTime() < Date.now();
}
