'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useNotification } from '@/context/NotificationContext';

export default function BulkUploadPage() {
  const { notify } = useNotification();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ row: number; success: boolean; error?: string }[] | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setPreview(result.data.slice(0, 5) as Record<string, string>[]),
    });
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const res = await fetch('/api/products/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: result.data }),
          });
          const data = await res.json();
          setResults(data.results || []);
          notify(data.message, res.ok ? 'success' : 'error');
        } catch {
          notify('Upload failed.', 'error');
        } finally {
          setUploading(false);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Bulk Upload Products</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        CSV columns: <code>productName, price, category, description, quantity, segment, imageLink</code>. Max 200 rows.
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        style={{ marginBottom: 16 }}
      />

      {preview.length > 0 && (
        <div style={{ marginBottom: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(preview[0]).map((k) => (
                  <th key={k} style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((v, j) => (
                    <td key={j} style={{ padding: 6, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Showing first 5 rows as a preview.</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer' }}
      >
        {uploading ? 'Uploading…' : 'Upload all'}
      </button>

      {results && (
        <div style={{ marginTop: 20 }}>
          {results.map((r) => (
            <div key={r.row} style={{ fontSize: 12, color: r.success ? '#10b981' : '#ef4444', marginBottom: 4 }}>
              Row {r.row}: {r.success ? 'Created' : r.error}
            </div>
          ))}
          <button onClick={() => router.push('/seller/dashboard')} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#5b6cff', color: 'white', cursor: 'pointer' }}>
            Go to dashboard
          </button>
        </div>
      )}
    </div>
  );
}