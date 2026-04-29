'use client';

import Image from 'next/image';
import { CSSProperties } from 'react';
import styles from '@/styles/ProductCard.module.css';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: Props) {
  const { addToCart } = useCart();

  const imageStyle: CSSProperties = { 
    ['--bg-color']: '#a78bfa' 
  } as CSSProperties;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0} aria-label={`View ${product.productName}`}>
      <div className={styles.card__shine}></div>
      <div className={styles.card__glow}></div>
      
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
          
          <div className={styles.rating}>
            ★★★★☆
            <span className={styles.reviewCount}>12 reviews</span>
          </div>
          <p className={styles.card__description}>{product.description}</p>
      
          <div className={styles.card__footer}>
            <p className={styles.card__price}>${product.price.toFixed(2)}</p>
            
            <button className={styles.card__button} onClick={handleAddToCart}>
              <svg height={16} width={16} viewBox="0 0 24 24">
                <path strokeWidth={2} stroke="currentColor" d="M4 12H20M12 4V20" fill="currentColor" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}