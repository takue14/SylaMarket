import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  // In production, process file with multer or upload to storage
  console.log('Uploaded product:', formData.get('productName'), formData.get('image'));
  return NextResponse.json({ success: true, message: 'Product uploaded (mock)' });
}