import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import bcrypt from 'bcryptjs';
import { issueOtp } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';
import { trustedDeviceCookieName, verifyTrustedDevice } from '@/lib/trustedDevice';
import { normalizePhone } from '@/lib/phone';
import { isEmail } from '@/lib/otpService';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
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
    const rateIp = await checkRateLimit({ key: `login:delivery:ip:${ip}`, maxAttempts: 10, windowSeconds: 3600, blockSeconds: 3600 });
    const rateId = await checkRateLimit({ key: `login:delivery:id:${normalized}`, maxAttempts: 8, windowSeconds: 3600, blockSeconds: 3600 });
    if (!rateIp.allowed || !rateId.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const deliveryGuy = await DeliveryGuy.findOne({ contact: normalized });
    if (!deliveryGuy) return NextResponse.json({ message: 'Invalid contact or password' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, deliveryGuy.password);
    if (!isMatch) return NextResponse.json({ message: 'Invalid contact or password' }, { status: 401 });

    if (!deliveryGuy.contactVerified) {
      await issueOtp(normalized, 'signup-verify').catch((err) => console.error('resend signup OTP failed:', err));
      return NextResponse.json(
        { message: 'Please verify your contact before signing in.', needsVerification: true, purpose: 'signup-verify', contact: normalized },
        { status: 403 }
      );
    }
    if (deliveryGuy.verificationStatus === 'pending') {
      return NextResponse.json({ message: 'Your account is pending admin approval.' }, { status: 403 });
    }
    if (deliveryGuy.verificationStatus === 'rejected') {
      return NextResponse.json(
        { message: deliveryGuy.rejectionReason ? `Your application was not approved: ${deliveryGuy.rejectionReason}` : 'Your delivery application was not approved.' },
        { status: 403 }
      );
    }

    const trustedToken = req.cookies.get(trustedDeviceCookieName('delivery'))?.value;
    const trusted = trustedToken ? await verifyTrustedDevice(trustedToken) : null;

    if (trusted && trusted.contact === normalized && trusted.role === 'delivery') {
      const token = await signSession({ id: deliveryGuy._id.toString(), role: 'delivery' });
      const response = NextResponse.json({ message: 'Logged in', deliveryGuyId: deliveryGuy._id.toString() });
      response.cookies.set(sessionCookieName('delivery'), token, sessionCookieOptions('delivery'));
      return response;
    }

    await issueOtp(normalized, 'login-verify').catch((err) => console.error('login OTP send failed:', err));
    return NextResponse.json({
      message: 'Enter the code we sent to finish signing in.',
      requiresOtp: true,
      contact: normalized,
      role: 'delivery',
    });
  } catch (err) {
    console.error('Delivery login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}