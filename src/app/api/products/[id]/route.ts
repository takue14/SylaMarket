import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Product from '@/models/Product';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;
    const { quantity } = await req.json();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { quantity },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update quantity error:', error);
    return NextResponse.json({ message: 'Failed to update quantity' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();

    const { id } = await params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
  }
}