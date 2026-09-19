import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Inquiry from '@/models/Inquiry';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const inquiries = await Inquiry.find().sort({ timestamp: -1 });
  return NextResponse.json(inquiries);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
      return NextResponse.json({ message: 'Name, email, and message are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const newInquiry = await Inquiry.create({
      name: body.name.trim(),
      email: body.email.trim(),
      message: body.message.trim(),
    });
    return NextResponse.json(newInquiry, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to save inquiry' }, { status: 500 });
  }
}