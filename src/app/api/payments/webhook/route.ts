import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { getPaynowClient } from '@/lib/paynow';
import { sendReceiptEmail } from '@/lib/receipt';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const reference = params.get('reference');
    const status = params.get('status');

    if (!reference) return NextResponse.json({ message: 'Missing reference.' }, { status: 400 });

    await connectToDB();
       // We poll Paynow's own API for the true status rather than trusting
    // the webhook body's fields directly — the pollUrl saved at initiation
    // time is the reliable lookup key.
    const orderMatch = await Order.findOne({ paymentReference: { $regex: reference, $options: 'i' } });

    if (!orderMatch) {
      console.error('Webhook: no matching order for reference', reference);
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    const paynow = getPaynowClient();
    const polled = await paynow.pollTransaction(orderMatch.paymentReference);

    if (polled.paid()) {
      orderMatch.paymentStatus = 'paid';
      await orderMatch.save();

      const buyer = await Customer.findById(orderMatch.customer).select('email');
      if (buyer?.email) {
        await sendReceiptEmail(buyer.email, {
          _id: orderMatch._id.toString(),
          customerName: orderMatch.customerName,
          contact: orderMatch.contact,
          location: orderMatch.location,
          products: orderMatch.products,
          totalAmount: orderMatch.totalAmount,
          paymentMethod: orderMatch.paymentMethod,
        }).catch((err) => console.error('Receipt email failed:', err));
      }
    } else if (status === 'cancelled' || status === 'failed') {
      orderMatch.paymentStatus = 'failed';
      await orderMatch.save();
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ message: 'Webhook processing failed.' }, { status: 500 });
  }
}