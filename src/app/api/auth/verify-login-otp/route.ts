import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { verifyOtp } from '@/lib/otpService';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';
import { ROLE_REGISTRY, AuthRole } from '@/lib/roleRegistry';
import { signTrustedDevice, trustedDeviceCookieName, trustedDeviceCookieOptions } from '@/lib/trustedDevice';

export async function POST(req: NextRequest) {
  try {
    const { role, contact, code } = await req.json();
    if (!role || !contact || !code || !(role in ROLE_REGISTRY)) {
      return NextResponse.json({ message: 'Role, contact, and code are required.' }, { status: 400 });
    }
    const entry = ROLE_REGISTRY[role as AuthRole];

    const result = await verifyOtp(contact, 'login-verify', code);
    if (!result.valid) {
      const messages: Record<string, string> = {
        not_found: 'No login attempt found for this contact. Please sign in again.',
        expired: 'This code has expired. Please sign in again to get a new one.',
        too_many_attempts: 'Too many incorrect attempts. Please sign in again.',
        mismatch: 'Incorrect code.',
      };
      return NextResponse.json({ message: messages[result.reason] }, { status: 400 });
    }

    await connectToDB();
    const normalized = contact.trim().toLowerCase();
    const user = await entry.model.findOne({ [entry.contactField]: normalized });
    if (!user) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });

    const token = await signSession({ id: user._id.toString(), role: entry.sessionRole });
    const trustToken = await signTrustedDevice({ contact: normalized, role: entry.sessionRole });

    const response = NextResponse.json({
      message: 'Signed in.',
      [entry.idKey]: user._id.toString(),
    });
    response.cookies.set(sessionCookieName(entry.sessionRole), token, sessionCookieOptions(entry.sessionRole));
    response.cookies.set(trustedDeviceCookieName(entry.sessionRole), trustToken, trustedDeviceCookieOptions());
    return response;
  } catch (err) {
    console.error('verify-login-otp error:', err);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}