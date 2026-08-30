// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { Seller } from '@/models/Seller';
import cloudinary from '@/lib/cloudinary';
import type { UploadApiResponse } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

        const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    const productName = formData.get('productName') as string;
    const price = parseFloat(formData.get('price') as string);
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 0;
    const sellerId = formData.get('sellerId') as string;
    const segmentRaw = formData.get('segment') as string | null;
    const segment = segmentRaw === 'dealo-fresh' ? 'dealo-fresh' : 'dealo';

    if (!productName || !price || !category || !sellerId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const seller = await Seller.findById(sellerId).select('country location');
    if (!seller?.location?.coordinates) {
      return NextResponse.json(
        { message: 'Your seller profile has no location set. Update your profile before listing products.' },
        { status: 400 }
      );
    }

       const validFiles = files.filter((f) => f && f.size > 0);
    if (validFiles.length === 0) {
      return NextResponse.json({ message: 'At least one product image is required.' }, { status: 400 });
    }
    if (validFiles.length > 4) {
      return NextResponse.json({ message: 'A maximum of 4 images is allowed.' }, { status: 400 });
    }

    const uploadOne = async (file: File): Promise<string> => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve((result as UploadApiResponse).secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    };

    const images = await Promise.all(validFiles.map(uploadOne));
    const imageLink = images[0];


        const newProduct = await Product.create({
      productName,
      price,
      category,
      description,
      imageLink,
      images,
      seller: sellerId,
      quantity,
      segment,
      country: seller.country,
      location: seller.location,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error uploading product' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'All';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10000;
    const segment = searchParams.get('segment');
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const country = searchParams.get('country');

    const query: Record<string, unknown> = {};
    if (category !== 'All') query.category = category;
    if (segment === 'dealo' || segment === 'dealo-fresh') query.segment = segment;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (country) query.country = country;

    let products;

    if (!isNaN(lat) && !isNaN(lng)) {
      products = await Product.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            query,
            spherical: true,
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'sellers',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller',
          },
        },
        { $unwind: '$seller' },
      ]);
    } else {
      products = await Product.find(query)
        .populate('seller', 'businessName name contact')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}