import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/Product';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const entries = await Wishlist.find({ customer: session.id }).sort({ createdAt: -1 });
  const productIds = entries.map((e) => e.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('seller', 'businessName name contact');

  // preserve wishlist order (most recently added first), not product-query order
  const ordered = productIds.map((id) => products.find((p) => p._id.toString() === id)).filter(Boolean);

  return NextResponse.json(ordered);
}

export async function POST(req: NextRequest) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ message: 'productId is required.' }, { status: 400 });

    await connectToDB();
    const existing = await Wishlist.findOne({ customer: session.id, product: productId });

    if (existing) {
      await existing.deleteOne();
      return NextResponse.json({ wishlisted: false });
    }

    await Wishlist.create({ customer: session.id, product: productId });
    return NextResponse.json({ wishlisted: true });
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    return NextResponse.json({ message: 'Failed to update wishlist.' }, { status: 500 });
  }
}