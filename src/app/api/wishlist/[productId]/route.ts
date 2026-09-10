import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Wishlist from '@/models/Wishlist';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { productId } = await params;
    const { notifyBackInStock } = await req.json();

    await connectToDB();
    const updated = await Wishlist.findOneAndUpdate(
      { customer: session.id, product: productId },
      { notifyBackInStock: !!notifyBackInStock },
      { new: true }
    );

    if (!updated) return NextResponse.json({ message: 'Not on your wishlist.' }, { status: 404 });
    return NextResponse.json({ notifyBackInStock: updated.notifyBackInStock });
  } catch (err) {
    console.error('Wishlist preference update error:', err);
    return NextResponse.json({ message: 'Failed to update preference.' }, { status: 500 });
  }
}