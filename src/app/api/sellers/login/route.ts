import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import bcrypt from 'bcryptjs';
import { issueOtp } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';
import { trustedDeviceCookieName, verifyTrustedDevice } from '@/lib/trustedDevice';
import { normalizePhone } from '@/lib/phone';
import { isEmail } from '@/lib/otpService';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { contact, password } = await req.json();
    if (!contact || !password) {
      return NextResponse.json({ message: 'Contact and password are required.' }, { status: 400 });
    }

    let normalized = contact.trim().toLowerCase();
    if (!isEmail(normalized)) {
      const phoneNormalized = normalizePhone(normalized);
      if (phoneNormalized) normalized = phoneNormalized;
    }

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rateIp = await checkRateLimit({ key: `login:seller:ip:${ip}`, maxAttempts: 10, windowSeconds: 3600, blockSeconds: 3600 });
    const rateId = await checkRateLimit({ key: `login:seller:id:${normalized}`, maxAttempts: 8, windowSeconds: 3600, blockSeconds: 3600 });
    if (!rateIp.allowed || !rateId.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const seller = await Seller.findOne({ contact: normalized });
    if (!seller) return NextResponse.json({ message: 'Seller not found' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) return NextResponse.json({ message: 'Invalid password' }, { status: 401 });

    if (!seller.contactVerified) {
      await issueOtp(normalized, 'signup-verify').catch((err) => console.error('resend signup OTP failed:', err));
      return NextResponse.json(
        { message: 'Please verify your contact before signing in.', needsVerification: true, purpose: 'signup-verify', contact: normalized },
        { status: 403 }
      );
    }
    if (seller.verificationStatus === 'pending') {
      return NextResponse.json({ message: 'Your account is pending admin approval.' }, { status: 403 });
    }
    if (seller.verificationStatus === 'rejected') {
      return NextResponse.json(
        { message: seller.rejectionReason ? `Your application was not approved: ${seller.rejectionReason}` : 'Your seller application was not approved.' },
        { status: 403 }
      );
    }

    const trustedToken = req.cookies.get(trustedDeviceCookieName('seller'))?.value;
    const trusted = trustedToken ? await verifyTrustedDevice(trustedToken) : null;

    if (trusted && trusted.contact === normalized && trusted.role === 'seller') {
      const token = await signSession({ id: seller._id.toString(), role: 'seller' });
      const response = NextResponse.json({ message: 'Logged in', sellerId: seller._id.toString() });
      response.cookies.set(sessionCookieName('seller'), token, sessionCookieOptions('seller'));
      return response;
    }

    await issueOtp(normalized, 'login-verify').catch((err) => console.error('login OTP send failed:', err));
    return NextResponse.json({
      message: 'Enter the code we sent to finish signing in.',
      requiresOtp: true,
      contact: normalized,
      role: 'seller',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}