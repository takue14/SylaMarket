'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/types/product';
import Loader from '@/components/Loader';
import Ac404 from '@/components/Ac404';

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
        <Ac404/>
      ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {products.map((p) => (
            <div key={p._id}>
              <ProductCard product={p} onClick={() => setSelected(p)} />
              
            </div>
          ))}
        </div>
      )}
      {selected && <ProductModal product={selected} isOpen={true} onClose={() => setSelected(null)} onSelectRelated={setSelected} />}
    </div>
  );
}