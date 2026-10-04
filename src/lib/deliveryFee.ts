import { connectToDB } from './mongoose';
import DeliverySettings from '@/models/DeliverySettings';

export interface DeliverySettingsValues {
  baseFee: number;
  ratePerKm: number;
  valuePct: number;
  valueCap: number;
  rankingMode: 'fee' | 'efficiency' | 'blended';
  feeWeight: number;
}

export const DEFAULT_SETTINGS: DeliverySettingsValues = {
  baseFee: 1,
  ratePerKm: 0.5,
  valuePct: 0.03,
  valueCap: 3,
  rankingMode: 'blended',
  feeWeight: 0.6,
};

export async function getDeliverySettings(): Promise<DeliverySettingsValues> {
  await connectToDB();
  const doc = await DeliverySettings.findOne({ key: 'default' }).lean<Partial<DeliverySettingsValues> | null>();
  return { ...DEFAULT_SETTINGS, ...(doc ?? {}) };
}

/** fee = base + distance × rate + min(orderValue × pct, cap) */
const MAX_PLAUSIBLE_DISTANCE_KM = 150; // hard ceiling — no single delivery leg should exceed this

export function computeDriverFee(distanceKm: number, orderValue: number, s: DeliverySettingsValues): number {
  const cappedDistance = Math.min(Math.max(distanceKm, 0), MAX_PLAUSIBLE_DISTANCE_KM);
  const fee = s.baseFee + cappedDistance * s.ratePerKm + Math.min(orderValue * s.valuePct, s.valueCap);
  return Math.round(fee * 100) / 100;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

export function rankOrders<T extends { driverFee: number | null; distanceKm: number | null }>(
  items: T[],
  s: DeliverySettingsValues
): (T & { rankScore: number | null })[] {
  const scorable = items.filter((i) => i.driverFee != null && i.distanceKm != null);
  const unscorable = items.filter((i) => i.driverFee == null || i.distanceKm == null);

  const maxFee = Math.max(...scorable.map((i) => i.driverFee as number), 0.0001);
  const maxDist = Math.max(...scorable.map((i) => i.distanceKm as number), 0.0001);

  const scored = scorable
    .map((i) => {
      const fee = i.driverFee as number;
      const dist = i.distanceKm as number;
      let score: number;
      if (s.rankingMode === 'fee') score = fee;
      else if (s.rankingMode === 'efficiency') score = fee / Math.max(dist, 0.5); // fee per km, floor avoids divide-by-~0
      else score = s.feeWeight * (fee / maxFee) + (1 - s.feeWeight) * (1 - dist / maxDist);
      return { ...i, rankScore: Math.round(score * 1000) / 1000 };
    })
    .sort((a, b) => b.rankScore - a.rankScore);

  return [...scored, ...unscorable.map((i) => ({ ...i, rankScore: null }))];
}