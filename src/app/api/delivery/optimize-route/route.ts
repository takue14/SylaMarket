import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import DeliveryGuy from '@/models/DeliveryGuy';
import { getSession } from '@/lib/session';
import { resolveOsrmBaseUrl } from '@/lib/osrmRegions';
import { buildGoogleMapsRouteUrl } from '@/lib/mapsDeepLink';
import { checkRateLimit } from '@/lib/rateLimit';

interface OrderedStop {
  orderId: string;
  lat: number;
  lng: number;
  label: string;
  order: number;
}

export async function GET() {
  const session = await getSession('delivery');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Keyed per-driver, not per-IP — this is an authenticated endpoint, and
  // the point is to stop one account hammering the external routing
  // service, not to throttle a shared network.
  const rate = await checkRateLimit({
    key: `optimize-route:${session.id}`,
    maxAttempts: 10,
    windowSeconds: 60,
    blockSeconds: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ message: 'Too many route requests. Please wait a moment.' }, { status: 429 });
  }

  await connectToDB();
  const driver = await DeliveryGuy.findById(session.id).select('location');
  if (!driver?.location?.coordinates) {
    return NextResponse.json({ message: 'Set your location first to use route optimization.' }, { status: 400 });
  }
  const [driverLng, driverLat] = driver.location.coordinates;

  const myOrders = await Order.find({ claimedBy: session.id, status: 'inprogress' });
  if (myOrders.length < 2) {
    return NextResponse.json({ message: 'Route optimization needs at least 2 active orders.' }, { status: 400 });
  }

  const stops = myOrders
    .filter((o) => o.deliveryCoords?.lat != null && o.deliveryCoords?.lng != null)
    .map((o) => ({ orderId: o._id.toString(), lat: o.deliveryCoords.lat, lng: o.deliveryCoords.lng, label: o.customerName }));

  if (stops.length < 2) {
    return NextResponse.json({ message: 'Not enough delivery addresses have a saved location.' }, { status: 400 });
  }

  try {
    const base = resolveOsrmBaseUrl(driverLat, driverLng);
    const coordsParam = [{ lat: driverLat, lng: driverLng }, ...stops]
      .map((p) => `${p.lng},${p.lat}`)
      .join(';');
    const url = `${base}/trip/v1/driving/${coordsParam}?source=first&roundtrip=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`OSRM trip ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error(`OSRM trip code ${data.code}`);

    const ordered: OrderedStop[] = data.waypoints
      .slice(1) // waypoint 0 is the driver's own start point
      .map((wp: { waypoint_index: number }, i: number) => ({ ...stops[i], order: wp.waypoint_index }))
      .sort((a: OrderedStop, b: OrderedStop) => a.order - b.order);

    const mapsUrl = buildGoogleMapsRouteUrl(
      { lat: driverLat, lng: driverLng },
      ordered.map((s) => ({ lat: s.lat, lng: s.lng }))
    );

    return NextResponse.json({ route: ordered, mapsUrl });
  } catch (err) {
    console.error('Route optimization error:', err);

    // OSRM unreachable — still let the driver navigate, just without
    // an optimized order. Better than blocking them entirely.
    const mapsUrl = buildGoogleMapsRouteUrl(
      { lat: driverLat, lng: driverLng },
      stops.map((s) => ({ lat: s.lat, lng: s.lng }))
    );
    return NextResponse.json({
      route: stops.map((s, i) => ({ ...s, order: i })),
      mapsUrl,
      warning: 'Could not compute an optimized order — showing stops in original order.',
    });
  }
}