'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  customerName: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => setProduct(data));

    fetch(`/api/reviews?productId=${id}`)
      .then(res => res.json())
      .then(setReviews);
  }, [id]);

  const submitReview = async () => {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      alert('Please login to review');
      return;
    }

    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, customerId, rating, comment })
    });

    alert('Review submitted!');
    window.location.reload();
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{product.productName}</h1>
      <p>${product.price}</p>
      <button onClick={() => addToCart(product)}>Add to Cart</button>

      <h2>Reviews</h2>
      {reviews.map(r => (
        <div key={r._id}>
          <p>⭐ {r.rating} - {r.comment}</p>
        </div>
      ))}

      <h3>Write a Review</h3>
      <select value={rating} onChange={e => setRating(Number(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} stars</option>)}
      </select>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Your review..." />
      <button onClick={submitReview}>Submit Review</button>
    </div>
  );
}