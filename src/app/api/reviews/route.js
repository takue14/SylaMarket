import { connectToDB } from '@/lib/mongoose';
import Review from '@/models/Review';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDB();
  const body = await req.json();
  const review = await Review.create(body);
  return NextResponse.json(review, { status: 201 });
}

export async function GET(req) {
  await connectToDB();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  const reviews = await Review.find({ productId });
  return NextResponse.json(reviews);
}