import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import { getPaynowClient } from '@/lib/paynow';
import { sendReceiptEmail } from '@/lib/receipt';
import crypto from 'crypto';

function verifyPaynowHash(params: URLSearchParams, integrationKey: string): boolean {
  const receivedHash = params.get('hash');
  if (!receivedHash) return false;

  const values: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() !== 'hash') values.push(value);
  }
  const concatenated = values.join('') + integrationKey;
  const computedHash = crypto.createHash('sha512').update(concatenated).digest('hex').toUpperCase();
  return computedHash === receivedHash.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    if (!verifyPaynowHash(params, process.env.PAYNOW_INTEGRATION_KEY!)) {
      console.error('Webhook hash verification failed — possible forged request.');
      return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 });
    }

    const reference = params.get('reference');
    if (!reference) return NextResponse.json({ message: 'Missing reference.' }, { status: 400 });

    await connectToDB();

    const orderMatch = await Order.findOne({ paymentReference: reference });
    if (!orderMatch) {
      console.error('Webhook: no matching order for exact reference', reference);
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }
    if (orderMatch.paymentStatus === 'paid') {
      // Already processed — acknowledge without re-sending a receipt.
      return NextResponse.json({ received: true, note: 'Already processed.' });
    }
    if (!orderMatch.pollUrl) {
      console.error('Webhook: order has no pollUrl, cannot verify status', orderMatch._id);
      return NextResponse.json({ message: 'Order has no poll URL.' }, { status: 500 });
    }

    // The provider's own polled transaction state is the sole source of
    // truth — the request body's own status field is never trusted.
    const paynow = getPaynowClient();
    const polled = await paynow.pollTransaction(orderMatch.pollUrl);

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
    } else {
      orderMatch.paymentStatus = 'failed';
      await orderMatch.save();
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ message: 'Webhook processing failed.' }, { status: 500 });
  }
}