import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';
import { issueOtp } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';

const GENERIC_MESSAGE = "If an account with that contact exists, we've sent a verification code.";

const ROLE_LOOKUP: Record<string, { model: any; field: string }> = {
  buyer: { model: Customer, field: 'email' },
  seller: { model: Seller, field: 'contact' },
  delivery: { model: DeliveryGuy, field: 'contact' },
};

export async function POST(req: NextRequest) {
  try {
    const { contact, role } = await req.json();
    if (!contact || typeof contact !== 'string') {
      return NextResponse.json({ message: 'Contact is required.' }, { status: 400 });
    }
    if (!role || !ROLE_LOOKUP[role]) {
      return NextResponse.json({ message: 'A valid role is required.' }, { status: 400 });
    }
    const normalized = contact.trim().toLowerCase();

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rate = await checkRateLimit({ key: `forgot-password:ip:${ip}`, maxAttempts: 10, windowSeconds: 3600, blockSeconds: 3600 });
    if (!rate.allowed) return NextResponse.json({ message: GENERIC_MESSAGE });

    await connectToDB();
    const { model, field } = ROLE_LOOKUP[role];
    const account = await model.findOne({ [field]: normalized });

    if (account) {
      // Key the OTP by role+contact, not just contact — otherwise a
      // buyer and seller sharing the same email would still collide on
      // the OTP record itself, even with the account lookup now fixed.
      await issueOtp(`${role}:${normalized}`, 'password-reset').catch((err) =>
        console.error('password-reset OTP send failed:', err)
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}