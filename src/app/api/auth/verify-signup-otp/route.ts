import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import DeliveryGuy from '@/models/DeliveryGuy';
import { verifyOtp } from '@/lib/otpService';

export async function POST(req: NextRequest) {
  try {
    const { contact, code } = await req.json();
    if (!contact || !code) return NextResponse.json({ message: 'Contact and code are required.' }, { status: 400 });

    const result = await verifyOtp(contact, 'signup-verify', code);
    if (!result.valid) {
      const messages: Record<string, string> = {
        not_found: 'No pending verification for this contact. Request a new code.',
        expired: 'This code has expired. Request a new one.',
        too_many_attempts: 'Too many incorrect attempts. Request a new code.',
        mismatch: 'Incorrect code.',
      };
      return NextResponse.json({ message: messages[result.reason] }, { status: 400 });
    }

    await connectToDB();
    const normalized = contact.trim().toLowerCase();

    // The contact could belong to a seller or a delivery guy — this route
    // doesn't know which role sent it, so check both collections.
    const seller = await Seller.findOneAndUpdate({ contact: normalized }, { contactVerified: true }, { new: true });
    if (seller) {
      return NextResponse.json({
        message: 'Contact verified. Your account is now pending admin approval.',
        verificationStatus: seller.verificationStatus,
      });
    }

    const deliveryGuy = await DeliveryGuy.findOneAndUpdate({ contact: normalized }, { contactVerified: true }, { new: true });
    if (deliveryGuy) {
      return NextResponse.json({
        message: 'Contact verified. Your account is now pending admin approval.',
        verificationStatus: deliveryGuy.verificationStatus,
      });
    }

    return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
  } catch (err) {
    console.error('verify-signup-otp error:', err);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}