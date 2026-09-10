import { NextRequest, NextResponse } from 'next/server';
import  connectToDatabase  from '@/lib/mongoose';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) return NextResponse.json({ products: [], categories: [] });

    const regex = new RegExp(q, 'i');

    const [products, categories] = await Promise.all([
      Product.find({ productName: regex }).select('productName imageLink price').limit(6),
      Product.distinct('category', { category: regex }),
    ]);

    return NextResponse.json({ products, categories: categories.slice(0, 4) });
  } catch (err) {
    console.error('Search suggest error:', err);
    return NextResponse.json({ products: [], categories: [] });
  }
}