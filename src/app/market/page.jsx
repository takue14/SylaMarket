'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import styles from '@/styles/SellerForm.module.css';  // Reuse for product list layout
import Loader from '@/components/Loader';

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      <h1>All Products</h1>
      {loading ? (
        <Loader/>
      ) : products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={{
                id: product._id,
                name: product.productName,
                price: product.price,
                rating: 0,  // Mock
                reviews: 0,
                image: product.imageLink,
                description: product.description,
              }}
              onClick={() => console.log('Product clicked:', product._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}