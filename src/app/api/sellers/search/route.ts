import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const query: Record<string, unknown> = { verificationStatus: 'approved' };

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { businessName: { $regex: escaped, $options: 'i' } },
      { name: { $regex: escaped, $options: 'i' } },
    ];
  }

  const sellers = await Seller.find(query).select('businessName name').limit(30);
  return NextResponse.json(sellers);
}