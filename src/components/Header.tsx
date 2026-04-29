'use client';

import { useState } from 'react';
import { FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import styles from '@/styles/Header.module.css';
import Link from 'next/link';  // Add this import
import NotificationBell from './NotificationBell';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Syla</div>
      <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
        <Link href="/">Shop</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/seller">Seller</Link>
        <Link href="/delivery/login">Delivery</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/credits">Credits</Link>
      </nav>
      <div className={styles.icons}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Link href="/customer/dashboard"><FaUser /></Link>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Link href="/cart"><NotificationBell itemCount={cartCount} /></Link>
        </div>
      </div>
      <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
        ☰
      </button>
    </header>
  );
}