import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import DeliveryGuy from '@/models/DeliveryGuy';
import { verifyOtp } from '@/lib/otpService';

export async function POST(req: NextRequest) {
  try {
    const { contact, code } = await req.json();
    if (!contact || !code) return NextResponse.json({ message: 'Contact and code are required.' }, { status: 400 });

    const normalized = contact.trim().toLowerCase();

    // Try both namespaces since this endpoint doesn't know the role up
    // front — but once found, the account itself comes from the OTP
    // record's own binding, never guessed by scanning collections.
    let result = await verifyOtp(contact, 'signup-verify', code, `seller:${normalized}`);
    let boundRole: 'seller' | 'delivery' | null = result.valid ? 'seller' : null;

    if (!result.valid && result.reason === 'not_found') {
      result = await verifyOtp(contact, 'signup-verify', code, `delivery:${normalized}`);
      boundRole = result.valid ? 'delivery' : null;
    }

    if (!result.valid) {
      const messages: Record<string, string> = {
        not_found: 'No pending verification for this contact. Request a new code.',
        expired: 'This code has expired. Request a new one.',
        too_many_attempts: 'Too many incorrect attempts. Request a new code.',
        mismatch: 'Incorrect code.',
      };
      return NextResponse.json({ message: messages[result.reason] }, { status: 400 });
    }

    if (!result.accountId || !boundRole) {
      return NextResponse.json({ message: 'This code is not valid for account verification.' }, { status: 400 });
    }

    await connectToDB();

    if (boundRole === 'seller') {
      const seller = await Seller.findByIdAndUpdate(result.accountId, { contactVerified: true }, { new: true });
      if (!seller) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
      return NextResponse.json({
        message: 'Contact verified. Your account is now pending admin approval.',
        verificationStatus: seller.verificationStatus,
      });
    }

    const deliveryGuy = await DeliveryGuy.findByIdAndUpdate(result.accountId, { contactVerified: true }, { new: true });
    if (!deliveryGuy) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    return NextResponse.json({
      message: 'Contact verified. Your account is now pending admin approval.',
      verificationStatus: deliveryGuy.verificationStatus,
    });
  } catch (err) {
    console.error('verify-signup-otp error:', err);
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 500 });
  }
}