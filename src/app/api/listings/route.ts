import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Listing } from '@/models/Listing';

export async function GET(req: NextRequest) {
  await connectToDB();
  const type = req.nextUrl.searchParams.get('type');
  const query: Record<string, unknown> = { status: 'published' };
  if (type) query.type = type;
  const listings = await Listing.find(query).sort({ createdAt: -1 });
  return NextResponse.json({ listings });
}