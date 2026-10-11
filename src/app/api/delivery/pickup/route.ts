import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import { getSession } from '@/lib/session';
import { advanceFulfillment } from '@/lib/orderLifecycle';

export async function POST(req: NextRequest) {
  const session = await getSession('delivery');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!mongoose.isValidObjectId(orderId)) {
    return NextResponse.json({ message: 'Invalid order.' }, { status: 400 });
  }

  await connectToDB();
  const order = await Order.findOne({ _id: orderId, claimedBy: session.id, status: 'inprogress' }).select('_id');
  if (!order) return NextResponse.json({ message: 'Not your active order.' }, { status: 403 });

  const done = await advanceFulfillment(
    orderId,
    'out_for_delivery',
    { role: 'delivery', id: session.id },
    'Goods collected'
  );
  return done
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ message: 'Already started.' }, { status: 409 });
}