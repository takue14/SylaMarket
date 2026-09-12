import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectToDB();
    const categories = await Product.distinct('category');
    return NextResponse.json({ categories: categories.filter(Boolean).sort() });
  } catch (err) {
    console.error('Categories fetch error:', err);
    return NextResponse.json({ categories: [] });
  }
}