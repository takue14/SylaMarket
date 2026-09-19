import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Ad from '@/models/Ad';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';
import { getSession } from '@/lib/session';




export async function GET() {
  try {
    await connectToDatabase();
    const ads = await Ad.find({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json(ads);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch ads' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const session = await getSession('admin');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'Image is required' }, { status: 400 });
    }
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ message: 'Image must be under 8MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ads' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });

    const newAd = await Ad.create({
      title: formData.get('title'),
      subtitle: formData.get('subtitle'),
      description: formData.get('description'),
      image: uploadResult.secure_url,
      buttonText: formData.get('buttonText') || 'BUY NOW',
      badge: formData.get('badge'),
      badgeColor: formData.get('badgeColor'),
      isLarge: formData.get('isLarge') === 'true',
      active: formData.get('active') === 'true',
    });

    return NextResponse.json(newAd, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create ad' }, { status: 500 });
  }
}