import { NextRequest, NextResponse } from 'next/server';
import { issueOtp, OtpPurpose } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';

const VALID_PURPOSES: OtpPurpose[] = ['signup-verify', 'password-reset'];

export async function POST(req: NextRequest) {
  try {
    const { contact, purpose } = await req.json();
    if (!contact || typeof contact !== 'string') {
      return NextResponse.json({ message: 'Contact is required.' }, { status: 400 });
    }
    if (!VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ message: 'Invalid purpose.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rate = await checkRateLimit({
      key: `resend-otp:ip:${ip}`,
      maxAttempts: 8,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { message: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // issueOtp has its own per-identifier rate limit (5/hour) baked in, so a
    // resend spam-click can't bypass that separately — this IP-level limit
    // is a second, coarser layer on top.
    const result = await issueOtp(contact, purpose as OtpPurpose);

    if (!result.sent) {
      return NextResponse.json(
        { message: `Too many codes requested for this contact. Try again in ${result.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    return NextResponse.json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error('resend-otp error:', err);
    return NextResponse.json({ message: 'Could not resend code. Please try again.' }, { status: 500 });
  }
}