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

    return NextResponse.json({
      message: 'Login successful',
      deliveryGuyId: deliveryGuy._id.toString(),
    });

  } catch (error) {
    console.error('Delivery login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}