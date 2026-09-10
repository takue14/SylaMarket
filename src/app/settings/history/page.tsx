'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

interface ActivityItem {
  _id: string;
  productName: string;
  productImage?: string;
  product: string;
  createdAt: string;
}

export default function ViewHistoryPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/activity')
      .then((res) => {
        if (res.status === 401) {
          router.push('/auth?role=buyer&mode=signin');
          return [];
        }
        return res.json();
      })
      .then((data) => setItems(data || []))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>Recently Viewed</h1>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}><Loader/></p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No browsing history yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <div
              key={item._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: 'var(--bg-card)',
                borderRadius: 12,
              }}
            >
              <img
                src={item.productImage || '/placeholder.png'}
                alt={item.productName}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}