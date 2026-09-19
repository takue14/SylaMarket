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

    const normalized = contact.trim().toLowerCase();
    const result = await verifyOtp(contact, 'login-verify', code, `${role}:${normalized}`);

    if (!result.valid) {
      const messages: Record<string, string> = {
        not_found: 'No login attempt found for this contact. Please sign in again.',
        expired: 'This code has expired. Please sign in again to get a new one.',
        too_many_attempts: 'Too many incorrect attempts. Please sign in again.',
        mismatch: 'Incorrect code.',
      };
      return NextResponse.json({ message: messages[result.reason] }, { status: 400 });
    }

    // The account and role that actually gets signed in come from what was
    // bound to the OTP record at issuance (a real DB lookup at that time),
    // never from the client-supplied `role` — this is what prevents a code
    // issued for one role/account being redeemed as a different one, even
    // if the same contact exists across multiple role collections.
    if (!result.accountId || !result.role) {
      return NextResponse.json({ message: 'This code is not valid for a login session.' }, { status: 400 });
    }

    const boundEntry = ROLE_REGISTRY[result.role as AuthRole];
    if (!boundEntry) return NextResponse.json({ message: 'Invalid account role.' }, { status: 400 });

    await connectToDB();
    const user = await boundEntry.model.findById(result.accountId);
    if (!user) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });

    if (
      (result.role === 'seller' || result.role === 'delivery') &&
      (user as { verificationStatus?: string }).verificationStatus !== 'approved'
    ) {
      return NextResponse.json({ message: 'Your account is no longer approved to sign in.' }, { status: 403 });
    }

    const token = await signSession({ id: user._id.toString(), role: boundEntry.sessionRole });
    const trustToken = await signTrustedDevice({ contact: normalized, role: boundEntry.sessionRole });

    const response = NextResponse.json({
      message: 'Signed in.',
      [boundEntry.idKey]: user._id.toString(),
    });
    response.cookies.set(sessionCookieName(boundEntry.sessionRole), token, sessionCookieOptions(boundEntry.sessionRole));
    response.cookies.set(trustedDeviceCookieName(boundEntry.sessionRole), trustToken, trustedDeviceCookieOptions());
    return response;
  } catch (err) {
    console.error('verify-login-otp error:', err);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}