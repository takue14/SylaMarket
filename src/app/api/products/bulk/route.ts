import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Product from '@/models/Product';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/session';

interface CsvRow {
  productName: string;
  price: string;
  category: string;
  description?: string;
  quantity?: string;
  segment?: string;
  imageLink?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession('seller');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { rows } = (await req.json()) as { rows: CsvRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ message: 'No rows provided.' }, { status: 400 });
    }
    if (rows.length > 200) {
      return NextResponse.json({ message: 'Maximum 200 products per bulk upload.' }, { status: 400 });
    }

    await connectToDB();
    const seller = await Seller.findById(session.id).select('country location');
    if (!seller?.location?.coordinates) {
      return NextResponse.json({ message: 'Set your seller location before bulk uploading.' }, { status: 400 });
    }

    const results: { row: number; success: boolean; error?: string }[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const productName = row.productName?.trim();
        const price = parseFloat(row.price);
        const category = row.category?.trim();

        if (!productName || !category || isNaN(price) || price <= 0) {
          results.push({ row: i + 1, success: false, error: 'Missing or invalid productName, price, or category.' });
          continue;
        }

        await Product.create({
          productName,
          price,
          category,
          description: row.description?.trim() || '',
          quantity: row.quantity ? parseInt(row.quantity) || 0 : 0,
          segment: row.segment === 'dealo-fresh' ? 'dealo-fresh' : 'dealo',
          imageLink: row.imageLink?.trim() || '',
          images: row.imageLink?.trim() ? [row.imageLink.trim()] : ['/placeholder.png'],
          seller: session.id,
          country: seller.country,
          location: seller.location,
        });

        created++;
        results.push({ row: i + 1, success: true });
      } catch (err) {
        results.push({ row: i + 1, success: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({ message: `${created} of ${rows.length} products created.`, results });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return NextResponse.json({ message: 'Bulk upload failed.' }, { status: 500 });
  }
}