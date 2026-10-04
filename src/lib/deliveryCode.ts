import crypto from 'crypto';

export function generateDeliveryCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

export function hashDeliveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function verifyDeliveryCode(code: string, hash: string): boolean {
  return hashDeliveryCode(code) === hash;
}