import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ message: 'Phone and password are required' }, { status: 400 });
    }

    const deliveryGuy = await DeliveryGuy.findOne({ phone });

    if (!deliveryGuy) {
      return NextResponse.json({ message: 'Invalid phone or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, deliveryGuy.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid phone or password' }, { status: 401 });
    }

    const response = NextResponse.json({
      message: 'Login successful',
      deliveryGuyId: deliveryGuy._id.toString(),
    });

    response.cookies.set('deliveryGuyId', deliveryGuy._id.toString(), {
      httpOnly: true,                                    // not accessible via JS — safer against XSS
      secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
      sameSite: 'lax',                                   // protects against CSRF
      path: '/',                                         // available site-wide
      maxAge: 60 * 60 * 24 * 30,                        // 30 days — user stays logged in
    });

    return response;

  } catch (error) {
    console.error('Delivery login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}