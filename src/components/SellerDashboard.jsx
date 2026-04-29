'use client';

import { useState, useEffect } from 'react';
import SellerUploadForm from './SellerUploadForm';
import ProductCard from './ProductCard';
import { useRouter } from 'next/navigation';  // For better redirects
import styles from '@/styles/SellerForm.module.css';
import Loader from '@/assets/loader.gif';

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId) {
      alert('Please log in first');
      router.push('/seller');  // Redirect to login
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/sellers/${sellerId}/products`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [router]);

  return (
    <div className={styles.dashboard}>
      <SellerUploadForm />  {/* Upload only here, after login */}
      <h2>Your Products on the Market</h2>
      {loading ? (
        <Loader/>
      ) : products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={{
                id: product._id,
                name: product.productName,
                price: product.price,
                rating: 0,
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