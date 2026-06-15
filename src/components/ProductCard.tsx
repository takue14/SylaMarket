'use client';

import Image from 'next/image';
import { CSSProperties } from 'react';
import styles from '@/styles/ProductCard.module.css';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useProductRating } from '@/hooks/useProductRating';

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

  // ── Real-time rating ──
  const { average, count } = useProductRating(product._id);

  const imageStyle: CSSProperties = {
    ['--bg-color']: '#a78bfa',
  } as CSSProperties;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.productName}`}
    >
      <div className={styles.card__shine} />
      <div className={styles.card__glow} />

      <div className={styles.card__content}>
        <div className={styles.card__badge}>NEW</div>

        {product.imageLink && (
          <Image
            src={product.imageLink}
            alt={product.productName}
            width={200}
            height={150}
            className={styles.card__image}
            style={imageStyle}
            priority={false}
          />
        )}

        <div className={styles.card__text}>
          <h3 className={styles.card__title}>{product.productName}</h3>

          {/* ── Live rating ── */}
          <StarDisplay average={average} count={count} />

          <p className={styles.card__description}>{product.description}</p>

          <div className={styles.card__footer}>
            <p className={styles.card__price}>${product.price.toFixed(2)}</p>

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