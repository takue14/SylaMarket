import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Address from '@/models/Address';
import { getSession } from '@/lib/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDB();
  const deleted = await Address.findOneAndDelete({ _id: id, customer: session.id });
  if (!deleted) return NextResponse.json({ message: 'Address not found.' }, { status: 404 });
  return NextResponse.json({ message: 'Deleted.' });
}