// src/app/api/customers/login/route.ts
import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() });

    if (!customer) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Success
    const response = NextResponse.json({
      message: 'Login successful',
      customerId: customer._id,
      name: customer.name,
      email: customer.email
    }, { status: 200 });

    // Set cookie
    response.cookies.set('customerId', customer._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}