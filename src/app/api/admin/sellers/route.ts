import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import { requireRole } from '@/lib/session';

export async function GET() {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const sellers = await Seller.find({ verificationStatus: 'pending' })
    .select('name businessName contact ecocashNumber idPhotoUrl livePhotoUrl createdAt')
    .sort({ createdAt: 1 });

  return NextResponse.json({ sellers });
}