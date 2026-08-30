'use client';

const COUNTRIES = ['Zimbabwe', 'South Africa', 'Zambia', 'Botswana', 'Mozambique']; // extend as needed

export default function CountryPicker({ onSelect }: { onSelect: (country: string) => void }) {
  return (
    <div style={card}>
      <style>{markerStyles}</style>

      <div style={markerHeader}>
        <span className="loader" />
      </div>

      <p style={descriptionText}>
        We couldn't detect your location. Select your country to see products near you.
      </p>

      <select
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        defaultValue=""
        style={select}
      >
        <option value="" disabled>Select country</option>
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

/* ---------- design tokens, matched to the onboarding screens ---------- */

const card: React.CSSProperties = {
  maxWidth: 380,
  padding: '24px 22px',
  background: '#eef0f4',
  borderRadius: 24,
  textAlign: 'center',
  fontFamily: "'Poppins', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  boxShadow: '0 12px 30px rgba(20, 20, 40, 0.06)',
};

const markerHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 6,
  paddingTop: 4,
};

const descriptionText: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: '#8a8ea3',
  marginBottom: 18,
};

const select: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #d9dce6',
  background: '#ffffff',
  fontSize: 14,
  color: '#262a4a',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

/* Animated marker reused exactly from the onboarding loader spec: 48px, red, 0.4s bounce */
const markerStyles = `
  .loader {
    width: 48px;
    height: 48px;
    display: block;
    margin: 20px auto;
    box-sizing: border-box;
    position: relative;
  }
  .loader::after {
    content: '';
    width: 48px;
    height: 48px;
    left: 0;
    bottom: 0;
    position: absolute;
    border-radius: 50% 50% 0;
    border: 15px solid red;
    transform: rotate(45deg) translate(0, 0);
    box-sizing: border-box;
    animation: animMarker 0.4s ease-in-out infinite alternate;
  }
  .loader::before {
    content: '';
    box-sizing: border-box;
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    top: 150%;
    width: 24px;
    height: 4px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.2);
    animation: animShadow 0.4s ease-in-out infinite alternate;
  }
  @keyframes animMarker {
    0% {
      transform: rotate(45deg) translate(5px, 5px);
    }
    100% {
      transform: rotate(45deg) translate(-5px, -5px);
    }
  }
  @keyframes animShadow {
    0% {
      transform: scale(0.5);
    }
    100% {
      transform: scale(1);
    }
  }
`;