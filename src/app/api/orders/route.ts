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
import { priceOrder } from '@/lib/pricing';
import { advanceFulfillment } from '@/lib/orderLifecycle';
import { getPickupDetails } from '@/lib/pickup';
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
    const {
      customerName, contact, location, products, paymentMethod,
      deliveryCoords: clientCoords, deliveryMode,
    } = body as {
      customerName: string;
      contact: string;
      location: string;
      products: CartLineInput[];
      paymentMethod: 'cod' | 'ecocash' | 'paynow';
      deliveryCoords?: { lat: number; lng: number };
      deliveryMode?: 'hub' | 'instant';
    };

    if (!['cod', 'ecocash', 'paynow'].includes(paymentMethod)) {
      return NextResponse.json({ message: 'A valid payment method is required.' }, { status: 400 });
    }
    if (deliveryMode !== 'hub' && deliveryMode !== 'instant') {
      return NextResponse.json({ message: 'Choose hub or instant delivery.' }, { status: 400 });
    }
    if (!customerName?.trim() || !contact?.trim() || !location?.trim() || !Array.isArray(products) || !products.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    if (products.length > 50) {
      return NextResponse.json({ message: 'Too many items in one order.' }, { status: 400 });
    }

    // Slow external calls happen BEFORE the transaction.
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

    const pricingSettings = await getDeliverySettings();
    const { isSplitPayment } = body as { isSplitPayment?: boolean };

    const mongoSession = await mongoose.startSession();
    let newOrder: InstanceType<typeof Order> | null = null;

    try {
      await mongoSession.withTransaction(async () => {
        const orderItems: Array<{
          product: string;
          seller: string;
          productName: string;
          quantity: number;
          price: number;
          deliveryContribution: number;
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

          // The seller decides which modes each product supports.
          const modes: string[] = updated.deliveryModes?.length ? updated.deliveryModes : ['hub'];
          if (!modes.includes(deliveryMode)) {
            throw new OrderRuleError(
              `"${updated.productName}" is not available for ${deliveryMode === 'instant' ? 'instant' : 'hub'} delivery.`
            );
          }

          orderItems.push({
            product: updated._id.toString(),
            seller: updated.seller.toString(),
            productName: updated.productName,
            quantity: line.quantity,
            price: updated.price,
            deliveryContribution: updated.deliveryContribution ?? 0,
          });
        }

        // Instant = the driver collects straight from the seller, so one seller per order.
        if (deliveryMode === 'instant' && new Set(orderItems.map((i) => i.seller)).size > 1) {
          throw new OrderRuleError('Instant delivery only works with items from a single seller. Use hub delivery or split your cart.');
        }

        const priced = priceOrder(
          orderItems.map((i) => ({ price: i.price, quantity: i.quantity, deliveryContribution: i.deliveryContribution })),
          pricingSettings,
          deliveryMode
        );
        const totalAmount = priced.total;
        const itemsWithMoney = orderItems.map((i, n) => ({
          ...i,
          deliveryContribution: priced.items[n].contribution,
          commission: priced.items[n].commission,
          sellerPayout: priced.items[n].sellerPayout,
        }));

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

        const stage = paymentMethod === 'cod' ? 'payment_confirmed' : 'payment_pending';
        const now = new Date();

        const created = await Order.create(
          [
            {
              customer: session.id,
              customerName: customerName.trim(),
              contact: contact.trim(),
              location: location.trim(),
              country: orderCountry,
              deliveryCoords,
              products: itemsWithMoney,
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
              deliveryFee: priced.deliveryFee,
              driverPay: priced.driverPay,
              fulfillmentMode: deliveryMode === 'instant' ? 'direct' : 'hub',
              deliveryReady: false,
              fulfillment: stage,
              statusHistory: [
                { from: null, to: 'order_created', actorRole: 'customer', actorId: session.id, at: now },
                { from: 'order_created', to: stage, actorRole: 'system', actorId: 'system', at: now },
              ],
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
    const actor = { role: 'delivery' as const, id: session.id };

    // ================== CLAIM ==================
    if (status === 'inprogress') {
      // Only orders released to drivers can be claimed (hub: after the admin sorts it;
      // instant: once every item is ready at the seller).
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: orderId,
          status: 'pending',
          claimedBy: null,
          deliveryReady: true,
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
      // Orders created with the new pricing model pay the fixed driver amount instead of the OSRM formula.
      if (order.driverPay != null) order.driverFee = order.driverPay;
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
      await advanceFulfillment(order._id.toString(), 'assigned_to_route', actor, 'Claimed by driver');

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
        title: 'A driver has taken your order',
        message: `Order #${order._id.toString().slice(-6)} has been assigned to a driver.`,
        link: '/customer/dashboard',
      }).catch((err) => console.error('Notification failed (non-fatal):', err));

      // Instant orders: the driver goes to the seller, so reveal pickup details now (and only now).
      const pickup = order.fulfillmentMode === 'direct' ? await getPickupDetails(order.products) : [];
      return NextResponse.json({ ...order.toObject(), pickup });
    }

    // ================== DELIVERED / RELEASE ==================
    if (status === 'delivered' || status === 'pending') {
      const order = await Order.findOne({ _id: orderId, claimedBy: session.id });
      if (!order) {
        return NextResponse.json({ message: 'You can only update orders you have claimed.' }, { status: 403 });
      }
      const previousStatus = order.status;

      // The lifecycle only moves forward, so a delivered order is final.
      if (previousStatus === 'delivered') {
        return NextResponse.json({ message: 'A delivered order cannot be changed.' }, { status: 409 });
      }

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

      order.status = status;
      if (status === 'pending') {
        // Driver released the order back to the pool.
        order.claimedBy = null;
        order.driverFee = null;
        order.driverDistanceKm = null;
        order.statusHistory.push({
          from: order.fulfillment, to: order.fulfillment, actorRole: 'delivery', actorId: session.id,
          note: 'Driver released the order', at: new Date(),
        });
      }

      await order.save();

      if (status === 'delivered' && order.claimedBy && order.deliveryCodeVerified) {
        // >>> This is where the lifecycle "delivered" step goes <<<
        await advanceFulfillment(order._id.toString(), 'delivered', actor, 'Handoff code verified');

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