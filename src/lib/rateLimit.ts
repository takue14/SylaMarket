import { connectToDB } from './mongoose';
import { RateLimitAttempt } from '../models/RateLimitAttempt';


export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  // Take only the first IP in a comma-separated forwarded-for chain, and
  // trim whitespace — never use the whole header verbatim as a key.
  const candidate = realIp || forwarded?.split(',')[0]?.trim() || 'unknown';
  return candidate;
}

interface RateLimitOptions {
  /** Unique key per action+identity, e.g. `login:seller:someone@example.com` or `login:ip:1.2.3.4` */
  key: string;
  maxAttempts: number;
  windowSeconds: number;
  /** How long to block once maxAttempts is exceeded within the window */
  blockSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Call this BEFORE doing the expensive/sensitive work (password compare,
 * sending an OTP, etc). Increments the attempt counter atomically so
 * concurrent requests can't race past the limit.
 */
import crypto from 'crypto';

function hashKey(key: string): string {
  const secret = process.env.JWT_SECRET!; // reuse the existing app secret — no new env var needed
  return crypto.createHmac('sha256', secret).update(key).digest('hex');
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  await connectToDB();
  const hashedKey = hashKey(opts.key);
  opts = { ...opts, key: hashedKey };

  const now = new Date();

  const windowStartCutoff = new Date(now.getTime() - opts.windowSeconds * 1000);

  const existing = await RateLimitAttempt.findOne({ key: opts.key });

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000),
    };
  }

  if (!existing || existing.windowStart < windowStartCutoff) {
    // Start a fresh window
    await RateLimitAttempt.findOneAndUpdate(
      { key: opts.key },
      { key: opts.key, count: 1, windowStart: now, $unset: { blockedUntil: '' } },
      { upsert: true }
    );
    return { allowed: true };
  }

  const updated = await RateLimitAttempt.findOneAndUpdate(
    { key: opts.key },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (updated && updated.count > opts.maxAttempts) {
    const blockedUntil = new Date(now.getTime() + opts.blockSeconds * 1000);
    updated.blockedUntil = blockedUntil;
    await updated.save();
    return { allowed: false, retryAfterSeconds: opts.blockSeconds };
  }

  return { allowed: true };
}
