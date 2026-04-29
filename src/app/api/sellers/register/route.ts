// app/api/sellers/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Seller } from '@/models/Seller';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { name, businessName, contact, password } = await req.json();
    // Hash password ideally with bcrypt here
    const newSeller = await Seller.create({ name, businessName, contact, password });
    return NextResponse.json(newSeller, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error registering seller' }, { status: 500 });
  }
}