import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectToDB();
    const { email, password } = await req.json();

    const customer = await Customer.findOne({ email });
    if (!customer) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const match = await bcrypt.compare(password, customer.password);
    if (!match) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    return NextResponse.json({ customerId: customer._id, message: 'Login successful' }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: 'Login error' }, { status: 500 });
  }
}