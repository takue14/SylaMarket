// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';
import { Seller } from '@/models/Seller';
import cloudinary from '@/lib/cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { getSession } from '@/lib/session';

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
        const session = await getSession('seller');
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const sellerId = session.id; // never trust a client-supplied sellerId
    const segmentRaw = formData.get('segment') as string | null;
    const segment = segmentRaw === 'dealo-fresh' ? 'dealo-fresh' : 'dealo';

    if (!productName || !price || !category ) {
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

           const MAX_FILE_BYTES = 8 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of validFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ message: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ message: 'Each image must be under 8MB.' }, { status: 400 });
      }
    }


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
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const segment = searchParams.get('segment');
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const country = searchParams.get('country');

    const query: Record<string, unknown> = {};
    if (category !== 'All') query.category = category;
    if (segment === 'dealo' || segment === 'dealo-fresh') query.segment = segment;
        if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { productName: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
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
            pipeline: [
              { $project: { businessName: 1, name: 1, contact: 1 } },
            ],
          },
        },
        { $unwind: '$seller' },
        // Never expose exact coordinates in public product listings —
        // distance is already computed server-side above; the raw
        // location itself has no legitimate public use case.
        { $project: { location: 0, 'seller.location': 0 } },
      ]);
      
        } else {
      products = await Product.find(query)
        .select('-location') // never expose exact coordinates publicly
        .populate('seller', 'businessName name')
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