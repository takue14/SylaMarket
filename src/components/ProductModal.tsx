'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import styles from '@/styles/ProductModal.module.css';

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!isOpen || !product._id) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${product._id}`);
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews');
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [isOpen, product._id]);

  const handleAddToCart = () => {
    addToCart(product);
    alert(`${product.productName} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product);
    onClose();
    window.location.href = '/cart';
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const customerId = localStorage.getItem('customerId');
    const customerName = "Current User";

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          customerId,
          customerName,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews(prev => [newReview, ...prev]);
        setComment('');
        alert('Review submitted successfully!');
      }
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>

        <div className={styles.content}>
          <div className={styles.imageSection}>
            {product.imageLink && (
              <Image
                src={product.imageLink}
                alt={product.productName}
                width={300}
                height={300}
                priority
                style={{ borderRadius: '12px', objectFit: 'cover' }}
              />
            )}
          </div>

          <div className={styles.detailsSection}>
            <h2>{product.productName}</h2>
            <p className={styles.price}>${product.price.toFixed(2)}</p>
            <p className={styles.description}>
              {product.description || 'No description available.'}
            </p>

            {/* Buttons in perfect straight line */}
            <div className="action-buttons">
              <button className="cartbuttons" onClick={handleAddToCart}>
                Add to Cart
              </button>

              <div
                className="buybutton"
                data-tooltip={`Price: $${product.price}`}
                onClick={handleBuyNow}
              >
                <div className="button-wrapper1">
                  <div className="text1">Buy Now</div>
                  <span className="icon1">
                    <svg
                      viewBox="0 0 16 16"
                      className="bi bi-cart2"
                      fill="currentColor"
                      height={16}
                      width={16}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className={styles.reviewsSection}>
          <h3>Customer Reviews</h3>

          {loadingReviews ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet. Be the first to review!</p>
          ) : (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review._id} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.user}>{review.customerName}</span>
                    <span className={styles.rating}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Purple Themed Review Form */}
          <div className="form-container">
            <form onSubmit={handleSubmitReview} className="form">
              <label>Rating</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} ★</option>
                ))}
              </select>

              <label>Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here..."
                rows={3}
              />

              <button type="submit" className="submit-btn">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* === STYLES (Purple theme + aligned buttons + styled auto-hide scrollbar) === */}
      <style jsx>{`
        .action-buttons {
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 20px 0;
        }

        /* Purple Review Form */
        .form-container {
          background: #ffffff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
          margin-top: 20px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form label {
          font-weight: 600;
          color: #4b0082;
          margin-bottom: 6px;
        }

        .form select,
        .form textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #d8b4fe;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s;
        }

        .form select:focus,
        .form textarea:focus {
          border-color: #7c3aed;
          outline: none;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }

        .submit-btn {
          background: #7c3aed;
          color: #fff;
          padding: 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s;
        }

        .submit-btn:hover {
          background: #6d28d9;
          transform: translateY(-2px);
        }

        /* Styled Scrollbar (purple + hides when not scrolling) */
        .reviewsList {
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #7c3aed transparent;
        }

        .reviewsList::-webkit-scrollbar {
          width: 6px;
        }

        .reviewsList::-webkit-scrollbar-thumb {
          background: #7c3aed;
          border-radius: 20px;
        }

        .reviewsList::-webkit-scrollbar-thumb:hover {
          background: #6d28d9;
        }

        .reviewsList::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Your original button styles (unchanged) */
        .cartbuttons {
          position: relative;
          padding: 10px 22px;
          border-radius: 6px;
          border: none;
          color: #fff;
          cursor: pointer;
          background-color: #7d2ae8;
          transition: all 0.2s ease;
        }
        .cartbuttons:active { transform: scale(0.96); }

        .cartbuttons:before,
        .cartbuttons:after {
          position: absolute;
          content: "";
          width: 150%;
          left: 50%;
          height: 100%;
          transform: translateX(-50%);
          z-index: -1000;
          background-repeat: no-repeat;
        }

        .cartbuttons:hover:before {
          top: -70%;
          background-image: radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, transparent 20%, #7d2ae8 20%, transparent 30%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, transparent 10%, #7d2ae8 15%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%);
          background-size: 10% 10%, 20% 20%, 15% 15%, 20% 20%, 18% 18%, 10% 10%, 15% 15%, 10% 10%, 18% 18%;
          background-position: 50% 120%;
          animation: greentopBubbles 0.6s ease;
        }

        @keyframes greentopBubbles {
          0% { background-position: 5% 90%, 10% 90%, 10% 90%, 15% 90%, 25% 90%, 25% 90%, 40% 90%, 55% 90%, 70% 90%; }
          50% { background-position: 0% 80%, 0% 20%, 10% 40%, 20% 0%, 30% 30%, 22% 50%, 50% 50%, 65% 20%, 90% 30%; }
          100% { background-position: 0% 70%, 0% 10%, 10% 30%, 20% -10%, 30% 20%, 22% 40%, 50% 40%, 65% 10%, 90% 20%; background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
        }

        .cartbuttons:hover::after {
          bottom: -70%;
          background-image: radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, transparent 10%, #7d2ae8 15%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%),
            radial-gradient(circle, #7d2ae8 20%, transparent 20%);
          background-size: 15% 15%, 20% 20%, 18% 18%, 20% 20%, 15% 15%, 20% 20%, 18% 18%;
          background-position: 50% 0%;
          animation: greenbottomBubbles 0.6s ease;
        }

        @keyframes greenbottomBubbles {
          0% { background-position: 10% -10%, 30% 10%, 55% -10%, 70% -10%, 85% -10%, 70% -10%, 70% 0%; }
          50% { background-position: 0% 80%, 20% 80%, 45% 60%, 60% 100%, 75% 70%, 95% 60%, 105% 0%; }
          100% { background-position: 0% 90%, 20% 90%, 45% 70%, 60% 110%, 75% 80%, 95% 70%, 110% 10%; background-size: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
        }

        .buybutton {
          --width: 130px;
          --height: 35px;
          --tooltip-height: 35px;
          --tooltip-width: 110px;
          --gap-between-tooltip-to-button: 18px;
          --button-color: #222;
          width: var(--width);
          height: var(--height);
          background: var(--button-color);
          position: relative;
          text-align: center;
          border-radius: 0.45em;
          font-family: Arial;
          transition: background 0.3s;
          cursor: pointer;
          display: block;
        }

        .buybutton::before,
        .buybutton::after {
          opacity: 0;
          visibility: hidden;
          transition: all 0.5s;
        }

        .buybutton::before {
          content: attr(data-tooltip);
          position: absolute;
          width: var(--tooltip-width);
          height: var(--tooltip-height);
          background-color: #555;
          color: #fff;
          font-size: 0.9rem;
          border-radius: 0.25em;
          line-height: var(--tooltip-height);
          bottom: calc(var(--height) + var(--gap-between-tooltip-to-button));
          left: 50%;
          transform: translateX(-50%);
        }

        .buybutton::after {
          content: '';
          position: absolute;
          border: 10px solid transparent;
          border-top-color: #555;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) - 10px);
        }

        .button-wrapper1, .text1, .icon1 {
          overflow: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          color: #fff;
        }

        .text1 {
          display: flex;
          align-items: center;
          justify-content: center;
          top: 0;
          transition: top 0.5s;
        }

        .icon1 {
          display: flex;
          align-items: center;
          justify-content: center;
          top: 100%;
          transition: top 0.5s;
        }

        .buybutton:hover .text1 { top: -100%; }
        .buybutton:hover .icon1 { top: 0; }

        .buybutton:hover::before,
        .buybutton:hover::after {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}
