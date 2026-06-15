import { useState, useEffect } from 'react';

interface RatingData {
  average: number;
  count: number;
}

export function useProductRating(productId: string): RatingData {
  const [data, setData] = useState<RatingData>({ average: 0, count: 0 });

  useEffect(() => {
    if (!productId) return;

    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        if (!res.ok) return;

        const reviews: { rating: number }[] = await res.json();

        if (reviews.length === 0) {
          setData({ average: 0, count: 0 });
          return;
        }

        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const average = total / reviews.length;

        setData({ average, count: reviews.length });
      } catch (err) {
        console.error('Failed to fetch rating for product', productId);
      }
    };

    fetchRating();

    // ── Poll every 30s for real-time updates ──
    const interval = setInterval(fetchRating, 30000);
    return () => clearInterval(interval);
  }, [productId]);

  return data;
}