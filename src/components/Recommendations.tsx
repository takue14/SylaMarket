// src/components/Recommendations.tsx (updated: match mockup with 4 cards)
import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { Product } from '@/types/product';
import styles from '@/styles/Home.module.css';

export default function Recommendations({ userPreferences }: { userPreferences?: string[] }) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products?category=recommendations&limit=4') // Mock endpoint; adjust as needed
      .then(res => res.json())
      .then(setRecommendations)
      .finally(() => setLoading(false));
  }, [userPreferences]);

  if (loading) return <ProductCardSkeleton count={4} />;

  return (
    <div className={styles.grid}>
      {recommendations.map(product => (
        <ProductCard key={product._id} product={product} onClick={() => {}} />
      ))}
    </div>
  );
}