import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Product from '@/models/Product';
import Wishlist from '@/models/Wishlist';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('seller');
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDB();
    const { id } = await params;

    const existing = await Product.findOne({ _id: id, seller: session.id });
    if (!existing) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    const body = await req.json();
    const allowedFields = [
      'productName',
      'price',
      'salePrice',
      'category',
      'description',
      'quantity',
      'segment',
      'paymentMethods',
      'lowStockThreshold',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    const previousPrice = existing.salePrice ?? existing.price;
    const previousQuantity = existing.quantity;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedProduct) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    const newPrice = updatedProduct.salePrice ?? updatedProduct.price;

    // ---- Price-drop alert: notify everyone who wishlisted this product ----
    if (newPrice < previousPrice) {
      const wishlisters = await Wishlist.find({ product: id }).select('customer');
      await Promise.all(
        wishlisters.map(async (w) => {
          await createNotification({
            userId: w.customer,
            role: 'customer',
            type: 'price_drop',
            title: 'Price drop on a wishlist item',
            message: `${updatedProduct.productName} is now $${newPrice.toFixed(2)} (was $${previousPrice.toFixed(2)}).`,
            link: '/wishlist',
          });
          sendPushToUser(w.customer, {
            title: 'Price drop!',
            body: `${updatedProduct.productName} just got cheaper.`,
            url: '/wishlist',
          }).catch(() => {});
        })
      );
    }

    // ---- Back-in-stock alert ----
    if (previousQuantity === 0 && updatedProduct.quantity > 0) {
      const waitingList = await Wishlist.find({ product: id, notifiedBackInStock: false, notifyBackInStock: true }).select('customer');
      await Promise.all(
        waitingList.map(async (w) => {
          await createNotification({
            userId: w.customer,
            role: 'customer',
            type: 'back_in_stock',
            title: 'Back in stock',
            message: `${updatedProduct.productName} is available again.`,
            link: '/wishlist',
          });
          sendPushToUser(w.customer, {
            title: 'Back in stock!',
            body: `${updatedProduct.productName} is available again.`,
            url: '/wishlist',
          }).catch(() => {});
        })
      );
      await Wishlist.updateMany({ product: id }, { notifiedBackInStock: true });
    }
    // Reset the flag once stock runs out again, so a future restock re-notifies
    if (updatedProduct.quantity === 0) {
      await Wishlist.updateMany({ product: id }, { notifiedBackInStock: false });
    }

    // ---- Low-stock alert to the seller themself ----
    if (
      updatedProduct.quantity > 0 &&
      updatedProduct.quantity <= updatedProduct.lowStockThreshold &&
      previousQuantity > updatedProduct.lowStockThreshold
    ) {
      await createNotification({
        userId: session.id,
        role: 'seller',
        type: 'low_stock',
        title: 'Low stock warning',
        message: `${updatedProduct.productName} has only ${updatedProduct.quantity} left.`,
        link: '/seller/dashboard',
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession('seller');
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await connectToDB();
    const { id } = await params;

    const deletedProduct = await Product.findOneAndDelete({ _id: id, seller: session.id });
    if (!deletedProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
  }
}