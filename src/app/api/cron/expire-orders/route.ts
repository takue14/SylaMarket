import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  // Simple shared-secret check so this endpoint can't be triggered by anyone
  // who finds the URL — the cron service must send this header.
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDB();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const staleOrders = await Order.find({
    status: 'pending',
    claimedBy: null,
    createdAt: { $lt: cutoff },
  });

  let cancelledCount = 0;
  for (const order of staleOrders) {
    // Restock everything this order reserved
    await Promise.all(
      order.products.map((item: { product: string; quantity: number }) =>
        Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } })
      )
    );

    order.status = 'cancelled';
    await order.save();

    await createNotification({
      userId: order.customer.toString(),
      role: 'customer',
      type: 'order_expired',
      title: 'Order automatically cancelled',
      message: `Your order #${order._id.toString().slice(-6)} was not claimed by a driver within 24 hours and has been cancelled. Please place a new order.`,
      link: '/',
    });

    cancelledCount++;
  }

  return NextResponse.json({ message: `Cancelled ${cancelledCount} stale order(s).` });
}