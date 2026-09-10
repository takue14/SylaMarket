import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Address from '@/models/Address';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectToDB();
  const addresses = await Address.find({ customer: session.id }).sort({ isDefault: -1, createdAt: -1 });
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { label, fullAddress, contact, isDefault } = await req.json();
    if (!label?.trim() || !fullAddress?.trim() || !contact?.trim()) {
      return NextResponse.json({ message: 'Label, address, and contact are required.' }, { status: 400 });
    }

    await connectToDB();
    if (isDefault) {
      await Address.updateMany({ customer: session.id }, { isDefault: false });
    }
    const address = await Address.create({ customer: session.id, label, fullAddress, contact, isDefault: !!isDefault });
    return NextResponse.json(address, { status: 201 });
  } catch (err) {
    console.error('Create address error:', err);
    return NextResponse.json({ message: 'Failed to save address.' }, { status: 500 });
  }
}