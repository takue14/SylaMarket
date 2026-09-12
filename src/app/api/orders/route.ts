import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';
import { forwardGeocode } from '@/lib/geocoding';
import DeliveryGuy from '@/models/DeliveryGuy';
import { createNotification } from '@/lib/notifications';
import { estimateDeliveryMinutes } from '@/lib/eta';
import { Seller } from '@/models/Seller';

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
    let deliveryCoords: { lat: number; lng: number } | null = null;
    const geocoded = await forwardGeocode(location.trim()).catch(() => null);
    if (geocoded?.country) orderCountry = geocoded.country;
    if (geocoded) deliveryCoords = { lat: geocoded.lat, lng: geocoded.lng };

    deliveryCoords

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
    const { isSplitPayment } = body as { isSplitPayment?: boolean };
    let depositAmount = 0;
    let balanceDue = totalAmount;

    if (isSplitPayment && paymentMethod !== 'cod') {
      // Recompute per-line, server-side — never trust a client-sent total.
      // Each line's deposit is its own seller-set percentage of its own
      // line total; items with no percentage set are paid in full upfront.
      const productDocs = await Product.find({
        _id: { $in: orderItems.map((i) => i.product) },
      }).select('_id depositPercentage');
      const pctById = new Map(productDocs.map((p) => [p._id.toString(), p.depositPercentage]));

      depositAmount = orderItems.reduce((sum, item) => {
        const pct = pctById.get(item.product);
        const lineTotal = item.price * item.quantity;
        const lineDeposit = pct != null ? Math.round(lineTotal * (pct / 100) * 100) / 100 : lineTotal;
        return sum + lineDeposit;
      }, 0);
      balanceDue = Math.round((totalAmount - depositAmount) * 100) / 100;
    }

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
      isSplitPayment: !!isSplitPayment && paymentMethod !== 'cod',
      depositAmount,
      balanceDue,
      paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : depositAmount > 0 ? 'deposit_paid' : 'awaiting_payment',
      //estimatedMinutes: { type: Number, default: null }
     estimatedMinutes: null
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
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
    }).sort({ createdAt: -1 });
  } else if (session.role === 'delivery') {
    const driver = await DeliveryGuy.findById(session.id).select('country');
    const driverCountry = driver?.country ?? null;

          orders = await Order.find({
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
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
    const { orderId, status, balanceCollected } = await req.json();
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
      if (status === 'delivered' && order.isSplitPayment && order.balanceDue > 0 && !order.balanceCollected) {
        if (balanceCollected !== true) {
          return NextResponse.json(
            {
              message: `Confirm you have collected the remaining $${order.balanceDue.toFixed(2)} balance before marking this order delivered.`,
              requiresBalanceConfirmation: true,
              balanceDue: order.balanceDue,
            },
            { status: 409 }
          );
        }
        order.balanceCollected = true;
        order.balanceCollectedAt = new Date();

        // Notify every seller who has an item in this order that the
        // remaining balance was collected by the driver.
        const uniqueSellers = [...new Set(order.products.map((p: { seller: any }) => p.seller.toString()))];
        await Promise.all(
          uniqueSellers.map((sellerId) =>
            createNotification({
              userId: sellerId as string,
              role: 'seller',
              type: 'balance_collected',
              title: 'Delivery balance collected',
              message: `The driver collected the remaining $${order.balanceDue.toFixed(2)} for order #${order._id.toString().slice(-6)}.`,
              link: '/seller/dashboard',
            })
          )
        );
      }

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