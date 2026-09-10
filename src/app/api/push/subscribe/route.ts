import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import PushSubscription from '@/models/PushSubscription';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession('customer').catch(() => null);
  const sellerSession = session ? null : await getSession('seller').catch(() => null);
  const activeSession = session || sellerSession;
  if (!activeSession) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { endpoint, keys } = await req.json();
    await connectToDB();
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: activeSession.id, endpoint, keys },
      { upsert: true }
    );
    return NextResponse.json({ message: 'Subscribed.' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ message: 'Failed to subscribe.' }, { status: 500 });
  }
}