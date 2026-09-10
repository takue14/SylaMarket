import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import DeliveryGuy from '@/models/DeliveryGuy';
import { getSession } from '@/lib/session';
import { optimizeRoute } from '@/lib/routing';

export async function GET() {
  const session = await getSession('delivery');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const driver = await DeliveryGuy.findById(session.id).select('location');
  if (!driver?.location?.coordinates) {
    return NextResponse.json({ message: 'Set your location first to use route optimization.' }, { status: 400 });
  }

  const myOrders = await Order.find({
    claimedBy: session.id,
    status: { $in: ['inprogress'] },
  });

  if (myOrders.length < 2) {
    return NextResponse.json({ message: 'Route optimization needs at least 2 active orders.' }, { status: 400 });
  }

  // Orders don't currently store their own coordinates, only a free-text
  // `location` string — this needs each order's address geocoded first.
    const validStops = myOrders
    .filter((o) => o.deliveryCoords?.lat != null && o.deliveryCoords?.lng != null)
    .map((o) => ({ orderId: o._id.toString(), lat: o.deliveryCoords.lat, lng: o.deliveryCoords.lng, label: o.customerName }));

    
  if (validStops.length < 2) {
    return NextResponse.json({ message: 'Could not locate enough delivery addresses to optimize.' }, { status: 400 });
  }

  try {
    const [lng, lat] = driver.location.coordinates;
    const optimized = await optimizeRoute(lat, lng, validStops);
    return NextResponse.json({ route: optimized });
  } catch (err) {
    console.error('Route optimization error:', err);
    return NextResponse.json({ message: (err as Error).message || 'Failed to optimize route.' }, { status: 500 });
  }
}