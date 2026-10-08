'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';

interface ConversationSummary {
  _id: string;
  otherPartyName: string;
  otherPartyId: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface SellerResult {
  _id: string;
  businessName: string;
  name: string;
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface ChatListPanelProps {
  onClose: () => void;
  asRole: 'buyer' | 'seller';
}

export default function ChatListPanel({ onClose, asRole }: ChatListPanelProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [search, setSearch] = useState('');
  const [sellerResults, setSellerResults] = useState<SellerResult[]>([]);
  const [searching, setSearching] = useState(false);

     const loadConversations = () => {
    fetch(`/api/conversations?as=${asRole}`)
      .then((res) => res.json())
      .then(setConversations)
      .catch(() => {});
  };

   useVisibilityPolling(loadConversations, 5000);

  useEffect(() => {
    // Only buyers can search for sellers to start a new conversation —
    // sellers never initiate, per the original scoping.
    if (asRole !== 'buyer' || !search.trim()) {
      setSellerResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/sellers/search?q=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then(setSellerResults)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, asRole]);

   const startWithSeller = async (sellerId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId }),
    });
    const data = await res.json();
    if (res.ok) {
      onClose();
      router.push(`/messages/${data.conversationId}?as=${asRole}`);
    }
  };

  const recentContacts = conversations.slice(0, 6);

  return (
    <Overlay onClick={onClose}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <HeaderCard>
          <TopRow>
            <span>MESSAGES</span>
          </TopRow>

                  {asRole === 'buyer' && (
            <SearchRow>
              <SearchInput
                placeholder="Search sellers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchRow>
          )}

          {!search && recentContacts.length > 0 && (
            <AvatarRow>
              {recentContacts.map((c) => (
                <AvatarBubble
                  key={c._id}
                  onClick={() => {
                    onClose();
                    router.push(`/messages/${c._id}`);
                  }}
                  title={c.otherPartyName}
                >
                  {initials(c.otherPartyName)}
                </AvatarBubble>
              ))}
            </AvatarRow>
          )}
        </HeaderCard>

        <ListArea>
          {search ? (
            searching ? (
              <EmptyState>Searching…</EmptyState>
            ) : sellerResults.length === 0 ? (
              <EmptyState>No sellers found.</EmptyState>
            ) : (
              sellerResults.map((s) => (
                <ListRow key={s._id} onClick={() => startWithSeller(s._id)}>
                  <Avatar>{initials(s.businessName || s.name)}</Avatar>
                  <RowText>
                    <RowName>{s.businessName || s.name}</RowName>
                    <RowPreview>Start a conversation</RowPreview>
                  </RowText>
                </ListRow>
              ))
            )
          ) : conversations.length === 0 ? (
            <EmptyState>
              {asRole === 'buyer'
                ? 'No conversations yet — search a seller above to start one.'
                : 'No messages yet — buyers will appear here once they reach out.'}
            </EmptyState>
          ) : (
            conversations.map((c) => (
              <ListRow
                key={c._id}
                                onClick={() => {
                  onClose();
                  router.push(`/messages/${c._id}?as=${asRole}`);
                }}
              >
                <Avatar>{initials(c.otherPartyName)}</Avatar>
                <RowText>
                  <RowTop>
                    <RowName $unread={c.unread > 0}>{c.otherPartyName}</RowName>
                    <RowTime>{timeAgo(c.lastMessageAt)}</RowTime>
                  </RowTop>
                  <RowBottom>
                    <RowPreview $unread={c.unread > 0}>{c.lastMessage || 'Say hello 👋'}</RowPreview>
                    {c.unread > 0 && <UnreadBadge>{c.unread}</UnreadBadge>}
                  </RowBottom>
                </RowText>
              </ListRow>
            ))
          )}
        </ListArea>
        <div style={{ height: '60px' }}></div>
      </Sheet>
    </Overlay>
  );
}

/* ================== Inline styled bits (kept local to this file, matching your existing pattern) ================== */

import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100000;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  @media (min-width: 700px) {
    align-items: center;
  }
`;

const Sheet = styled.div`
  background: var(--bg-base);
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (min-width: 700px) {
    border-radius: 24px;
    max-height: 640px;
  }
`;

const HeaderCard = styled.div`
  background: linear-gradient(150deg, #6b74f0, #5b6cff);
  padding: 20px 18px 16px;
  border-radius: 24px 24px 0 0;
  flex-shrink: 0;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  margin-bottom: 14px;
`;

const SearchRow = styled.div`
  margin-bottom: 14px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 11px 16px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  font-size: 13.5px;
  box-sizing: border-box;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.75);
  }
`;

const AvatarRow = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const AvatarBubble = styled.div`
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.35);
`;

const ListArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
`;

const ListRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-card);
  }
`;

const Avatar = styled.div`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-card-deep);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
`;

const RowText = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const RowName = styled.span<{ $unread?: boolean }>`
  font-size: 14.5px;
  font-weight: ${(p) => (p.$unread ? 700 : 600)};
  color: var(--text-primary);
`;

const RowTime = styled.span`
  font-size: 11px;
  color: var(--text-dim);
  flex-shrink: 0;
`;

const RowBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
`;

const RowPreview = styled.span<{ $unread?: boolean }>`
  font-size: 12.5px;
  color: ${(p) => (p.$unread ? 'var(--text-primary)' : 'var(--text-muted)')};
  font-weight: ${(p) => (p.$unread ? 600 : 400)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UnreadBadge = styled.span`
  flex-shrink: 0;
  background: var(--accent);
  color: white;
  font-size: 10.5px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
`;

const EmptyState = styled.p`
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 30px 16px;
`;