import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { getSession } from '@/lib/session';

async function authorizeConversation(conversationId: string, asRole: 'buyer' | 'seller') {
  const sessionRole = asRole === 'buyer' ? 'customer' : 'seller';
  const session = await getSession(sessionRole);
  if (!session) return { authorized: false as const };

  await connectToDB();
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { authorized: false as const };

  // The role is now exactly what the caller stated via ?as= — no more
  // guessing by session priority. Ownership is still strictly enforced:
  // the stated role's account must actually match this conversation's
  // buyer or seller field, or the request is rejected outright. This
  // means a genuine multi-role user (or a tester with both sessions
  // active) can no longer have their intent silently overridden.
  const belongsToCaller = asRole === 'buyer' ? conversation.buyer === session.id : conversation.seller === session.id;
  if (!belongsToCaller) return { authorized: false as const };

  return { authorized: true as const, conversation, role: asRole, accountId: session.id };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asParam = req.nextUrl.searchParams.get('as');
  if (asParam !== 'buyer' && asParam !== 'seller') {
    return NextResponse.json({ message: 'A valid ?as= role is required.' }, { status: 400 });
  }

  const auth = await authorizeConversation(id, asParam);
  if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const messages = await Message.find({ conversation: id }).sort({ createdAt: 1 }).limit(200);

  const unreadField = auth.role === 'buyer' ? 'buyerUnread' : 'sellerUnread';
  await Conversation.findByIdAndUpdate(id, { [unreadField]: 0 });

  let otherPartyName = '';
  if (auth.role === 'buyer') {
    const { Seller } = await import('@/models/Seller');
    const seller = await Seller.findById(auth.conversation.seller).select('businessName name');
    otherPartyName = seller?.businessName || seller?.name || '';
  } else {
    const Customer = (await import('@/models/Customer')).default;
    const customer = await Customer.findById(auth.conversation.buyer).select('name');
    otherPartyName = customer?.name || '';
  }

  return NextResponse.json({ messages, otherPartyName });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asParam = req.nextUrl.searchParams.get('as');
  if (asParam !== 'buyer' && asParam !== 'seller') {
    return NextResponse.json({ message: 'A valid ?as= role is required.' }, { status: 400 });
  }

  const auth = await authorizeConversation(id, asParam);
  if (!auth.authorized) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ message: 'Message text is required.' }, { status: 400 });
    if (text.length > 2000) return NextResponse.json({ message: 'Message too long.' }, { status: 400 });

    const message = await Message.create({
      conversation: id,
      senderRole: auth.role, // now correctly the role the caller explicitly stated and was verified against
      senderId: auth.accountId,
      text: text.trim(),
    });

    const otherUnreadField = auth.role === 'buyer' ? 'sellerUnread' : 'buyerUnread';
    await Conversation.findByIdAndUpdate(id, {
      lastMessage: text.trim().slice(0, 100),
      lastMessageAt: new Date(),
      $inc: { [otherUnreadField]: 1 },
    });

    const recipientId = auth.role === 'buyer' ? auth.conversation.seller : auth.conversation.buyer;
    const recipientRole = auth.role === 'buyer' ? 'seller' : 'customer';
    const senderLabel = auth.role === 'buyer' ? 'A buyer' : 'A seller';

    const { createNotification } = await import('@/lib/notifications');
    await createNotification({
      userId: recipientId,
      role: recipientRole,
      type: 'new_message',
      title: 'New message',
      message: `${senderLabel} sent you a message: "${text.trim().slice(0, 60)}"`,
      link: `/messages/${id}?as=${auth.role === 'buyer' ? 'seller' : 'buyer'}`,
    }).catch((err) => console.error('Message notification failed (non-fatal):', err));

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error('Send message error:', err);
    return NextResponse.json({ message: 'Failed to send message.' }, { status: 500 });
  }
}