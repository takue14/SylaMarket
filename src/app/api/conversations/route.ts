import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Conversation from '@/models/Conversation';
import Customer from '@/models/Customer';
import { Seller } from '@/models/Seller';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const asRole = req.nextUrl.searchParams.get('as');
  if (asRole !== 'buyer' && asRole !== 'seller') {
    return NextResponse.json({ message: 'A valid ?as= role is required.' }, { status: 400 });
  }

  const sessionRole = asRole === 'buyer' ? 'customer' : 'seller';
  const session = await getSession(sessionRole);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectToDB();
  const query = asRole === 'buyer' ? { buyer: session.id } : { seller: session.id };
  const conversations = await Conversation.find(query).sort({ lastMessageAt: -1 });

  // Enrich with the other party's name — never leak more than name/business name.
  const enriched = await Promise.all(
    conversations.map(async (c) => {
      if (asRole === 'buyer') {
        const seller = await Seller.findById(c.seller).select('businessName name');
        return {
          _id: c._id,
          otherPartyName: seller?.businessName || seller?.name || 'Seller',
          otherPartyId: c.seller,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unread: c.buyerUnread,
        };
      }
      const buyer = await Customer.findById(c.buyer).select('name');
      return {
        _id: c._id,
        otherPartyName: buyer?.name || 'Buyer',
        otherPartyId: c.buyer,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: c.sellerUnread,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  // Only a buyer can start a new conversation, per the "Message Seller"
  // and hamburger "start chat" entry points — sellers reply within
  // existing threads, they never initiate new ones.
  const session = await getSession('customer');
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { sellerId } = await req.json();
    if (!sellerId) return NextResponse.json({ message: 'sellerId is required.' }, { status: 400 });

    await connectToDB();
    const seller = await Seller.findById(sellerId).select('_id');
    if (!seller) return NextResponse.json({ message: 'Seller not found.' }, { status: 404 });

    const conversation = await Conversation.findOneAndUpdate(
      { buyer: session.id, seller: sellerId },
      { $setOnInsert: { buyer: session.id, seller: sellerId, createdAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ conversationId: conversation._id });
  } catch (err) {
    console.error('Start conversation error:', err);
    return NextResponse.json({ message: 'Failed to start conversation.' }, { status: 500 });
  }
}