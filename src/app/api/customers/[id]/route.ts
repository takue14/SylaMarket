import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Customer from '@/models/Customer';
import { getSession } from '@/lib/session';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customerSession = await getSession('customer');
    const adminSession = customerSession ? null : await getSession('admin');

    if (!(customerSession?.id === id) && !adminSession) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDB();
    const customer = await Customer.findById(id).select('name contact email');
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json({ message: 'Failed to fetch customer' }, { status: 500 });
  }
}