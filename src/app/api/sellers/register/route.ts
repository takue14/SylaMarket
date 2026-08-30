import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/mongoose';
import { Seller } from '@/models/Seller';
import cloudinary from '@/lib/cloudinary';
import { issueOtp } from '@/lib/otpService';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs'; // bcrypt + cloudinary SDK need Node runtime, not edge

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
      key: `register:seller:ip:${ip}`,
      maxAttempts: 5,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });
    if (!rate.allowed) {
      return NextResponse.json({ message: `Too many attempts. Try again in ${rate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const formData = await req.formData();
    const name = String(formData.get('name') ?? '').trim();
    const businessName = String(formData.get('businessName') ?? '').trim();
    const contact = String(formData.get('contact') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const ecocashNumber = String(formData.get('ecocashNumber') ?? '').trim();
    const idPhoto = formData.get('idPhoto') as File | null;
    const livePhoto = formData.get('livePhoto') as File | null;
    const country = String(formData.get('country') ?? '').trim();
const lat = parseFloat(formData.get('lat') as string);
const lng = parseFloat(formData.get('lng') as string);

if (!country || isNaN(lat) || isNaN(lng)) {
  return NextResponse.json({ message: 'Location is required to register as a seller.' }, { status: 400 });
}

    if (!name || !businessName || !contact || !password || !ecocashNumber) {
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

    await connectToDB();
    const existingSeller = await Seller.findOne({ contact });
    if (existingSeller && (existingSeller.contactVerified || existingSeller.verificationStatus !== 'pending')) {
      // Already verified, or already reviewed (approved/rejected) — a real
      // duplicate, block it.
      return NextResponse.json({ message: 'An account with this contact already exists.' }, { status: 409 });
    }
    // Otherwise: an unverified pending record exists — this is the user
    // hitting "Back" on the verify screen and resubmitting corrected
    // details. Overwrite rather than reject.

    const [idPhotoUrl, livePhotoUrl] = await Promise.all([
      uploadToCloudinary(idPhoto, 'dealo/seller-kyc/id'),
      uploadToCloudinary(livePhoto, 'dealo/seller-kyc/live'),
    ]);

    await Seller.findOneAndUpdate(
      { contact },
      {
        name,
        businessName,
        contact,
        password: await bcrypt.hash(password, 12),
        ecocashNumber,
        idPhotoUrl,
        livePhotoUrl,
        contactVerified: false,
        verificationStatus: 'pending',
        rejectionReason: undefined,
        country,
location: { type: 'Point', coordinates: [lng, lat] },
      },
      { upsert: true, new: true }
    );

    await issueOtp(contact, 'signup-verify').catch((err) => console.error('signup OTP send failed:', err));

    return NextResponse.json({ message: 'Account created. Enter the code we sent to verify your contact.' }, { status: 201 });
  } catch (err) {
    console.error('Seller registration error:', err);
    return NextResponse.json({ message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}