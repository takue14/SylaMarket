import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import { getSession } from '@/lib/session';
import { syncFulfillment } from '@/lib/orderLifecycle';
import { checkRateLimit } from '@/lib/rateLimit';

const ACTIONS: Record<string, [string, string]> = {
  accept: ['awaiting_seller', 'accepted'],
  prepare: ['accepted', 'preparing'],
  ready: ['preparing', 'ready'],
  ship: ['ready', 'shipped'], // seller sends the item to the Dealo hub
};

export async function POST(req: NextRequest) {
  const session = await getSession('seller');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit({ key: `seller-advance:${session.id}`, maxAttempts: 60, windowSeconds: 60, blockSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ message: 'Too many requests.' }, { status: 429 });

  const { orderId, action } = await req.json();
  if (!mongoose.isValidObjectId(orderId) || !ACTIONS[action]) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }
  const [from, to] = ACTIONS[action];
  await connectToDB();

  // Only this seller's own lines move, and only once payment is confirmed.
  const updated = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
            status: { $ne: 'delivered' },
      ...(action === 'ship' ? { fulfillmentMode: 'hub' } : {}),
      products: { $elemMatch: { seller: new mongoose.Types.ObjectId(session.id), itemStatus: from } },
    },
    { $set: { 'products.$[el].itemStatus': to } },
    { arrayFilters: [{ 'el.seller': new mongoose.Types.ObjectId(session.id), 'el.itemStatus': from }], new: true }
  );
  if (!updated) return NextResponse.json({ message: 'That step is not available for this order.' }, { status: 409 });

  const synced = await syncFulfillment(orderId, { role: 'seller', id: session.id });
  return NextResponse.json({ fulfillment: synced?.fulfillment });
}