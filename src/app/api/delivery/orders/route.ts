import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import DeliveryGuy from '@/models/DeliveryGuy';
import { getSession } from '@/lib/session';
import { toPoint, Point } from '@/lib/geo';
import { driverToDestinations, RouteMetric } from '@/lib/osrm';
import { getDeliverySettings, computeDriverFee, rankOrders } from '@/lib/deliveryFee';
import { checkRateLimit } from '@/lib/rateLimit';

interface LeanOrder {
  _id: unknown;
  status: string;
  claimedBy?: unknown;
  totalAmount: number;
  contact: string;
  driverFee?: number | null;
  driverDistanceKm?: number | null;
  deliveryCoords?: { lat?: number | null; lng?: number | null };
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const session = await getSession('delivery');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const rate = await checkRateLimit({
    key: `delivery-pool:${session.id}`,
    maxAttempts: 30,
    windowSeconds: 60,
    blockSeconds: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please slow down.' }, { status: 429 });
  }
    
  
  await connectToDB();
  const driver = await DeliveryGuy.findById(session.id).select('country location');
  const driverCountry = driver?.country ?? null;

  // Prefer the live position the browser sent; fall back to the saved location.
  let origin: Point | null = toPoint(req.nextUrl.searchParams.get('lat'), req.nextUrl.searchParams.get('lng'));
  if (!origin && driver?.location?.coordinates) {
    origin = toPoint(driver.location.coordinates[1], driver.location.coordinates[0]);
  }

  const orders = (await Order.find({
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
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanOrder[];

  const mine = orders.filter((o) => o.claimedBy && String(o.claimedBy) === session.id);
  const pool = orders.filter((o) => !o.claimedBy && o.status === 'pending');

  const settings = await getDeliverySettings();

  const routable = pool
    .map((o) => ({ o, coords: toPoint(o.deliveryCoords?.lat, o.deliveryCoords?.lng) }))
    .filter((x): x is { o: LeanOrder; coords: Point } => x.coords !== null);

  const metricByOrder = new Map<string, RouteMetric>();
  if (origin && routable.length) {
    const metrics = await driverToDestinations(origin, routable.map((x) => x.coords));
    routable.forEach((x, k) => metricByOrder.set(String(x.o._id), metrics[k]));
  }

    const enrichedPool = pool.map((o) => {
    const m = metricByOrder.get(String(o._id));
    const distanceKm = m ? Math.round(m.distanceKm * 100) / 100 : null;
    return {
      // Unclaimed orders expose nothing that identifies the customer —
      // no name, no address, no exact coordinates, no contact. A driver
      // sees only enough to decide whether the job is worth taking.
      _id: o._id,
      orderRef: `#${String(o._id).slice(-6)}`,
      country: o.country ?? null,
      itemCount: Array.isArray(o.products) ? o.products.length : null,
      orderValue: o.totalAmount,
      distanceKm,
      durationMin: m ? Math.round(m.durationMin) : null,
      driverFee: m ? computeDriverFee(m.distanceKm, o.totalAmount, settings) : null,
      status: 'pending',
      claimedBy: null,
      createdAt: o.createdAt
    };
  });

  const mineOut = mine.map((o) => ({
    // Full detail only once this driver has actually claimed the order.
    ...o,
    distanceKm: o.driverDistanceKm ?? null,
    durationMin: null,
    driverFee: o.driverFee ?? null,
  }));

  return NextResponse.json({
    orders: [...rankOrders(enrichedPool, settings), ...mineOut],
    needsLocation: !origin,
    ranking: { mode: settings.rankingMode, feeWeight: settings.feeWeight },
  });
}