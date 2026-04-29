// src/app/api/sellers/[sellerId]/products/route.ts (updated: add pagination support)
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import  Product  from '@/models/Product';

export async function GET(req: NextRequest, { params }: { params: Promise<{ sellerId: string }> }) {
  try {
    await connectToDatabase();
    const { sellerId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10; // Products per page

    const products = await Product.find({ seller: sellerId })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }); // Newest first

    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}