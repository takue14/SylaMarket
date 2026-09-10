'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/types/product';
import Loader from '@/components/Loader';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Product | null>(null);
  const [notifyPrefs, setNotifyPrefs] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const updateNotifyPref = async (productId: string, value: boolean) => {
    setNotifyPrefs((prev) => ({ ...prev, [productId]: value }));
    try {
      await fetch(`/api/wishlist/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyBackInStock: value }),
      });
    } catch {
      // non-critical — leave the optimistic UI update as-is
    }
  };

  useEffect(() => {
    fetch('/api/wishlist')
      .then((res) => {
        if (res.status === 401) {
          router.push('/auth?role=buyer&mode=signin');
          return [];
        }
        return res.json();
      })
      .then((data) => setProducts(data || []))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>My Wishlist</h1>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}><Loader/></p>
      ) : products.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Nothing saved yet — tap the heart on any product to add it here.</p>
      ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.map((p) => (
            <div key={p._id}>
              <ProductCard product={p} onClick={() => setSelected(p)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 6, paddingLeft: 4 }}>
                <input
                  type="checkbox"
                  checked={notifyPrefs[p._id] ?? true}
                  onChange={(e) => updateNotifyPref(p._id, e.target.checked)}
                />
                Notify me if back in stock
              </label>
            </div>
          ))}
        </div>
      )}
      {selected && <ProductModal product={selected} isOpen={true} onClose={() => setSelected(null)} onSelectRelated={setSelected} />}
    </div>
  );
}