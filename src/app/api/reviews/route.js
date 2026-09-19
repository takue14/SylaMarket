import { connectToDB } from '@/lib/mongoose';
import Review from '@/models/Review';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req) {
  const session = await getSession('customer');
  if (!session) {
    return NextResponse.json({ message: 'You must be signed in to leave a review.' }, { status: 401 });
  }

  await connectToDB();
  const body = await req.json();

  if (!body.productId || !body.rating || !body.comment?.trim()) {
    return NextResponse.json({ message: 'productId, rating, and comment are required.' }, { status: 400 });
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
  }

  const review = await Review.create({
    productId: body.productId,
    customerId: session.id, // never trust a customerId from the request body
    customerName: body.customerName?.trim() || 'Anonymous',
    rating: body.rating,
    comment: body.comment.trim(),
  });

  return NextResponse.json(review, { status: 201 });
}

export async function GET(req) {
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json([], { status: 200 });

  const reviews = await Review.find({ productId });
  return NextResponse.json(reviews);
}