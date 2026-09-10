import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import { getSession } from '@/lib/session';
import { getPaynowClient } from '@/lib/paynow';

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, phone } = await req.json();
    if (!orderId) return NextResponse.json({ message: 'orderId is required.' }, { status: 400 });

    await connectToDB();
    const order = await Order.findOne({ _id: orderId, customer: session.id });
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ message: 'This order is already paid.' }, { status: 409 });
    }
    if (order.paymentMethod === 'cod') {
      return NextResponse.json({ message: 'This order is set to pay on delivery.' }, { status: 400 });
    }

        const paynow = getPaynowClient();
    const payment = paynow.createPayment(`order-${order._id.toString().slice(-8)}`, order.contact);

    if (order.isSplitPayment && order.depositAmount > 0) {
      // Charge only the deposit now — the balance is collected on delivery,
      // same as a Cash on Delivery leg for the remainder.
      payment.add(`Deposit for order #${order._id.toString().slice(-6)}`, order.depositAmount);
    } else {
      order.products.forEach((item: { productName: string; quantity: number; price: number }) => {
        payment.add(item.productName, item.price * item.quantity);
      });
    }
    

    let response;
    if (order.paymentMethod === 'ecocash') {
      if (!phone) return NextResponse.json({ message: 'A phone number is required for EcoCash.' }, { status: 400 });
      response = await paynow.sendMobile(payment, phone, 'ecocash');
    } else {
      response = await paynow.send(payment);
    }

    if (!response.success) {
      return NextResponse.json({ message: 'Failed to initiate payment with Paynow.' }, { status: 502 });
    }

    order.paymentReference = response.pollUrl;
    await order.save();

    return NextResponse.json({
      message: 'Payment initiated.',
      redirectUrl: order.paymentMethod === 'paynow' ? response.redirectUrl : null,
      instructions:
        order.paymentMethod === 'ecocash'
          ? 'Check your phone and approve the EcoCash payment prompt.'
          : null,
    });
  } catch (err) {
    console.error('Payment initiation error:', err);
    return NextResponse.json({ message: 'Failed to initiate payment.' }, { status: 500 });
  }
}