'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

const CATEGORIES = ['Home', 'Music', 'Phone', 'Shoes', 'Hats', 'Other'];
const PAYMENT_OPTIONS = [
  { key: 'cod', label: 'Cash on Delivery' },
  { key: 'ecocash', label: 'EcoCash' },
  { key: 'paynow', label: 'Card / Bank (Paynow)' },
];

interface OriginalProduct {
  productName: string;
  price: number;
  salePrice: number | null;
  category: string;
  description: string;
  quantity: number;
  segment: string;
  paymentMethods: string[];
  lowStockThreshold: number;
  depositPercentage: number | null;
}

export default function EditProductPage() {
  const { notify } = useNotification();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [original, setOriginal] = useState<OriginalProduct | null>(null);
  const [form, setForm] = useState({
    productName: '',
    price: '',
    salePrice: '',
    category: '',
    description: '',
    quantity: '',
    segment: '',
    paymentMethods: null as string[] | null, // null = unchanged from original
    lowStockThreshold: '',
    depositPercentage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((p) => {
        setOriginal({
          productName: p.productName || '',
          price: p.price ?? 0,
          salePrice: p.salePrice ?? null,
          category: p.category || '',
          description: p.description || '',
          quantity: p.quantity ?? 0,
          segment: p.segment || 'dealo',
          paymentMethods: p.paymentMethods?.length ? p.paymentMethods : ['cod', 'ecocash', 'paynow'],
          lowStockThreshold: p.lowStockThreshold ?? 5,
          depositPercentage: p.depositPercentage ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const togglePayment = (key: string) => {
    setForm((prev) => {
      const base = prev.paymentMethods ?? original?.paymentMethods ?? [];
      const has = base.includes(key);
      const next = has ? base.filter((k) => k !== key) : [...base, key];
      return { ...prev, paymentMethods: next };
    });
  };

  const activePaymentMethods = form.paymentMethods ?? original?.paymentMethods ?? [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!original) return;
    if (activePaymentMethods.length === 0) {
      notify('Select at least one payment method.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName.trim() || original.productName,
          price: form.price.trim() ? parseFloat(form.price) : original.price,
          salePrice: form.salePrice.trim() ? parseFloat(form.salePrice) : original.salePrice,
          category: form.category || original.category,
          description: form.description.trim() || original.description,
          quantity: form.quantity.trim() ? parseInt(form.quantity) : original.quantity,
          segment: form.segment || original.segment,
          paymentMethods: activePaymentMethods,
          lowStockThreshold: form.lowStockThreshold.trim() ? parseInt(form.lowStockThreshold) : original.lowStockThreshold,
          depositPercentage: form.depositPercentage.trim() ? parseInt(form.depositPercentage) : original.depositPercentage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify('Product updated.', 'success');
        router.push('/seller/dashboard');
      } else {
        notify(data.message || 'Failed to update product.', 'error');
      }
    } catch {
      notify('Network error — please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !original) return <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Edit Product</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        Fields show your current values as placeholders — leave a field blank to keep it unchanged.
      </p>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={label}>
          Product Name
          <input style={input} placeholder={original.productName} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
        </label>

        <label style={label}>
          Price
          <input style={input} type="number" min="0" step="0.01" placeholder={String(original.price)} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>

        <label style={label}>
          Sale price (leave blank to keep {original.salePrice != null ? `$${original.salePrice}` : 'no discount'})
          <input style={input} type="number" min="0" step="0.01" placeholder={original.salePrice != null ? String(original.salePrice) : 'No current sale price'} value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
        </label>

        <label style={label}>
          Category (current: {original.category})
          <select style={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Keep current — {original.category}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label style={label}>
          Storefront (current: {original.segment === 'dealo-fresh' ? 'Dealo Fresh' : 'Dealo'})
          <select style={input} value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            <option value="">Keep current</option>
            <option value="dealo">Dealo (general marketplace)</option>
            <option value="dealo-fresh">Dealo Fresh</option>
          </select>
        </label>

        <label style={label}>
          Description
          <textarea style={{ ...input, minHeight: 80 }} placeholder={original.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <label style={label}>
          Stock quantity
          <input style={input} type="number" min="0" placeholder={String(original.quantity)} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </label>

        <label style={label}>
          Low-stock alert threshold
          <input style={input} type="number" min="0" placeholder={String(original.lowStockThreshold)} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
        </label>

        <label style={label}>
          Split-payment deposit % (leave blank to keep {original.depositPercentage != null ? `${original.depositPercentage}%` : 'disabled'})
          <input style={input} type="number" min="1" max="99" placeholder={original.depositPercentage != null ? String(original.depositPercentage) : 'Not offered'} value={form.depositPercentage} onChange={(e) => setForm({ ...form, depositPercentage: e.target.value })} />
        </label>

        <div style={label}>
          Accepted payment methods
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={activePaymentMethods.includes(opt.key)} onChange={() => togglePayment(opt.key)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} style={submitBtn}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' };
const input: React.CSSProperties = { padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' };
const submitBtn: React.CSSProperties = { padding: 14, borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' };