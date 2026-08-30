import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { issueOtp } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';
import { trustedDeviceCookieName, verifyTrustedDevice } from '@/lib/trustedDevice';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }
    const normalized = email.toLowerCase().trim();

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rateIp = await checkRateLimit({ key: `login:customer:ip:${ip}`, maxAttempts: 10, windowSeconds: 3600, blockSeconds: 3600 });
    const rateId = await checkRateLimit({ key: `login:customer:id:${normalized}`, maxAttempts: 8, windowSeconds: 3600, blockSeconds: 3600 });
    if (!rateIp.allowed || !rateId.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const customer = await Customer.findOne({ email: normalized });
    if (!customer) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!customer.password) {
      return NextResponse.json(
        { message: 'This account uses Google sign-in. Please continue with Google instead.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const trustedToken = req.cookies.get(trustedDeviceCookieName('customer'))?.value;
    const trusted = trustedToken ? await verifyTrustedDevice(trustedToken) : null;

    if (trusted && trusted.contact === normalized && trusted.role === 'customer') {
      const token = await signSession({ id: customer._id.toString(), role: 'customer' });
      const response = NextResponse.json({ message: 'Logged in', customerId: customer._id.toString() });
      response.cookies.set(sessionCookieName('customer'), token, sessionCookieOptions('customer'));
      return response;
    }

    await issueOtp(normalized, 'login-verify').catch((err) => console.error('login OTP send failed:', err));
    return NextResponse.json({
      message: 'Enter the code we sent to finish signing in.',
      requiresOtp: true,
      contact: normalized,
      role: 'buyer',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}