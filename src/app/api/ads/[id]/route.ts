// src/app/api/ads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Ad from '@/models/Ad';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface UpdateData {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  badge?: string;
  badgeColor?: string;
  isLarge?: boolean;
  active?: boolean;
  image?: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const formData = await req.formData();

    const updateData: UpdateData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string | undefined,
      description: formData.get('description') as string | undefined,
      buttonText: formData.get('buttonText') as string | undefined,
      badge: formData.get('badge') as string | undefined,
      badgeColor: formData.get('badgeColor') as string | undefined,
      isLarge: formData.get('isLarge') === 'true',
      active: formData.get('active') === 'true',
    };

    const file = formData.get('image') as File | null;
    if (file) {
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

      updateData.image = uploadResult.secure_url;
    }

    const updatedAd = await Ad.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedAd) {
      return NextResponse.json({ message: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAd);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to update ad' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedAd = await Ad.findByIdAndDelete(id);

    if (!deletedAd) {
      return NextResponse.json({ message: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to delete ad' }, { status: 500 });
  }
}