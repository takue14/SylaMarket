import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongoose';
import DriverEarning from '@/models/DriverEarning';
import { getSession } from '@/lib/session';
import Order from '@/models/Order';

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: NextRequest) {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  await connectToDB();

  const sp = req.nextUrl.searchParams;
  const driverId = sp.get('driverId');
  const weekStart = sp.get('weekStart');

  // Detail mode: every delivery behind one driver-week row
    if (driverId && weekStart) {
    if (!mongoose.isValidObjectId(driverId) || isNaN(Date.parse(weekStart))) {
      return NextResponse.json({ message: 'Invalid parameters.' }, { status: 400 });
    }
    const earnings = await DriverEarning.find({ driver: driverId, weekStart: new Date(weekStart) }).sort({ deliveredAt: 1 });

    // Join in the flag so admin sees it before paying — the earning
    // record itself doesn't carry this, the order does.
    const orderIds = earnings.map((e) => e.order);
    const flaggedOrders = await Order.find({ _id: { $in: orderIds }, feeFlaggedForReview: true })
      .select('_id feeFlagReason');
    const flagByOrder = new Map(flaggedOrders.map((o) => [o._id.toString(), o.feeFlagReason]));

    const enriched = earnings.map((e) => ({
      ...e.toObject(),
      flagReason: flagByOrder.get(e.order.toString()) ?? null,
    }));

    return NextResponse.json(enriched);
  }

  const pipeline: mongoose.PipelineStage[] = [
    {
      $group: {
        _id: { driver: '$driver', weekStart: '$weekStart' },
        total: { $sum: '$fee' },
        unpaid: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, '$fee', 0] } },
        deliveries: { $sum: 1 },
        unpaidCount: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
      },
    },
  ];
  if (sp.get('onlyUnpaid') === '1') pipeline.push({ $match: { unpaid: { $gt: 0 } } });
  pipeline.push(
    { $sort: { '_id.weekStart': -1, unpaid: -1 } },
    { $limit: 300 },
    {
      $lookup: {
        from: 'deliveryguys',
        localField: '_id.driver',
        foreignField: '_id',
        as: 'driverDoc',
        pipeline: [{ $project: { name: 1, contact: 1 } }],
      },
    },
    { $unwind: { path: '$driverDoc', preserveNullAndEmptyArrays: true } }
  );

  const rows = await DriverEarning.aggregate(pipeline);
  return NextResponse.json(
    rows.map((r) => ({
      driverId: String(r._id.driver),
      weekStart: r._id.weekStart,
      driverName: r.driverDoc?.name ?? 'Unknown driver',
      driverContact: r.driverDoc?.contact ?? '',
      deliveries: r.deliveries,
      unpaidCount: r.unpaidCount,
      total: round2(r.total),
      unpaid: round2(r.unpaid),
    }))
  );
}

/** Marks every unpaid earning for one driver-week as paid. Payment itself happens outside the app. */
export async function POST(req: NextRequest) {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { driverId, weekStart, note, paymentReference } = await req.json();
  if (!mongoose.isValidObjectId(driverId) || isNaN(Date.parse(weekStart))) {
    return NextResponse.json({ message: 'Invalid parameters.' }, { status: 400 });
  }
  if (!paymentReference?.trim()) {
    return NextResponse.json({ message: 'A payment reference is required (bank ref, EcoCash ref, etc).' }, { status: 400 });
  }

  await connectToDB();

  // Atomic claim: flips unpaid → processing one document at a time, so two
  // admins racing on the same week can never both succeed. Any doc that
  // another request already grabbed first is skipped, not double-counted.
  const filter = { driver: driverId, weekStart: new Date(weekStart), status: 'unpaid' };
  const toProcess = await DriverEarning.find(filter).select('_id');
  if (toProcess.length === 0) {
    return NextResponse.json({ message: 'Nothing unpaid for that week.' }, { status: 409 });
  }

  const claimedIds: string[] = [];
  for (const doc of toProcess) {
    const claimed = await DriverEarning.findOneAndUpdate(
      { _id: doc._id, status: 'unpaid' },
      { status: 'processing' },
      { new: true }
    );
    if (claimed) claimedIds.push(claimed._id.toString());
  }

  if (claimedIds.length === 0) {
    return NextResponse.json({ message: 'These earnings were already claimed by another admin action.' }, { status: 409 });
  }

  const claimedDocs = await DriverEarning.find({ _id: { $in: claimedIds } }).select('fee');
  const amount = Math.round(claimedDocs.reduce((s: number, e: { fee: number }) => s + e.fee, 0) * 100) / 100;

  await DriverEarning.updateMany(
    { _id: { $in: claimedIds } },
    {
      status: 'paid',
      paidAt: new Date(),
      paidBy: session.id,
      processedBy: session.id,
      payoutReference: paymentReference.trim().slice(0, 100),
      note: typeof note === 'string' ? note.slice(0, 300) : '',
    }
  );

  return NextResponse.json({ message: `Marked ${claimedIds.length} deliveries ($${amount.toFixed(2)}) as paid.`, amount });
}