// src/app/api/customers/register/route.ts
import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { name, email, password, address, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = await Customer.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      address,
      phone
    });

    return NextResponse.json({
      message: 'Account created successfully',
      customerId: newCustomer._id
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}