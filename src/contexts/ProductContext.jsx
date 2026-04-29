'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext({
  products: [],
  refetchProducts: () => {},
});

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  const refetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    refetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, refetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProductContext = () => useContext(ProductContext);