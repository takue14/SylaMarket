import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Inquiry from '@/models/Inquiry';

export async function GET() {
  await connectToDatabase();
  const inquiries = await Inquiry.find().sort({ timestamp: -1 });
  return NextResponse.json(inquiries);
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const newInquiry = await Inquiry.create(body);
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to save inquiry' }, { status: 500 });
  }
}