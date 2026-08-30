import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Notification from '@/models/Notification';
import { getSession } from '@/lib/session';
import type { Role } from '@/lib/jwt';

const roleMap: Record<string, Role> = {
  buyer: 'customer',
  seller: 'seller',
  delivery: 'delivery',
  admin: 'admin',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const asRole = req.nextUrl.searchParams.get('as');
  const resolvedRole = asRole ? roleMap[asRole] : undefined;
  if (!resolvedRole) return NextResponse.json({ message: 'A valid ?as= role is required.' }, { status: 400 });

  const session = await getSession(resolvedRole);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDB();
  await Notification.updateOne({ _id: id, userId: session.id, role: session.role }, { read: true });

  return NextResponse.json({ message: 'Marked as read.' });
}