import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';
import { forwardGeocode, reverseGeocodeCountry } from '@/lib/geocoding';
import DeliveryGuy from '@/models/DeliveryGuy';
import { createNotification } from '@/lib/notifications';
import DriverEarning from '@/models/DriverEarning';
import { toPoint, haversineKm } from '@/lib/geo';
import { driverToDestinations } from '@/lib/osrm';
import { getDeliverySettings, computeDriverFee, getWeekStart } from '@/lib/deliveryFee';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  generateDeliveryCode,
  hashDeliveryCode,
  verifyDeliveryCode,
  deliveryCodeExpiry,
  deliveryCodeLockoutUntil,
  DELIVERY_CODE_MAX_ATTEMPTS,
} from '@/lib/deliveryCode';

interface CartLineInput {
  productId: string;
  quantity: number;
}

/** Thrown inside the transaction for problems the buyer caused (stock, bad cart) so they map to 409, not 500. */
class OrderRuleError extends Error {}

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) {
    return NextResponse.json({ message: 'You must be signed in as a buyer to place an order.' }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: `order-create:${session.id}`,
    maxAttempts: 10,
    windowSeconds: 60,
    blockSeconds: 120,
  });
  if (!rate.allowed) {
    return NextResponse.json({ message: 'Too many order attempts. Please wait a moment.' }, { status: 429 });
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
    if (!customerName?.trim() || !contact?.trim() || !location?.trim() || !Array.isArray(products) || !products.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    if (products.length > 50) {
      return NextResponse.json({ message: 'Too many items in one order.' }, { status: 400 });
    }

    // External geocoding happens BEFORE the transaction so slow network
    // calls never hold database locks open.
    let orderCountry: string | null = null;
    let deliveryCoords: { lat: number; lng: number } | null = null;

    const validatedClientPoint = clientCoords ? toPoint(clientCoords.lat, clientCoords.lng) : null;
    if (validatedClientPoint) {
      deliveryCoords = validatedClientPoint;
      const geo = await reverseGeocodeCountry(validatedClientPoint.lat, validatedClientPoint.lng).catch(() => null);
      if (geo?.country) orderCountry = geo.country;
    } else {
      const geocoded = await forwardGeocode(location.trim()).catch(() => null);
      if (geocoded?.country) orderCountry = geocoded.country;
      if (geocoded) deliveryCoords = { lat: geocoded.lat, lng: geocoded.lng };
    }

    const { isSplitPayment } = body as { isSplitPayment?: boolean };

    const mongoSession = await mongoose.startSession();
    let newOrder: InstanceType<typeof Order> | null = null;

    try {
      await mongoSession.withTransaction(async () => {
        // withTransaction may re-run this callback on transient errors,
        // so all working state must be (re)initialised inside it.
        const orderItems: Array<{
          product: string;
          seller: string;
          productName: string;
          quantity: number;
          price: number;
        }> = [];

        for (const line of products) {
          if (!line.productId || !Number.isInteger(line.quantity) || line.quantity < 1) {
            throw new OrderRuleError('Invalid product in cart.');
          }

          const updated = await Product.findOneAndUpdate(
            { _id: line.productId, quantity: { $gte: line.quantity } },
            { $inc: { quantity: -line.quantity } },
            { new: true, session: mongoSession }
          );

          if (!updated) {
            const stillExists = await Product.findById(line.productId)
              .select('productName quantity')
              .session(mongoSession);
            throw new OrderRuleError(
              stillExists
                ? `Not enough stock for "${stillExists.productName}" (only ${stillExists.quantity} left).`
                : 'A product in your cart no longer exists.'
            );
          }

          orderItems.push({
            product: updated._id.toString(),
            seller: updated.seller.toString(),
            productName: updated.productName,
            quantity: line.quantity,
            price: updated.price,
          });
        }

        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let depositAmount = 0;
        let balanceDue = totalAmount;

        if (isSplitPayment && paymentMethod !== 'cod') {
          const productDocs = await Product.find({ _id: { $in: orderItems.map((i) => i.product) } })
            .select('_id depositPercentage')
            .session(mongoSession);
          const pctById = new Map(productDocs.map((p) => [p._id.toString(), p.depositPercentage]));

          depositAmount = orderItems.reduce((sum, item) => {
            const pct = pctById.get(item.product);
            const lineTotal = item.price * item.quantity;
            const lineDeposit = pct != null ? Math.round(lineTotal * (pct / 100) * 100) / 100 : lineTotal;
            return sum + lineDeposit;
          }, 0);
          balanceDue = Math.round((totalAmount - depositAmount) * 100) / 100;
        }

        const created = await Order.create(
          [
            {
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
              paymentStatus:
                paymentMethod === 'cod' ? 'cod_pending' : depositAmount > 0 ? 'deposit_paid' : 'awaiting_payment',
              estimatedMinutes: null,
            },
          ],
          { session: mongoSession }
        );
        newOrder = created[0];
      });
    } catch (txErr) {
      if (txErr instanceof OrderRuleError) {
        return NextResponse.json({ message: txErr.message }, { status: 409 });
      }
      console.error('Order transaction failed:', txErr);
      return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
    } finally {
      await mongoSession.endSession();
    }

    if (!newOrder) {
      return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
    }
    const createdOrder = newOrder as InstanceType<typeof Order>;

    if (paymentMethod === 'cod') {
      const Customer = (await import('@/models/Customer')).default;
      const buyer = await Customer.findById(session.id).select('email');
      if (buyer?.email) {
        const { sendReceiptEmail } = await import('@/lib/receipt');
        sendReceiptEmail(buyer.email, {
          _id: createdOrder._id.toString(),
          customerName: createdOrder.customerName,
          contact: createdOrder.contact,
          location: createdOrder.location,
          products: createdOrder.products,
          totalAmount: createdOrder.totalAmount,
          paymentMethod: createdOrder.paymentMethod,
        }).catch((err: unknown) => console.error('COD confirmation email failed:', err));
      }
    }

    return NextResponse.json(createdOrder, { status: 201 });
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

  const rate = await checkRateLimit({
    key: `orders-list:${resolvedRole}:${session.id}`,
    maxAttempts: 60,
    windowSeconds: 60,
    blockSeconds: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  await connectToDB();

  const page = Math.max(parseInt(req.nextUrl.searchParams.get('page') || '1') || 1, 1);
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100') || 100, 100);
  const skip = (page - 1) * limit;

  let filter: Record<string, unknown>;
  if (session.role === 'customer') {
    filter = { customer: session.id };
  } else if (session.role === 'seller') {
    filter = {
      'products.seller': session.id,
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
    };
  } else if (session.role === 'delivery') {
    // Deliberately restricted to the driver's own claimed orders. The
    // unclaimed pool is served only by GET /api/delivery/orders, which
    // withholds customer details until a claim succeeds.
    filter = {
      paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
      claimedBy: session.id,
    };
  } else {
    filter = {};
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  return NextResponse.json(orders);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession('delivery');
  if (!session) {
    return NextResponse.json({ message: 'Only delivery accounts can update order status.' }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: `order-update:${session.id}`,
    maxAttempts: 60,
    windowSeconds: 60,
    blockSeconds: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    await connectToDB();
    const { orderId, status, balanceCollected, lat, lng, deliveryCode } = await req.json();

    if (!orderId || !status || !mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ message: 'A valid orderId and status are required.' }, { status: 400 });
    }
    if (!['pending', 'inprogress', 'delivered'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status.' }, { status: 400 });
    }

    // ================== CLAIM (pending -> inprogress) ==================
    if (status === 'inprogress') {
      // Atomic claim: only one concurrent request can match this filter.
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          status: 'pending',
          claimedBy: null,
          paymentStatus: { $in: ['paid', 'cod_pending', 'deposit_paid'] },
        },
        { status: 'inprogress', claimedBy: session.id },
        { new: true }
      );

      if (!claimedOrder) {
        return NextResponse.json({ message: 'This order is no longer available.' }, { status: 409 });
      }

      const order = claimedOrder;

      const driver = await DeliveryGuy.findById(session.id).select('location lastVerifiedLocation');
      const profileOrigin = driver?.location?.coordinates
        ? toPoint(driver.location.coordinates[1], driver.location.coordinates[0])
        : null;
      const claimedOrigin = toPoint(lat, lng);

      let origin = profileOrigin;
      let flagReason: string | null = null;

      if (claimedOrigin) {
        const last = driver?.lastVerifiedLocation;
        const anchor =
          last?.at && last.lat != null && last.lng != null
            ? { point: { lat: last.lat, lng: last.lng }, at: new Date(last.at) }
            : profileOrigin
            ? { point: profileOrigin, at: null as Date | null }
            : null;

        if (anchor) {
          const elapsedHours = anchor.at ? Math.max((Date.now() - anchor.at.getTime()) / 3600000, 1 / 60) : 24;
          const impliedKm = haversineKm(anchor.point, claimedOrigin);
          const impliedSpeedKmh = impliedKm / elapsedHours;
          if (impliedSpeedKmh > 120) {
            flagReason = `Implausible movement: ${impliedKm.toFixed(1)}km in ${elapsedHours.toFixed(2)}h (~${impliedSpeedKmh.toFixed(0)}km/h)`;
            console.warn(`Rejected GPS jump for driver ${session.id}: ${flagReason}`);
            origin = anchor.point;
          } else {
            origin = claimedOrigin;
          }
        } else {
          flagReason = 'No trusted baseline existed yet — first claim accepted unverified.';
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

      const code = generateDeliveryCode();
      order.deliveryCodeHash = hashDeliveryCode(code);
      order.deliveryCodeVerified = false;
      order.deliveryCodeExpiresAt = deliveryCodeExpiry();
      order.deliveryCodeAttempts = 0;
      order.deliveryCodeLockedUntil = null;

      await order.save();

      // Send the handoff code. Failures are logged loudly rather than
      // swallowed, because a buyer who never gets this code can't
      // complete the delivery.
      const Customer = (await import('@/models/Customer')).default;
      const buyer = await Customer.findById(order.customer).select('email');
      if (!buyer?.email) {
        console.error(`DELIVERY CODE NOT SENT: buyer ${order.customer} has no email on file (order ${order._id}).`);
      } else {
        try {
          const receipt = await import('@/lib/receipt');
          if (typeof receipt.sendDeliveryCodeEmail !== 'function') {
            console.error('DELIVERY CODE NOT SENT: sendDeliveryCodeEmail is missing from src/lib/receipt.ts');
          } else {
            await receipt.sendDeliveryCodeEmail(buyer.email, order._id.toString(), code);
          }
        } catch (err) {
          console.error(`DELIVERY CODE EMAIL FAILED for order ${order._id}:`, err);
        }
      }

      await createNotification({
        userId: order.customer.toString(),
        role: 'customer',
        type: 'order_in_transit',
        title: 'Your order is on the way',
        message: `Order #${order._id.toString().slice(-6)} has been picked up and is now in transit.`,
        link: '/customer/dashboard',
      }).catch((err) => console.error('Notification failed (non-fatal):', err));

      return NextResponse.json(order);
    }

    // ================== EVERYTHING ELSE (must already be claimed by this driver) ==================
    if (status === 'delivered' || status === 'pending') {
      const order = await Order.findOne({ _id: orderId, claimedBy: session.id });
      if (!order) {
        return NextResponse.json({ message: 'You can only update orders you have claimed.' }, { status: 403 });
      }
      const previousStatus = order.status;

      if (status === 'delivered' && !order.deliveryCodeVerified) {
        if (order.deliveryCodeLockedUntil && order.deliveryCodeLockedUntil > new Date()) {
          const waitMin = Math.ceil((order.deliveryCodeLockedUntil.getTime() - Date.now()) / 60000);
          return NextResponse.json(
            { message: `Too many incorrect attempts. Try again in ${waitMin} minute(s).`, requiresDeliveryCode: true },
            { status: 429 }
          );
        }

        if (order.deliveryCodeExpiresAt && order.deliveryCodeExpiresAt < new Date()) {
          return NextResponse.json(
            {
              message: 'This delivery code has expired. Ask the customer to request a new one from support.',
              requiresDeliveryCode: true,
              expired: true,
            },
            { status: 409 }
          );
        }

        if (!deliveryCode || !order.deliveryCodeHash || !verifyDeliveryCode(String(deliveryCode), order.deliveryCodeHash)) {
          // Only count an attempt when a code was actually submitted,
          // so the first "please enter your code" prompt doesn't burn one.
          if (deliveryCode) {
            order.deliveryCodeAttempts = (order.deliveryCodeAttempts ?? 0) + 1;
            if (order.deliveryCodeAttempts >= DELIVERY_CODE_MAX_ATTEMPTS) {
              order.deliveryCodeLockedUntil = deliveryCodeLockoutUntil();
              console.warn(`Delivery code lockout triggered for order ${order._id} (driver ${session.id})`);
            }
            await order.save();
          }
          return NextResponse.json(
            {
              message: !deliveryCode
                ? 'Enter the delivery code the customer gives you to confirm handoff.'
                : order.deliveryCodeLockedUntil
                ? 'Too many incorrect attempts. This order is temporarily locked.'
                : 'Incorrect code. Please try again.',
              requiresDeliveryCode: true,
              attemptsRemaining: Math.max(0, DELIVERY_CODE_MAX_ATTEMPTS - (order.deliveryCodeAttempts ?? 0)),
            },
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
        if (earning?.status !== undefined && earning.status !== 'unpaid') {
          return NextResponse.json(
            { message: 'This delivery has already been paid out (or is being processed) and cannot be reopened.' },
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

      await order.save();

      if (status === 'delivered' && previousStatus !== 'delivered' && order.claimedBy && order.deliveryCodeVerified) {
        try {
          let fee: number = order.driverFee;
          if (fee == null) {
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
    }

    return NextResponse.json({ message: 'Invalid status transition.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}