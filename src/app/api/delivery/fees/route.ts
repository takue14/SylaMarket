import { NextResponse } from 'next/server';
import { getDeliverySettings } from '@/lib/deliveryFee';

export async function GET() {
  const s = await getDeliverySettings();
  return NextResponse.json({
    hubFee: s.customerDeliveryFee,
    instantBaseFee: s.instantBaseFee,
    instantPerItemFee: s.instantPerItemFee,
  });
}