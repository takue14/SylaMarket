'use client';

const COUNTRIES = ['Zimbabwe', 'South Africa', 'Zambia', 'Botswana', 'Mozambique'];

export default function CountryPicker({ onSelect }: { onSelect: (country: string) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: 20,
          padding: '28px 24px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Where are you shopping from?</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          We couldn't detect your location automatically. Select your country to see products near you.
        </p>
        <select
          onChange={(e) => e.target.value && onSelect(e.target.value)}
          defaultValue=""
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            fontSize: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-input, var(--bg-base))',
            color: 'var(--text-primary)',
          }}
        >
          <option value="" disabled>
            Select country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}