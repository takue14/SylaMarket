// src/app/api/use/route.ts (fixed: remove unused req)
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { UserModel2 } from '@/models/User2';

export async function GET() {
  try {
    await connectToDatabase();
    const userData2 = await UserModel2.find({}, 'name dob age');
    console.log(userData2);
    return NextResponse.json(userData2);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
  }
}