import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import { requireRole } from '@/lib/session';

export async function GET() {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const deliveryGuys = await DeliveryGuy.find({ verificationStatus: 'pending' })
    .select('name contact idPhotoUrl livePhotoUrl createdAt')
    .sort({ createdAt: 1 });

  return NextResponse.json({ deliveryGuys });
}