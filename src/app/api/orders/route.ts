import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';
import { forwardGeocode, reverseGeocodeCountry } from '@/lib/geocoding';
import DeliveryGuy from '@/models/DeliveryGuy';
import { createNotification } from '@/lib/notifications';
import { estimateDeliveryMinutes } from '@/lib/eta';
import { Seller } from '@/models/Seller';
import DriverEarning from '@/models/DriverEarning';
import { toPoint } from '@/lib/geo';
import { driverToDestinations } from '@/lib/osrm';
import { getDeliverySettings, computeDriverFee, getWeekStart } from '@/lib/deliveryFee';
import { haversineKm } from '@/lib/geo';
import { generateDeliveryCode, hashDeliveryCode, verifyDeliveryCode } from '@/lib/deliveryCode';


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
             const { customerName, contact, location, products, paymentMethod, deliveryCoords: clientCoords } = body as {
      customerName: string;
      contact: string;
      location: string;
      products: CartLineInput[];
      paymentMethod: 'cod' | 'ecocash' | 'paynow';
      deliveryCoords?: { lat: number; lng: number };
    };

    if (!['cod', 'ecocash', 'paynow'].includes(paymentMethod)) {
      return NextResponse.json({ message: 'A valid payment method is required.' }, { status: 400 });
    }

    if (!customerName?.trim() || !contact?.trim() || !location?.trim() || !products?.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }



    
               let orderCountry: string | null = null;
    let deliveryCoords: { lat: number; lng: number } | null = null;

    const validatedClientPoint = clientCoords ? toPoint(clientCoords.lat, clientCoords.lng) : null;
    if (validatedClientPoint) {
      // The buyer already pinned an exact point on the map — trust it
      // directly rather than re-geocoding the typed address, which could
      // resolve to a different, less precise location.
            deliveryCoords = validatedClientPoint;
      const geo = await reverseGeocodeCountry(validatedClientPoint.lat, validatedClientPoint.lng).catch(() => null);
      if (geo?.country) orderCountry = geo.country;
    } else {
      const geocoded = await forwardGeocode(location.trim()).catch(() => null);
      if (geocoded?.country) orderCountry = geocoded.country;
      if (geocoded) deliveryCoords = { lat: geocoded.lat, lng: geocoded.lng };
    }
    
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
      deliveryCoords,
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
    // This legacy endpoint is deliberately restricted to the driver's own
    // claimed orders only — full detail. The unclaimed pool is served
    // exclusively by GET /api/delivery/orders, which withholds customer
    // PII until a claim succeeds. Never widen this query back to include
    // unclaimed orders.
    orders = await Order.find({
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
      claimedBy: session.id,
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
        const { orderId, status, balanceCollected, lat, lng, deliveryCode } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ message: 'orderId and status are required.' }, { status: 400 });
    }
    if (!['pending', 'inprogress', 'delivered'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 });

    const isUnclaimed = !order.claimedBy;
    const isClaimedByMe = order.claimedBy?.toString() === session.id;
    const previousStatus = order.status;

    if (status === 'inprogress' && isUnclaimed) {
      // Only genuinely open, paid/COD orders can be claimed (previously a cancelled
      // or unpaid order could be claimed by calling the API directly).
      if (previousStatus !== 'pending' || !['paid', 'cod_pending', 'deposit_paid'].includes(order.paymentStatus)) {
        return NextResponse.json({ message: 'This order is no longer available.' }, { status: 409 });
      }

            // Lock the commission now, computed server-side from OSRM — never
      // from a client-sent fee. The client's reported lat/lng is used
      // only as a *candidate*; it's sanity-checked against the driver's
      // last server-recorded position before being trusted for payout.
            const driver = await DeliveryGuy.findById(session.id).select('location lastVerifiedLocation');
      const savedOrigin = driver?.location?.coordinates
        ? toPoint(driver.location.coordinates[1], driver.location.coordinates[0])
        : null;
      const claimedOrigin = toPoint(lat, lng);

      let origin = savedOrigin;
      let flagReason: string | null = null;

      if (claimedOrigin) {
        const last = driver?.lastVerifiedLocation;
        if (last?.at && last.lat != null && last.lng != null) {
          const elapsedHours = Math.max((Date.now() - new Date(last.at).getTime()) / 3600000, 1 / 60);
          const impliedKm = haversineKm({ lat: last.lat, lng: last.lng }, claimedOrigin);
          const impliedSpeedKmh = impliedKm / elapsedHours;
          if (impliedSpeedKmh > 120) {
            flagReason = `Implausible movement: ${impliedKm.toFixed(1)}km in ${elapsedHours.toFixed(2)}h (~${impliedSpeedKmh.toFixed(0)}km/h)`;
            console.warn(`Rejected GPS jump for driver ${session.id}: ${flagReason}`);
            // Fall back to the last known-good position for the fee —
            // never trust the implausible claimed point for money.
          } else {
            origin = claimedOrigin;
          }
        } else {
          origin = claimedOrigin;
        }
        await DeliveryGuy.findByIdAndUpdate(session.id, {
          lastVerifiedLocation: { lat: claimedOrigin.lat, lng: claimedOrigin.lng, at: new Date() },
        });
      }

      const dest = toPoint(order.deliveryCoords?.lat, order.deliveryCoords?.lng);
      let distanceKm: number | null = null;
      if (origin && dest) {
        const [metric] = await driverToDestinations(origin, [dest]);
        distanceKm = metric.distanceKm;
      }
      const settings = await getDeliverySettings();
      order.driverFee = computeDriverFee(distanceKm ?? 0, order.totalAmount, settings);
      order.driverDistanceKm = distanceKm;
      order.feeFlaggedForReview = !!flagReason;
      order.feeFlagReason = flagReason;

            order.status = 'inprogress';
      order.claimedBy = session.id;

      const deliveryCode = generateDeliveryCode();
      order.deliveryCodeHash = hashDeliveryCode(deliveryCode);
      order.deliveryCodeVerified = false;

      // Send the handoff code to the buyer now — the driver will need it
      // from them at the doorstep before the order can be marked delivered.
      const Customer = (await import('@/models/Customer')).default;
      const buyer = await Customer.findById(order.customer).select('email');
      if (buyer?.email) {
        const { sendDeliveryCodeEmail } = await import('@/lib/receipt');
        sendDeliveryCodeEmail(buyer.email, order._id.toString(), deliveryCode).catch((err) =>
          console.error('Delivery code email failed:', err)
        );
      }

      await createNotification({
        userId: order.customer.toString(),
        role: 'customer',
        type: 'order_in_transit',
        title: 'Your order is on the way',
        message: `Order #${order._id.toString().slice(-6)} has been picked up and is now in transit.`,
        link: '/customer/dashboard',
      }).catch((err) => console.error('Notification failed (non-fatal):', err));
        } else if (isClaimedByMe) {
      if (status === 'delivered' && !order.deliveryCodeVerified) {
        if (!deliveryCode || !order.deliveryCodeHash || !verifyDeliveryCode(deliveryCode, order.deliveryCodeHash)) {
          return NextResponse.json(
            { message: 'Enter the delivery code the customer gives you to confirm handoff.', requiresDeliveryCode: true },
            { status: 409 }
          );
        }
        order.deliveryCodeVerified = true;
      }
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

        const uniqueSellers = [
          ...new Set(order.products.map((p: { seller: { toString: () => string } }) => p.seller.toString())),
        ];
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

      // Reopening a delivered order voids its (unpaid) earning — a paid one can't be undone here.
      if (previousStatus === 'delivered' && status !== 'delivered') {
        const earning = await DriverEarning.findOne({ order: order._id });
        if (earning?.status === 'paid') {
          return NextResponse.json(
            { message: 'This delivery has already been paid out and cannot be reopened.' },
            { status: 409 }
          );
        }
        if (earning) await earning.deleteOne();
      }

      order.status = status;
      if (status === 'pending') {
        order.claimedBy = null;
        order.driverFee = null;
        order.driverDistanceKm = null;
      }
    } else {
      return NextResponse.json({ message: 'You can only update orders you have claimed.' }, { status: 403 });
    }

    await order.save();

    if (status === 'delivered' && previousStatus !== 'delivered' && order.claimedBy && order.deliveryCodeVerified) {
      try {
        let fee: number = order.driverFee;
        if (fee == null) {
          // Orders claimed before this feature existed have no locked fee
          fee = computeDriverFee(order.driverDistanceKm ?? 0, order.totalAmount, await getDeliverySettings());
        }
        const now = new Date();
        await DriverEarning.updateOne(
          { order: order._id },
          {
            $setOnInsert: {
              driver: session.id,
              order: order._id,
              fee,
              distanceKm: order.driverDistanceKm ?? null,
              orderValue: order.totalAmount,
              deliveredAt: now,
              weekStart: getWeekStart(now),
              status: 'unpaid',
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error('Failed to record driver earning for order', order._id.toString(), err);
      }

      await createNotification({
        userId: order.customer.toString(),
        role: 'customer',
        type: 'order_delivered',
        title: 'Order delivered',
        message: `Order #${order._id.toString().slice(-6)} has been delivered. Thanks for shopping with us!`,
        link: '/customer/dashboard',
      }).catch((err) => console.error('Notification failed (non-fatal):', err));
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}