import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, businessName, contact, password } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = await Seller.create({
      name,
      businessName,
      contact,
      password: hashedPassword,
    });

    return NextResponse.json(newSeller, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error registering seller' }, { status: 500 });
  }
}