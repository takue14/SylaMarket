import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DeliverySettings from '@/models/DeliverySettings';
import { getSession } from '@/lib/session';
import { getDeliverySettings } from '@/lib/deliveryFee';

export async function GET() {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getDeliverySettings());
}

export async function PUT(req: NextRequest) {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const b = await req.json();
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && !isNaN(v) && v >= min && v <= max ? v : null;

  const baseFee = num(b.baseFee, 0, 100);
  const ratePerKm = num(b.ratePerKm, 0, 50);
  const valuePct = num(b.valuePct, 0, 0.5);
  const valueCap = num(b.valueCap, 0, 1000);
  const feeWeight = num(b.feeWeight, 0, 1);
  const validMode = ['fee', 'efficiency', 'blended'].includes(b.rankingMode);

  if ([baseFee, ratePerKm, valuePct, valueCap, feeWeight].some((v) => v === null) || !validMode) {
    return NextResponse.json({ message: 'One or more settings are out of range.' }, { status: 400 });
  }

  await connectToDB();
  await DeliverySettings.findOneAndUpdate(
    { key: 'default' },
    { key: 'default', baseFee, ratePerKm, valuePct, valueCap, feeWeight, rankingMode: b.rankingMode, updatedAt: new Date() },
    { upsert: true }
  );
  return NextResponse.json({ message: 'Settings saved.' });
}