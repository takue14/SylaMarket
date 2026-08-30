import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';
import { forwardGeocode } from '@/lib/geocoding';
import DeliveryGuy from '@/models/DeliveryGuy';

interface CartLineInput {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) {
    return NextResponse.json({ message: 'You must be signed in as a buyer to place an order.' }, { status: 401 });
  }

  try {
    await connectToDB();
    const body = await req.json();
        const { customerName, contact, location, products, paymentMethod } = body as {
      customerName: string;
      contact: string;
      location: string;
      products: CartLineInput[];
      paymentMethod: 'cod' | 'ecocash' | 'paynow';
    };

    if (!['cod', 'ecocash', 'paynow'].includes(paymentMethod)) {
      return NextResponse.json({ message: 'A valid payment method is required.' }, { status: 400 });
    }

    if (!customerName?.trim() || !contact?.trim() || !location?.trim() || !products?.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let orderCountry: string | null = null;
    const geocoded = await forwardGeocode(location.trim()).catch(() => null);
    if (geocoded?.country) orderCountry = geocoded.country;

    const orderItems: Array<{
      product: string;
      seller: string;
      productName: string;
      quantity: number;
      price: number;
    }> = [];
    const decremented: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const line of products) {
        if (!line.productId || !line.quantity || line.quantity < 1) {
          throw new Error('Invalid product in cart.');
        }

        const updated = await Product.findOneAndUpdate(
          { _id: line.productId, quantity: { $gte: line.quantity } },
          { $inc: { quantity: -line.quantity } },
          { new: true }
        );

        if (!updated) {
          const stillExists = await Product.findById(line.productId).select('productName quantity');
          throw new Error(
            stillExists
              ? `Not enough stock for "${stillExists.productName}" (only ${stillExists.quantity} left).`
              : 'A product in your cart no longer exists.'
          );
        }

        decremented.push({ productId: line.productId, quantity: line.quantity });
        orderItems.push({
          product: updated._id.toString(),
          seller: updated.seller.toString(),
          productName: updated.productName,
          quantity: line.quantity,
          price: updated.price,
        });
      }
    } catch (stockErr) {
      for (const d of decremented) {
        await Product.findByIdAndUpdate(d.productId, { $inc: { quantity: d.quantity } });
      }
      return NextResponse.json({ message: (stockErr as Error).message }, { status: 409 });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

       const newOrder = await Order.create({
      customer: session.id,
      customerName: customerName.trim(),
      contact: contact.trim(),
      location: location.trim(),
      country: orderCountry,
      products: orderItems,
      totalAmount,
      status: 'pending',
      claimedBy: null,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'awaiting_payment',
    });

    // Cash on Delivery orders are confirmed immediately — send an order
    // confirmation now. Online payment methods only get a receipt once
    // the webhook confirms the payment actually succeeded.
    if (paymentMethod === 'cod') {
      const Customer = (await import('@/models/Customer')).default;
      const buyer = await Customer.findById(session.id).select('email');
      if (buyer?.email) {
        const { sendReceiptEmail } = await import('@/lib/receipt');
        sendReceiptEmail(buyer.email, {
          _id: newOrder._id.toString(),
          customerName: newOrder.customerName,
          contact: newOrder.contact,
          location: newOrder.location,
          products: newOrder.products,
          totalAmount: newOrder.totalAmount,
          paymentMethod: newOrder.paymentMethod,
        }).catch((err) => console.error('COD confirmation email failed:', err));
      }
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const asRole = req.nextUrl.searchParams.get('as');
  const roleMap: Record<string, 'customer' | 'seller' | 'delivery' | 'admin'> = {
    buyer: 'customer',
    seller: 'seller',
    delivery: 'delivery',
    admin: 'admin',
  };
  const resolvedRole = asRole ? roleMap[asRole] : undefined;
  if (!resolvedRole) {
    return NextResponse.json({ message: 'A valid ?as= role is required.' }, { status: 400 });
  }

  const session = await getSession(resolvedRole);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();

  let orders;
  if (session.role === 'customer') {
    orders = await Order.find({ customer: session.id }).sort({ createdAt: -1 });
    } else if (session.role === 'seller') {
    orders = await Order.find({
      'products.seller': session.id,
      paymentStatus: { $in: ['paid', 'cod_pending'] },
    }).sort({ createdAt: -1 });
  } else if (session.role === 'delivery') {
    const driver = await DeliveryGuy.findById(session.id).select('country');
    const driverCountry = driver?.country ?? null;

        orders = await Order.find({
      paymentStatus: { $in: ['paid', 'cod_pending'] },
      $or: [
        {
          $and: [
            { status: 'pending' },
            { claimedBy: null },
            { $or: [{ country: driverCountry }, { country: null }] },
          ],
        },
        { claimedBy: session.id },
      ],
    }).sort({ createdAt: -1 });
  } else {
    orders = await Order.find().sort({ createdAt: -1 });
  }

  return NextResponse.json(orders);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession('delivery');
  if (!session) {
    return NextResponse.json({ message: 'Only delivery accounts can update order status.' }, { status: 401 });
  }

  try {
    await connectToDB();
    const { orderId, status } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ message: 'orderId and status are required.' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });

    const isUnclaimed = !order.claimedBy;
    const isClaimedByMe = order.claimedBy?.toString() === session.id;

    if (status === 'inprogress' && isUnclaimed) {
      order.status = 'inprogress';
      order.claimedBy = session.id;
    } else if (isClaimedByMe) {
      order.status = status;
      if (status === 'pending') order.claimedBy = null;
    } else {
      return NextResponse.json({ message: 'You can only update orders you have claimed.' }, { status: 403 });
    }

    await order.save();
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}