import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectToDB();
    const { name, phone, password } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await DeliveryGuy.findOne({ phone });
    if (existing) {
      return NextResponse.json({ message: 'Phone number already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newGuy = await DeliveryGuy.create({
      name,
      phone,
      password: hashedPassword
    });

    return NextResponse.json({ 
      deliveryGuyId: newGuy._id, 
      message: 'Registration successful' 
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: 'Registration error' }, { status: 500 });
  }
}