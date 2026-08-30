import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import { requireRole } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { action, reason } = await req.json();
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Action must be approve or reject.' }, { status: 400 });
    }

    await connectToDB();
    const deliveryGuy = await DeliveryGuy.findByIdAndUpdate(
      id,
      {
        verificationStatus: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? (reason || 'Not specified') : undefined,
      },
      { new: true }
    );

    if (!deliveryGuy) return NextResponse.json({ message: 'Delivery guy not found.' }, { status: 404 });

    return NextResponse.json({ message: `Delivery guy ${action}d.`, verificationStatus: deliveryGuy.verificationStatus });
  } catch (err) {
    console.error('admin verify delivery error:', err);
    return NextResponse.json({ message: 'Update failed.' }, { status: 500 });
  }
}