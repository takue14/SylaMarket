import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Wishlist from '@/models/Wishlist';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ wishlisted: [] });

  await connectToDB();
  const entries = await Wishlist.find({ customer: session.id }).select('product');
  return NextResponse.json({ wishlisted: entries.map((e) => e.product) });
}