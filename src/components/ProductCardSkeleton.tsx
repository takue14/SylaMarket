// src/components/ProductCardSkeleton.tsx (new: skeleton loading for product cards)
'use client';

import styles from '@/styles/ProductCard.module.css';

export default function ProductCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage}></div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonPrice}></div>
            <div className={styles.skeletonRating}></div>
            <div className={styles.skeletonButtons}>
              <div className={styles.skeletonButton}></div>
              <div className={styles.skeletonButton}></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}