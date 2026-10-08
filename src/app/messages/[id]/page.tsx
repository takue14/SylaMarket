'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';

interface Msg {
  _id: string;
  senderRole: 'buyer' | 'seller';
  text: string;
  createdAt: string;
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function ChatPageInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const asRole = searchParams.get('as') === 'seller' ? 'seller' : 'buyer';

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [otherPartyName, setOtherPartyName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch(`/api/conversations/${id}/messages?as=${asRole}`);
    if (res.status === 401) {
      router.push('/auth');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.otherPartyName) setOtherPartyName(data.otherPartyName);
    }
  };

   useVisibilityPolling(load, 3000);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const body = text;
    setText('');
    await fetch(`/api/conversations/${id}/messages?as=${asRole}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body }),
    });
    load();
  };

  return (
    <Wrapper>
      <ChatHeader>
        <BackBtn onClick={() => router.back()}>‹</BackBtn>
        <HeaderAvatar>{initials(otherPartyName || '?')}</HeaderAvatar>
        <HeaderInfo>
          <HeaderName>{otherPartyName || 'Conversation'}</HeaderName>
          <HeaderSub>Viewing as {asRole === 'buyer' ? 'buyer' : 'seller'}</HeaderSub>
        </HeaderInfo>
      </ChatHeader>

      <MessageArea>
        {messages.map((m) => {
          const isMine = m.senderRole === asRole;
          return (
            <Row key={m._id} $mine={isMine}>
              {!isMine && <BubbleAvatar>{initials(otherPartyName || '?')}</BubbleAvatar>}
              <BubbleCol $mine={isMine}>
                <SenderTag>{m.senderRole === 'buyer' ? 'Buyer' : 'Seller'}</SenderTag>
                <Bubble $mine={isMine}>{m.text}</Bubble>
                <Timestamp>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Timestamp>
              </BubbleCol>
            </Row>
          );
        })}
        <div ref={bottomRef} />
      </MessageArea>

      <InputRow>
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type Your Message"
        />
        <SendBtn onClick={send} aria-label="Send">
          ➤
        </SendBtn>
      </InputRow>
    </Wrapper>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--header-height));
  max-width: 600px;
  margin: 0 auto;
  background: var(--bg-base);
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(150deg, #6b74f0, #5b6cff);
  padding: 16px 18px;
  border-radius: 0 0 20px 20px;
  flex-shrink: 0;
`;

const BackBtn = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
`;

const HeaderAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`;

const HeaderInfo = styled.div``;

const HeaderName = styled.div`
  color: white;
  font-weight: 700;
  font-size: 14.5px;
`;

const HeaderSub = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin-top: 1px;
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Row = styled.div<{ $mine: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  justify-content: ${(p) => (p.$mine ? 'flex-end' : 'flex-start')};
`;

const BubbleAvatar = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg-card-deep);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
`;

const BubbleCol = styled.div<{ $mine: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$mine ? 'flex-end' : 'flex-start')};
  max-width: 75%;
`;

const SenderTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-dim);
  margin-bottom: 3px;
  padding: 0 4px;
`;

const Bubble = styled.div<{ $mine: boolean }>`
  padding: 10px 14px;
  border-radius: 16px;
  border-bottom-right-radius: ${(p) => (p.$mine ? '4px' : '16px')};
  border-bottom-left-radius: ${(p) => (p.$mine ? '16px' : '4px')};
  font-size: 13.5px;
  line-height: 1.4;

  ${(p) =>
    p.$mine
      ? `
    background: var(--accent);
    color: white;
    border: 1px solid var(--accent);
  `
      : `
    background: #ffffff;
    color: #111111;
    border: 1.5px solid #000000;
  `}
`;

const Timestamp = styled.span`
  font-size: 10px;
  color: var(--text-dim);
  margin-top: 3px;
  padding: 0 4px;
`;

const InputRow = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(70px + env(safe-area-inset-bottom, 0px));
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-base);
  border-top: 1px solid var(--border);
  z-index: 500;

  @media (min-width: 700px) {
    bottom: 0;
    position: sticky;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13.5px;
  outline: none;
`;

const SendBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: white;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
`;