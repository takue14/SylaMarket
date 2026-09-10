import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Activity from '@/models/Activity';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const activity = await Activity.find({ customer: session.id, type: 'view' })
    .sort({ createdAt: -1 })
    .limit(50);

  // de-duplicate by product, keep most recent occurrence only
  const seen = new Set<string>();
  const deduped = activity.filter((a) => {
    if (!a.product || seen.has(a.product)) return false;
    seen.add(a.product);
    return true;
  });

  return NextResponse.json(deduped);
}

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { type, product } = await req.json();
    if (!['view', 'add_to_cart', 'wishlist', 'purchase', 'login'].includes(type)) {
      return NextResponse.json({ message: 'Invalid activity type.' }, { status: 400 });
    }

    await connectToDB();
    await Activity.create({
      customer: session.id,
      type,
      product: product?._id,
      productName: product?.productName,
      productImage: product?.imageLink,
    });

    return NextResponse.json({ message: 'Logged.' });
  } catch (err) {
    console.error('Activity log error:', err);
    return NextResponse.json({ message: 'Failed to log activity.' }, { status: 500 });
  }
}