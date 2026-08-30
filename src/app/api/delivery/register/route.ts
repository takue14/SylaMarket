import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/mongoose';
import DeliveryGuy from '@/models/DeliveryGuy';
import cloudinary from '@/lib/cloudinary';
import { issueOtp, isEmail } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const rate = await checkRateLimit({
      key: `register:delivery:ip:${ip}`,
      maxAttempts: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!rate.allowed) {
      return NextResponse.json({ message: `Too many attempts. Try again in ${rate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const formData = await req.formData();
    const name = String(formData.get('name') ?? '').trim();
    let contact = String(formData.get('contact') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const idPhoto = formData.get('idPhoto') as File | null;
    const livePhoto = formData.get('livePhoto') as File | null;

    if (!name || !contact || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!idPhoto || !livePhoto) {
      return NextResponse.json({ message: 'ID photo and live photo are both required.' }, { status: 400 });
    }
    const MAX_BYTES = 8 * 1024 * 1024;
    for (const file of [idPhoto, livePhoto]) {
      if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Uploads must be images.' }, { status: 400 });
      if (file.size > MAX_BYTES) return NextResponse.json({ message: 'Each image must be under 8MB.' }, { status: 400 });
    }

    // If it looks like a phone number (not an email), normalize to E.164
    // so OTP delivery works regardless of which country the number is
    // from — this is what makes SMS delivery work internationally rather
    // than assuming one country's dialing format.
    if (!isEmail(contact)) {
      const normalized = normalizePhone(contact);
      if (!normalized) {
        return NextResponse.json(
          { message: 'Please enter a valid phone number with country code (e.g. +263...), or use an email instead.' },
          { status: 400 }
        );
      }
      contact = normalized;
    }

    await connectToDB();
    const existing = await DeliveryGuy.findOne({ contact });
    if (existing && (existing.contactVerified || existing.verificationStatus !== 'pending')) {
      return NextResponse.json({ message: 'An account with this contact already exists.' }, { status: 409 });
    }

    const [idPhotoUrl, livePhotoUrl] = await Promise.all([
      uploadToCloudinary(idPhoto, 'dealo/delivery-kyc/id'),
      uploadToCloudinary(livePhoto, 'dealo/delivery-kyc/live'),
    ]);

    await DeliveryGuy.findOneAndUpdate(
      { contact },
      {
        name,
        contact,
        password: await bcrypt.hash(password, 12),
        idPhotoUrl,
        livePhotoUrl,
        contactVerified: false,
        verificationStatus: 'pending',
        rejectionReason: undefined,
      },
      { upsert: true, new: true }
    );

    await issueOtp(contact, 'signup-verify').catch((err) => console.error('signup OTP send failed:', err));

    return NextResponse.json({ message: 'Account created. Enter the code we sent to verify your contact.' }, { status: 201 });
  } catch (err) {
    console.error('Delivery registration error:', err);
    return NextResponse.json({ message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}