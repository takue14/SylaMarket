import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import Customer from '@/models/Customer';
import DeliveryGuy from '@/models/DeliveryGuy';
import { verifyOtp } from '@/lib/otpService';

const ROLE_LOOKUP: Record<string, { model: any; field: string }> = {
  buyer: { model: Customer, field: 'email' },
  seller: { model: Seller, field: 'contact' },
  delivery: { model: DeliveryGuy, field: 'contact' },
};

export async function POST(req: NextRequest) {
  try {
    const { contact, code, newPassword, role } = await req.json();
    if (!contact || !code || !newPassword) {
      return NextResponse.json({ message: 'Contact, code, and new password are required.' }, { status: 400 });
    }
    if (!role || !ROLE_LOOKUP[role]) {
      return NextResponse.json({ message: 'A valid role is required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const normalized = contact.trim().toLowerCase();
    const result = await verifyOtp(normalized, 'password-reset', code, `${role}:${normalized}`);
    if (!result.valid) {
      const messages: Record<string, string> = {
        not_found: 'No password reset was requested for this contact.',
        expired: 'This code has expired. Request a new one.',
        too_many_attempts: 'Too many incorrect attempts. Request a new code.',
        mismatch: 'Incorrect code.',
      };
      return NextResponse.json({ message: messages[result.reason] }, { status: 400 });
    }

    await connectToDB();
    const hashed = await bcrypt.hash(newPassword, 12);
    const { model, field } = ROLE_LOOKUP[role];

    const updated = await model.findOneAndUpdate({ [field]: normalized }, { password: hashed });
    if (!updated) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });

    return NextResponse.json({ message: 'Password updated. You can sign in now.' });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ message: 'Password reset failed. Please try again.' }, { status: 500 });
  }
}