// src/app/api/sellers/[sellerId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Product from '@/models/Product';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    await connectToDatabase();
    const { sellerId } = await params;

    const products = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 });   // Removed pagination for dashboard simplicity

    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}