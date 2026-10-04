import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DriverEarning from '@/models/DriverEarning';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('delivery');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();

  const rows = await DriverEarning.aggregate([
    { $match: { driver: session.id } },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: '$fee' },
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$fee', 0] } },
      },
    },
  ]);

  const result = rows[0] ?? { totalEarned: 0, totalPaid: 0 };
  return NextResponse.json({
    totalEarned: Math.round(result.totalEarned * 100) / 100,
    totalPaid: Math.round(result.totalPaid * 100) / 100,
  });
}