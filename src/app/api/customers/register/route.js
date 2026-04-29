import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectToDB();
    const { name, email, password, address, phone } = await req.json();

    const existing = await Customer.findOne({ email });
    if (existing) return NextResponse.json({ message: 'Email already exists' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const newCustomer = await Customer.create({ name, email, password: hashed, address, phone });

    return NextResponse.json({ customerId: newCustomer._id, message: 'Registered successfully' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: 'Registration error' }, { status: 500 });
  }
}