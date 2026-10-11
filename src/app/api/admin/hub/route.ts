import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import { getSession } from '@/lib/session';
import { advanceFulfillment, syncFulfillment } from '@/lib/orderLifecycle';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectToDB();
  const orders = await Order.find({
    fulfillmentMode: 'hub',
    fulfillment: { $in: ['seller_accepted', 'seller_preparing', 'ready_for_collection', 'collected', 'at_hub'] },
  })
    .select('products.productName products.quantity products.itemStatus products.product products.seller fulfillment createdAt')
    .sort({ createdAt: 1 })
    .limit(200);
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { orderId, productId, action, note } = await req.json();
  if (!mongoose.isValidObjectId(orderId)) return NextResponse.json({ message: 'Invalid order.' }, { status: 400 });
  await connectToDB();
  const actor = { role: 'admin' as const, id: session.id };

  // Admin physically confirms this item arrived at the hub.
  if (action === 'receive' && mongoose.isValidObjectId(productId)) {
    const u = await Order.findOneAndUpdate(
      { _id: orderId, products: { $elemMatch: { product: new mongoose.Types.ObjectId(productId), itemStatus: 'shipped' } } },
      { $set: { 'products.$[el].itemStatus': 'at_hub' } },
      { arrayFilters: [{ 'el.product': new mongoose.Types.ObjectId(productId), 'el.itemStatus': 'shipped' }], new: true }
    );
    if (!u) return NextResponse.json({ message: 'Item is not awaiting hub receipt.' }, { status: 409 });
    const synced = await syncFulfillment(orderId, actor);
    return NextResponse.json({ fulfillment: synced?.fulfillment });
  }

  // Item never showed up: send it back to the seller's queue and tell them.
  if (action === 'missing' && mongoose.isValidObjectId(productId)) {
    const u = await Order.findOneAndUpdate(
      { _id: orderId, products: { $elemMatch: { product: new mongoose.Types.ObjectId(productId), itemStatus: 'shipped' } } },
      { $set: { 'products.$[el].itemStatus': 'ready' }, $push: { statusHistory: { from: null, to: 'item_missing_at_hub', actorRole: 'admin', actorId: session.id, note: String(note || '').slice(0, 200), at: new Date() } } },
      { arrayFilters: [{ 'el.product': new mongoose.Types.ObjectId(productId), 'el.itemStatus': 'shipped' }], new: true }
    );
    if (!u) return NextResponse.json({ message: 'Item is not awaiting hub receipt.' }, { status: 409 });
    const line = u.products.find((p: { product: { toString: () => string } }) => p.product.toString() === productId);
    if (line) {
      await createNotification({
        userId: line.seller.toString(), role: 'seller', type: 'hub_item_missing', title: 'Item not received at hub',
        message: `The hub did not receive "${line.productName}" for order #${orderId.slice(-6)}. Please re-ship it.`, link: '/seller/dashboard',
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  // Everything's here: sort it, and only now does it reach drivers.
  if (action === 'sort') {
    const order = await Order.findById(orderId);
    if (!order || order.fulfillment !== 'at_hub') {
      return NextResponse.json({ message: 'Not every item has arrived at the hub yet.' }, { status: 409 });
    }
    const done = await advanceFulfillment(orderId, 'sorted', actor, 'Verified in hub stock', { deliveryReady: true });
    return done ? NextResponse.json({ fulfillment: done.fulfillment }) : NextResponse.json({ message: 'Already sorted.' }, { status: 409 });
  }

  return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
}