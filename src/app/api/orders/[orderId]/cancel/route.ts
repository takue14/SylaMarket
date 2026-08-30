import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId } = await params;
    await connectToDB();

    const order = await Order.findOne({ _id: orderId, customer: session.id });
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });

    if (order.status !== 'pending') {
      return NextResponse.json(
        { message: 'This order can no longer be cancelled — it has already been claimed or delivered.' },
        { status: 409 }
      );
    }

    // Restock everything this order had reserved.
    await Promise.all(
      order.products.map((item: { product: string; quantity: number }) =>
        Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } })
      )
    );

    order.status = 'cancelled';
    await order.save();

    await createNotification({
      userId: session.id,
      role: 'customer',
      type: 'order_cancelled',
      title: 'Order cancelled',
      message: `Your order #${order._id.toString().slice(-6)} has been cancelled and any payment reservation released.`,
      link: '/customer/dashboard',
    });

    return NextResponse.json({ message: 'Order cancelled.', order });
  } catch (err) {
    console.error('Cancel order error:', err);
    return NextResponse.json({ message: 'Failed to cancel order.' }, { status: 500 });
  }
}