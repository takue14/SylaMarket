import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';
import { getSession } from '@/lib/session';
import type { Role } from '@/lib/jwt';

const ROLE_MODELS: Record<string, any> = {
  seller: Seller,
  buyer: Customer,
  delivery: DeliveryGuy,
};
const SESSION_ROLE_MAP: Record<string, Role> = {
  seller: 'seller',
  buyer: 'customer',
  delivery: 'delivery',
};

async function authorize(role: string, userId: string) {
  const sessionRole = SESSION_ROLE_MAP[role];
  if (!sessionRole) return false;

  const ownSession = await getSession(sessionRole);
  if (ownSession?.id === userId) return true;

  const adminSession = await getSession('admin');
  return !!adminSession;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ role: string; userId: string }> }
) {
  const { role, userId } = await params;
  const model = ROLE_MODELS[role];
  if (!model) return NextResponse.json({ message: 'Invalid role.' }, { status: 400 });

  if (!(await authorize(role, userId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDB();
  const user = await model.findById(userId).select('country location');
  return NextResponse.json({
    hasLocation: !!user?.location?.coordinates,
    country: user?.country ?? null,
    coordinates: user?.location?.coordinates ?? null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ role: string; userId: string }> }
) {
  const { role, userId } = await params;
  const model = ROLE_MODELS[role];
  if (!model) return NextResponse.json({ message: 'Invalid role.' }, { status: 400 });

  if (!(await authorize(role, userId))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { country, lat, lng } = await req.json();
    if (!country?.trim() || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ message: 'Country, latitude, and longitude are required.' }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ message: 'Invalid coordinates.' }, { status: 400 });
    }

    await connectToDB();
    const updated = await model.findByIdAndUpdate(
      userId,
      { country: country.trim(), location: { type: 'Point', coordinates: [lng, lat] } },
      { new: true }
    ).select('country location');

    if (!updated) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });

    return NextResponse.json({ message: 'Location updated.', country: updated.country, location: updated.location });
  } catch (err) {
    console.error('Location update error:', err);
    return NextResponse.json({ message: 'Failed to update location.' }, { status: 500 });
  }
}