'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@/context/NotificationContext';

interface Row {
  driverId: string;
  weekStart: string;
  driverName: string;
  driverContact: string;
  deliveries: number;
  unpaidCount: number;
  total: number;
  unpaid: number;
}

interface Detail {
  _id: string;
  order: string;
  fee: number;
  distanceKm: number | null;
  orderValue: number;
  deliveredAt: string;
  status: string;
  flagReason?: string | null;
}

const keyOf = (r: Row) => `${r.driverId}|${r.weekStart}`;
const fmtWeek = (iso: string) => {
  const start = new Date(iso);
  const end = new Date(start.getTime() + 6 * 86400000);
  const f = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${f(start)} – ${f(end)}`;
};

export default function DriverPayoutsPage() {
  const { notify } = useNotification();
  const [rows, setRows] = useState<Row[]>([]);
  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [details, setDetails] = useState<Detail[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/driver-payouts${onlyUnpaid ? '?onlyUnpaid=1' : ''}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [onlyUnpaid]);

  useEffect(load, [load]);

  const toggleDetails = async (r: Row) => {
    if (openKey === keyOf(r)) return setOpenKey(null);
    const res = await fetch(`/api/admin/driver-payouts?driverId=${r.driverId}&weekStart=${encodeURIComponent(r.weekStart)}`);
    setDetails(res.ok ? await res.json() : []);
    setOpenKey(keyOf(r));
  };

    const markPaid = async (r: Row) => {
    const paymentReference = prompt(`Enter the payment reference for ${r.driverName}'s $${r.unpaid.toFixed(2)} payout:`);
    if (!paymentReference?.trim()) return;
    const res = await fetch('/api/admin/driver-payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: r.driverId, weekStart: r.weekStart, paymentReference }),
    });
    const data = await res.json().catch(() => ({}));
    notify(data.message || 'Failed.', res.ok ? 'success' : 'error');
    if (res.ok) load();
  };

  const totalOwed = rows.reduce((s, r) => s + r.unpaid, 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Driver Payouts</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Weeks run Monday–Sunday (UTC). Pay drivers outside the app, then mark the week as paid here.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Total unpaid shown: ${totalOwed.toFixed(2)}</strong>
        <label style={{ color: 'var(--text-primary)', fontSize: 13 }}>
          <input type="checkbox" checked={onlyUnpaid} onChange={(e) => setOnlyUnpaid(e.target.checked)} /> Only unpaid
        </label>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No earnings to show.</p>
      ) : (
        rows.map((r) => (
          <div key={keyOf(r)} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{r.driverName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.driverContact}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {fmtWeek(r.weekStart)} · {r.deliveries} deliveries
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: r.unpaid > 0 ? '#f59e0b' : '#10b981', fontWeight: 800, fontSize: 18 }}>
                  ${r.unpaid.toFixed(2)} {r.unpaid > 0 ? 'owed' : 'paid'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Week total ${r.total.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => toggleDetails(r)} style={ghost}>
                {openKey === keyOf(r) ? 'Hide deliveries' : 'View deliveries'}
              </button>
              {r.unpaid > 0 && (
                <button onClick={() => markPaid(r)} style={primary}>
                  Mark paid
                </button>
              )}
            </div>

            {openKey === keyOf(r) && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                              {details.map((d) => (
                  <div key={d._id} style={{ padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-primary)' }}>
                      <span>
                        #{d.order.slice(-6)} · {new Date(d.deliveredAt).toLocaleString()} ·{' '}
                        {d.distanceKm != null ? `${d.distanceKm.toFixed(1)} km` : 'distance n/a'}
                      </span>
                      <span>
                        ${d.fee.toFixed(2)} {d.status === 'paid' ? '✓' : ''}
                      </span>
                    </div>
                    {d.flagReason && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>⚠ Flagged: {d.flagReason}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const ghost: React.CSSProperties = { padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12.5, cursor: 'pointer' };
const primary: React.CSSProperties = { padding: '8px 14px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' };