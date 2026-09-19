import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';
import { issueOtp, OtpPurpose } from '@/lib/otpService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const VALID_PURPOSES: OtpPurpose[] = ['signup-verify', 'password-reset', 'login-verify'];

export async function POST(req: NextRequest) {
  try {
    const { contact, purpose, role } = await req.json();
    if (!contact || typeof contact !== 'string') {
      return NextResponse.json({ message: 'Contact is required.' }, { status: 400 });
    }
    if (!VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ message: 'Invalid purpose.' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const rate = await checkRateLimit({
      key: `resend-otp:ip:${ip}`,
      maxAttempts: 8,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { message: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const normalized = contact.trim().toLowerCase();

    // Resolve the real account so the reissued OTP is bound the same way
    // every other OTP in the system is — an unbound resend would be
    // unredeemable by verify-signup-otp / verify-login-otp, which now
    // require accountId/role on every record.
    let recordKey = normalized;
    let binding: { accountId: string; role: string } | undefined;

    await connectToDB();
    if (role === 'seller' || (!role && (await Seller.findOne({ contact: normalized })))) {
      const seller = await Seller.findOne({ contact: normalized });
      if (seller) {
        recordKey = `seller:${normalized}`;
        binding = { accountId: seller._id.toString(), role: 'seller' };
      }
    } else if (role === 'delivery' || (!role && (await DeliveryGuy.findOne({ contact: normalized })))) {
      const deliveryGuy = await DeliveryGuy.findOne({ contact: normalized });
      if (deliveryGuy) {
        recordKey = `delivery:${normalized}`;
        binding = { accountId: deliveryGuy._id.toString(), role: 'delivery' };
      }
    } else if (role === 'buyer' || (!role && (await Customer.findOne({ email: normalized })))) {
      const customer = await Customer.findOne({ email: normalized });
      if (customer) {
        recordKey = `buyer:${normalized}`;
        binding = { accountId: customer._id.toString(), role: 'buyer' };
      }
    }

    // issueOtp has its own per-identifier rate limit (5/hour) baked in, so a
    // resend spam-click can't bypass that separately — this IP-level limit
    // is a second, coarser layer on top.
    const result = await issueOtp(contact, purpose as OtpPurpose, recordKey, binding);

    if (!result.sent) {
      return NextResponse.json(
        { message: `Too many codes requested for this contact. Try again in ${result.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    return NextResponse.json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error('resend-otp error:', err);
    return NextResponse.json({ message: 'Could not resend code. Please try again.' }, { status: 500 });
  }
}