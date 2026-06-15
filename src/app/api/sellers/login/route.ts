import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { contact, password } = await req.json();

    const seller = await Seller.findOne({ contact });
    if (!seller) return NextResponse.json({ message: 'Seller not found' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) return NextResponse.json({ message: 'Invalid password' }, { status: 401 });

    const response = NextResponse.json(
      { message: 'Logged in', sellerId: seller._id.toString() },
      { status: 200 }
    );

    response.cookies.set('sellerId', seller._id.toString(), {
      httpOnly: true,                                    // not accessible via JS — safer against XSS
      secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
      sameSite: 'lax',                                   // protects against CSRF
      path: '/',                                         // available site-wide
      maxAge: 60 * 60 * 24 * 30,                        // 30 days — user stays logged in
    });

    return response;

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}