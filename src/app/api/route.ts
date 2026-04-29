// src/app/api/route.ts (fixed: add NextRequest import)
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    // projection: second argument 'name age' means only these fields + _id
    const userData = await UserModel.find({}, 'name age');
    console.log(userData);
    return NextResponse.json(userData);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Get data from request body
    const { name, age } = await req.json();

    // Validate (basic)
    if (!name || !age) {
      return NextResponse.json({ message: 'name and age are required' }, { status: 400 });
    }

    // Create new document using model
    const newUser = await UserModel.create({ name, age });

    return NextResponse.json(newUser, { status: 201 }); // send the saved doc back
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}