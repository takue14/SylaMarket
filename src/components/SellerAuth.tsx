// src/components/SellerAuth.tsx (updated: handle redirect in handleLoginSuccess only)
'use client';

import { useState } from 'react';
import SellerRegister from './SellerRegister';
import SellerLogin from './SellerLogin';
import styles from '@/styles/SellerForm.module.css';

export default function SellerAuth() {
  const [view, setView] = useState<'login' | 'register'>('login');

  const handleRegisterSuccess = () => {
    setView('login');
    alert('Registered successfully! Please log in to continue.');
  };

  const handleLoginSuccess = () => {
    // Redirect to dashboard only after successful login
    window.location.href = '/seller/dashboard';
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.toggleButtons}>
        <button
          onClick={() => setView('login')}
          className={view === 'login' ? styles.active : ''}
        >
          Login
        </button>
        <button
          onClick={() => setView('register')}
          className={view === 'register' ? styles.active : ''}
        >
          Register
        </button>
      </div>

      {view === 'login' && <SellerLogin onLoginSuccess={handleLoginSuccess} />}
      {view === 'register' && <SellerRegister onRegisterSuccess={handleRegisterSuccess} />}
    </div>
  );
}