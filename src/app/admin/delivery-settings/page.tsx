'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';

export default function DeliverySettingsPage() {
  const { notify } = useNotification();
  const [f, setF] = useState({ baseFee: '1', ratePerKm: '0.5', valuePctDisplay: '3', valueCap: '3', rankingMode: 'blended', feeWeight: '0.6' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/delivery-settings')
      .then((r) => r.json())
      .then((s) =>
        setF({
          baseFee: String(s.baseFee),
          ratePerKm: String(s.ratePerKm),
          valuePctDisplay: String(Math.round(s.valuePct * 10000) / 100),
          valueCap: String(s.valueCap),
          rankingMode: s.rankingMode,
          feeWeight: String(s.feeWeight),
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/delivery-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseFee: parseFloat(f.baseFee),
        ratePerKm: parseFloat(f.ratePerKm),
        valuePct: parseFloat(f.valuePctDisplay) / 100,
        valueCap: parseFloat(f.valueCap),
        rankingMode: f.rankingMode,
        feeWeight: parseFloat(f.feeWeight),
      }),
    });
    const data = await res.json().catch(() => ({}));
    notify(data.message || (res.ok ? 'Saved.' : 'Failed to save.'), res.ok ? 'success' : 'error');
    setSaving(false);
  };

  if (loading) return <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</p>;

  const row = (label: string, key: keyof typeof f, hint?: string) => (
    <label style={lbl}>
      {label}
      <input style={inp} type="number" step="any" value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
      {hint && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>{hint}</span>}
    </label>
  );

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)' }}>Driver Fee &amp; Ranking</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Fee = base + distance × rate + min(order value × %, cap). Changes affect new quotes immediately; fees already
        locked on claimed orders don&apos;t change.
      </p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {row('Base fee ($)', 'baseFee')}
        {row('Rate per km ($)', 'ratePerKm')}
        {row('Order value share (%)', 'valuePctDisplay')}
        {row('Order value share cap ($)', 'valueCap')}
        <label style={lbl}>
          Ranking rule
          <select style={inp} value={f.rankingMode} onChange={(e) => setF({ ...f, rankingMode: e.target.value })}>
            <option value="fee">Highest fee first</option>
            <option value="efficiency">Best fee per km</option>
            <option value="blended">Blended (fee vs closeness)</option>
          </select>
        </label>
        {f.rankingMode === 'blended' && row('Fee weight (0–1)', 'feeWeight', '1 = only fee matters, 0 = only closeness matters')}
        <button type="submit" disabled={saving} style={btn}>{saving ? 'Saving…' : 'Save settings'}</button>
      </form>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' };
const inp: React.CSSProperties = { padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' };
const btn: React.CSSProperties = { padding: 14, borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer' };