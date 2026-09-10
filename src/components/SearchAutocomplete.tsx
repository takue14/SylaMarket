'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SuggestProduct {
  _id: string;
  productName: string;
  imageLink?: string;
  price: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct?: (productId: string) => void;
}

export default function SearchAutocomplete({ value, onChange, onSelectProduct }: Props) {
  const [products, setProducts] = useState<SuggestProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setProducts([]);
      setCategories([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } catch {
        // fail silently
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSuggestions = products.length > 0 || categories.length > 0;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search products…"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'var(--bg-input, var(--bg-card))',
          color: 'var(--text-primary)',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      />

      {open && hasSuggestions && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
            zIndex: 100,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {categories.length > 0 && (
            <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Categories
            </div>
          )}
          {categories.map((c) => (
            <div
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{ padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13.5 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {c}
            </div>
          ))}

          {products.length > 0 && (
            <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderTop: categories.length ? '1px solid var(--border)' : 'none' }}>
              Products
            </div>
          )}
          {products.map((p) => (
            <div
              key={p._id}
              onClick={() => {
                setOpen(false);
                if (onSelectProduct) onSelectProduct(p._id);
                else router.push(`/?search=${encodeURIComponent(p.productName)}`);
              }}
              onMouseDown={(e) => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer' }}
            >
              <img src={p.imageLink || '/placeholder.png'} alt={p.productName} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}>{p.productName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${p.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}