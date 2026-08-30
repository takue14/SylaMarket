'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { resolvePostLoginIntent } from '@/lib/cartIntent';

function GoogleCompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { addToCart, buyNow } = useCart();

  useEffect(() => {
    const customerId = params.get('customerId');
    if (customerId) {
      localStorage.setItem('customerId', customerId);
    }

    (async () => {
      const resumed = await resolvePostLoginIntent(addToCart, buyNow);
      router.replace(resumed?.type === 'buy-now' ? '/cart' : '/');
    })();
  }, [params, router, addToCart, buyNow]);

  return null;
}

export default function GoogleCompletePage() {
  return (
    <Suspense fallback={null}>
      <GoogleCompleteInner />
    </Suspense>
  );
}