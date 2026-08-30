import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/mongoose';
import { Admin } from '@/models/Admin';
import { signSession, sessionCookieName, sessionCookieOptions } from '@/lib/jwt';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rate = await checkRateLimit({ key: `login:admin:ip:${ip}`, maxAttempts: 5, windowSeconds: 3600, blockSeconds: 3600 });
    if (!rate.allowed) {
      return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const admin = await Admin.findOne({ email: normalized });
    if (!admin) return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });

    const token = await signSession({ id: admin._id.toString(), role: 'admin' });
    const response = NextResponse.json({ message: 'Logged in.', name: admin.name });
   response.cookies.set(sessionCookieName('admin'), token, sessionCookieOptions('admin'));
    return response;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ message: 'Login failed.' }, { status: 500 });
  }
}