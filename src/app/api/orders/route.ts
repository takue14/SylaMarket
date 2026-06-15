import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function POST(req: Request) {
  try {
    await connectToDB();

    const body = await req.json();
    const { customerId, customerName, contact, location, products, totalAmount } = body;

    if (!customerName || !contact || !location || !products?.length) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newOrder = await Order.create({
      customer: customerId,
      customerName,
      contact,
      location,
      products,
      totalAmount,
      status: 'pending',
      claimedBy: null,
    });

    // Automatic stock deduction
    for (const item of products) {
      await Product.findOneAndUpdate(
        { productName: item.productName },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ message: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  await connectToDB();
  const orders = await Order.find().sort({ createdAt: -1 });
  return NextResponse.json(orders);
}

export async function PATCH(req: Request) {
  try {
    await connectToDB();
    const { orderId, status, deliveryGuyId } = await req.json();

    const update: { status: string; claimedBy?: string } = { status };

    if (deliveryGuyId) {
      update.claimedBy = deliveryGuyId;
    }

    const updated = await Order.findByIdAndUpdate(orderId, update, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
  }
}