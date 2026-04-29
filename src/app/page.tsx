'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeClient from '@/components/HomeClient';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      router.push('/customer/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [router]);

  if (!isLoggedIn) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Redirecting to login...</div>;
  }

  // Fixed: Passing required props to HomeClient
  return (
    <HomeClient 
      initialCategory="all" 
      initialProducts={[]} 
    />
  );
}