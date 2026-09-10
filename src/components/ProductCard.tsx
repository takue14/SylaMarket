'use client';

import ImageCarousel from './ImageCarousel';
import { CSSProperties } from 'react';
import styles from '@/styles/ProductCard.module.css';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useProductRating } from '@/hooks/useProductRating';
import { useState, useEffect } from 'react';

interface Props {
  product: Product;
  onClick: () => void;
}

// Renders filled, half, or empty stars based on a float average
function StarDisplay({ average, count }: { average: number; count: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const full  = i + 1 <= Math.floor(average);
    const half  = !full && i < average && average - i >= 0.25;
    return { full, half };
  });

  return (
    <div className={styles.rating}>
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            color: s.full || s.half ? '#ff9e0b' : '#444',
            fontSize: '14px',
            lineHeight: 1,
          }}
        >
          {s.full ? '★' : s.half ? '⯨' : '☆'}
        </span>
      ))}

      <span className={styles.reviewCount}>
        {count === 0
          ? 'No reviews'
          : `${average.toFixed(1)} (${count})`}
      </span>
    </div>
  );
}

export default function ProductCard({ product, onClick }: Props) {
  const { addToCart } = useCart();
  const { average, count } = useProductRating(product._id);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    fetch('/api/wishlist/status')
      .then((res) => res.json())
      .then((data) => setWishlisted((data.wishlisted || []).includes(product._id)))
      .catch(() => {});
  }, [product._id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      window.location.href = '/auth?role=buyer&mode=signin';
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id }),
      });
      const data = await res.json();
      setWishlisted(data.wishlisted);
    } catch {
      // fail silently — non-critical
    }
  };

  const imageStyle: CSSProperties = {
    ['--bg-color']: '#a78bfa',
  } as CSSProperties;

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const added = addToCart(product);
    if (added) {
      const customerId = localStorage.getItem('customerId');
      if (customerId) {
        fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'add_to_cart', product: { _id: product._id, productName: product.productName, imageLink: product.imageLink } }),
        }).catch(() => {});
      }
    }
  };

    const handleCardClick = () => {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view', product: { _id: product._id, productName: product.productName, imageLink: product.imageLink } }),
      }).catch(() => {});
    }
    onClick();
  };

  return (
    <div
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.productName}`}
    >
      <div className={styles.card__shine} />
      <div className={styles.card__glow} />

      <div className={styles.card__content}>
        <div className={styles.card__badge}>NEW</div>
                <button
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 5,
            background: 'rgba(0,0,0,0.45)',
            border: 'none',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? '#ef4444' : 'none'} stroke={wishlisted ? '#ef4444' : '#fff'} strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>

                <ImageCarousel
          images={product.images?.length ? product.images : product.imageLink ? [product.imageLink] : []}
          alt={product.productName}
          height={150}
          borderRadius={12}
        />

        <div className={styles.card__text}>
          <h3 className={styles.card__title}>{product.productName}</h3>

          {/* ── Live rating ── */}
          <StarDisplay average={average} count={count} />

          <p className={styles.card__description}>{product.description}</p>

          <div className={styles.card__footer}>
                        {product.salePrice != null && product.salePrice < product.price ? (
              <p className={styles.card__price}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: 6, fontSize: '0.85em' }}>
                  ${product.price.toFixed(2)}
                </span>
                ${product.salePrice.toFixed(2)}
              </p>
            ) : (
              <p className={styles.card__price}>${product.price.toFixed(2)}</p>
            )}

            <button className={styles.card__button} onClick={handleAddToCart}>
              <svg height={16} width={16} viewBox="0 0 24 24">
                <path
                  strokeWidth={2}
                  stroke="currentColor"
                  d="M4 12H20M12 4V20"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}