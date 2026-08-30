'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaBars } from 'react-icons/fa';
import styles from '@/styles/CategorySidebar.module.css';

const categories = ['All', 'Phone', 'Headphones', 'watch', 'shoe', 'New', 'Best Seller', 'On Discount'];

interface Props {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategorySidebar({ selectedCategory, onSelectCategory }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (category: string) => {
    onSelectCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
    if (window.innerWidth < 768) setIsOpen(false);  // Close on mobile select
  };

  return (
    <>
      <button className={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        <FaBars />
      </button>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <h3>Category</h3>
        <ul>
          {categories.map(cat => (
            <li
              key={cat}
              onClick={() => handleSelect(cat)}
              className={cat === selectedCategory ? styles.selected : ''}
            >
              {cat}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}