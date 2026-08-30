'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { setPostLoginIntent } from '@/lib/cartIntent';

export interface CartItem extends Product {
  quantity: number;
  imageLink?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => boolean; // false if blocked (guest, redirected)
  buyNow: (product: Product) => boolean;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      const savedCart = localStorage.getItem(`cart_${customerId}`);
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      localStorage.setItem(`cart_${customerId}`, JSON.stringify(cart));
    }
  }, [cart]);

  const insertItem = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Returns true if the guest was redirected (caller should stop here)
  const redirectIfGuest = (product: Product, type: 'add-to-cart' | 'buy-now'): boolean => {
    const customerId = localStorage.getItem('customerId');
    if (!customerId) {
      setPostLoginIntent({ type, productId: product._id });
      router.push(`/auth?intent=${type}`);
      return true;
    }
    return false;
  };

  const addToCart = (product: Product): boolean => {
    if (redirectIfGuest(product, 'add-to-cart')) return false;
    insertItem(product);
    return true;
  };

  const buyNow = (product: Product): boolean => {
    if (redirectIfGuest(product, 'buy-now')) return false;
    insertItem(product);
    router.push('/cart');
    return true;
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, buyNow, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};