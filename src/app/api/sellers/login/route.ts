// src/app/api/sellers/login/route.ts (fixed: use password, add placeholder for bcrypt)
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
// import bcrypt from 'bcrypt'; // Uncomment and install when ready

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { contact, password } = await req.json();
    const seller = await Seller.findOne({ contact });
    if (!seller) return NextResponse.json({ message: 'Seller not found' }, { status: 401 });

    // Placeholder: compare password (add bcrypt.compare(password, seller.password) when implemented)
    if (password !== seller.password) { // Direct compare for now (insecure; use bcrypt in prod)
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Logged in', sellerId: seller._id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}