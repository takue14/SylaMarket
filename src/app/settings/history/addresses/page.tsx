'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';

interface Address {
  _id: string;
  label: string;
  fullAddress: string;
  contact: string;
  isDefault: boolean;
}

export default function AddressBookPage() {
  const { notify } = useNotification();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({ label: '', fullAddress: '', contact: '', isDefault: false });
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/addresses')
      .then((res) => res.json())
      .then((data) => setAddresses(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.fullAddress.trim() || !form.contact.trim()) {
      notify('Fill in label, address, and contact.', 'error');
      return;
    }
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      notify('Address saved.', 'success');
      setForm({ label: '', fullAddress: '', contact: '', isDefault: false });
      load();
    } else {
      notify('Failed to save address.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>Saved Addresses</h1>

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {addresses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No saved addresses yet.</p>}
          {addresses.map((a) => (
            <div key={a._id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>
                  {a.label} {a.isDefault && <span style={{ fontSize: 10, background: '#5b6cff', color: 'white', padding: '2px 6px', borderRadius: 999, marginLeft: 6 }}>Default</span>}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.fullAddress}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.contact}</div>
              </div>
              <button onClick={() => handleDelete(a._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Add new address</h3>
        <input style={inputStyle} placeholder="Label (e.g. Home, Work)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <input style={inputStyle} placeholder="Full delivery address" value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} />
        <input style={inputStyle} placeholder="Contact number" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: 13 }}>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          Set as default
        </label>
        <button type="submit" style={{ padding: 12, borderRadius: 10, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Save address
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14 };