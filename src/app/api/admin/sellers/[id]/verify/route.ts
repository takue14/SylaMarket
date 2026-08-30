import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
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
    const seller = await Seller.findByIdAndUpdate(
      id,
      {
        verificationStatus: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? (reason || 'Not specified') : undefined,
      },
      { new: true }
    );

    if (!seller) return NextResponse.json({ message: 'Seller not found.' }, { status: 404 });

    // TODO: notify the seller by email/SMS on approval/rejection — reuses
    // the mailer.ts transporter pattern minus the OTP-specific part.

    return NextResponse.json({ message: `Seller ${action}d.`, verificationStatus: seller.verificationStatus });
  } catch (err) {
    console.error('admin verify seller error:', err);
    return NextResponse.json({ message: 'Update failed.' }, { status: 500 });
  }
}