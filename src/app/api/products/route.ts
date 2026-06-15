// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import cloudinary from '@/lib/cloudinary';
import type { UploadApiResponse } from 'cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get('image') as File;

    const productName = formData.get('productName') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 0;   // ← Fixed
    const sellerId = formData.get('sellerId') as string;

    if (!file || !productName || !price || !category || !sellerId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        }
      );
      uploadStream.end(buffer);
    });

    const imageLink = uploadResult.secure_url;

    const newProduct = await Product.create({
      productName,
      price,
      category,
      description,
      imageLink,
      seller: sellerId,
      quantity,                    // ← Now saved correctly
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error uploading product' }, { status: 500 });
  }
}

// GET remains the same
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'All';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10000;

    const query: Record<string, unknown> = {};
    if (category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'businessName name contact')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}