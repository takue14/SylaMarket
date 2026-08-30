'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';

export default function AdminMarket() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin] = useState(true); // Change this to real admin check later

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  const delistProduct = async (id: string) => {
    if (!confirm('Delist this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p._id !== id));
  };

  if (!isAdmin) return <p>Access Denied</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Super Admin Market</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <div key={product._id} style={{ border: '1px solid #ccc', padding: '15px' }}>
            <h3>{product.productName}</h3>
            <p>${product.price}</p>
            <button onClick={() => delistProduct(product._id)} style={{ background: 'red', color: 'white' }}>
              Delist Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}