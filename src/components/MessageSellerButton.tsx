'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageSellerButton({ sellerId }: { sellerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const startChat = async () => {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      router.push('/auth?role=buyer&mode=signin');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId }),
      });
      const data = await res.json();
       if (res.ok) {
        router.push(`/messages/${data.conversationId}?as=buyer`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startChat}
      disabled={loading}
      style={{
        padding: '10px 22px',
        background: 'var(--bg-card-deep)',
        color: 'var(--text-primary)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '...' : '💬 Message Seller'}
    </button>
  );
}