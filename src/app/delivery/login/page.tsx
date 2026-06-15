'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

export default function DeliveryLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/delivery/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('deliveryGuyId', data.deliveryGuyId);
        router.push('/delivery/dashboard');
      } else {
        setError(data.message || 'Invalid phone number or password');
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Cannot connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const eyeOpen = (
    <>
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  );
  const eyeClosed = (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>
  );

  return (
    <StyledWrapper>
      <div className="page">

        {/* LEFT: deco panel — video lives here */}
        <div className="deco-panel">
          <div className="deco-grid" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <div className="panel-video-wrap">
            <video autoPlay muted loop playsInline className="panel-video">
              <source src="/vids.mp4" type="video/mp4" />
            </video>
            <div className="panel-video-fade" />
          </div>

          <div className="deco-label">
            <p className="tagline">Deliver faster.<br />Earn more.</p>
            <p className="sub">Dealo delivery network</p>
          </div>
        </div>

        {/* RIGHT: form panel */}
        <div className="form-panel">
          <div className="card">

            <div className="cube-container">
              <div className="spinner">
                <div /><div /><div /><div /><div /><div />
              </div>
            </div>

            <h1 className="heading">Delivery Login</h1>
            <p className="sub-heading">Sign in to your delivery account</p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrap">
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="field-icon">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="field-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <button
                    type="button"
                    className="toggle-pw"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? eyeClosed : eyeOpen}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="forgot-row">
                <a href="/forgot-password">Forgot password?</a>
              </div>

              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="signup-row">
              Don&apos;t have an account?{' '}
              <a href="/delivery/register">Register here</a>
            </p>
          </div>
        </div>

      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  --bg:           #09090f;
  --purple:       #7c3aed;
  --purple-dark:  #5b21b6;
  --purple-glow:  rgba(124,58,237,0.35);
  --purple-soft:  rgba(124,58,237,0.10);
  --border:       rgba(255,255,255,0.10);
  --border-focus: rgba(124,58,237,0.75);
  --text:         #f0f0f5;
  --muted:        rgba(240,240,245,0.45);
  --input-bg:     rgba(255,255,255,0.06);
  --radius:       14px;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;

  /* ── PAGE GRID ── */
  .page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* ── LEFT: DECO PANEL ── */
  .deco-panel {
    position: relative;
    overflow: hidden;
    background: #0d0d18;
    display: flex;
    flex-direction: column;
  }

  .deco-grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(124,58,237,0.18) 1px, transparent 1px);
    background-size: 28px 28px;
    animation: gridDrift 30s linear infinite;
    z-index: 0;
  }

  @keyframes gridDrift {
    0%   { background-position: 0 0; }
    100% { background-position: 28px 28px; }
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .orb-1 { width: 380px; height: 380px; background: rgba(124,58,237,0.20); top: -60px; left: -80px; }
  .orb-2 { width: 280px; height: 280px; background: rgba(167,139,250,0.13); bottom: 60px; right: -40px; }
  .orb-3 { width: 200px; height: 200px; background: rgba(0,0,0,0.40); top: 50%; left: 50%; transform: translate(-50%,-50%); }

  /* ── VIDEO inside deco panel ── */
  .panel-video-wrap {
    position: relative;
    width: 100%;
    height: 65%;
    flex-shrink: 0;
    z-index: 1;
  }

  .panel-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    display: block;
  }

  .panel-video-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 45%,
      rgba(13,13,24,0.75) 72%,
      #0d0d18 100%
    );
    pointer-events: none;
  }

  .deco-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent 55%, var(--bg) 100%);
    z-index: 2;
    pointer-events: none;
  }

  /* Title sits below video in the faded area */
  .deco-label {
    position: relative;
    z-index: 3;
    padding: 24px 44px 0;
    margin-top: -48px;
  }

  .tagline {
    font-size: clamp(1.6rem, 2.4vw, 2.4rem);
    font-weight: 800;
    line-height: 1.15;
    color: #fff;
    letter-spacing: -0.03em;
  }

  .sub {
    margin-top: 10px;
    font-size: 0.82rem;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── RIGHT: FORM PANEL ── */
  .form-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 48px 40px;
    position: relative;
  }

  .form-panel::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .card { width: 100%; max-width: 400px; position: relative; z-index: 1; }

  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }

  .brand-dot {
    width: 32px; height: 32px;
    background: var(--purple);
    border-radius: 8px;
    display: grid; place-items: center;
    font-size: 15px; font-weight: 800; color: #fff;
  }

  .brand-name { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }

  /* ── ROTATING CUBE ── */
  .cube-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: -28px;
    margin-bottom: 0;
  }

  .spinner {
    width: 52px; height: 52px;
    animation: spinner-y0fdc1 2s infinite ease;
    transform-style: preserve-3d;
  }

  .spinner > div {
    background-color: rgba(124,58,237,0.18);
    height: 100%; position: absolute; width: 100%;
    border: 2.5px solid var(--purple);
  }

  .spinner div:nth-of-type(1) { transform: translateZ(-26px) rotateY(180deg); }
  .spinner div:nth-of-type(2) { transform: rotateY(-270deg) translateX(50%); transform-origin: top right; }
  .spinner div:nth-of-type(3) { transform: rotateY(270deg) translateX(-50%); transform-origin: center left; }
  .spinner div:nth-of-type(4) { transform: rotateX(90deg) translateY(-50%); transform-origin: top center; }
  .spinner div:nth-of-type(5) { transform: rotateX(-90deg) translateY(50%); transform-origin: bottom center; }
  .spinner div:nth-of-type(6) { transform: translateZ(26px); }

  @keyframes spinner-y0fdc1 {
    0%   { transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
    50%  { transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
    100% { transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
  }

  /* ── HEADING ── */
  .heading {
    font-size: clamp(1.8rem, 3vw, 2.2rem);
    font-weight: 800; line-height: 1.1;
    letter-spacing: -0.03em;
    margin-top: 32px;
    margin-bottom: 10px;
  }

  .sub-heading { font-size: 0.9rem; color: var(--muted); margin-bottom: 28px; }

  .error-msg {
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.35);
    border-radius: 10px; padding: 10px 14px;
    font-size: 0.85rem; color: #c4b5fd; margin-bottom: 16px;
  }

  .field { margin-bottom: 14px; }

  .field label {
    display: block; font-size: 0.76rem; font-weight: 500;
    letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 7px;
  }

  .input-wrap { position: relative; }

  .field-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    width: 15px; height: 15px; stroke: var(--muted); fill: none;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
    pointer-events: none; transition: stroke 0.2s;
  }

  .input-wrap input {
    width: 100%; padding: 13px 14px 13px 42px;
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text);
    font-family: inherit; font-size: 0.95rem; outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .input-wrap input::placeholder { color: var(--muted); }

  .input-wrap input:focus {
    border-color: var(--border-focus);
    background: var(--purple-soft);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
  }

  .input-wrap:focus-within .field-icon { stroke: var(--purple); }

  .toggle-pw {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--muted); padding: 0; display: flex;
    align-items: center; transition: color 0.2s; z-index: 2;
  }
  .toggle-pw:hover { color: var(--text); }

  .forgot-row { display: flex; justify-content: flex-end; margin: -4px 0 20px; }
  .forgot-row a { font-size: 0.8rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
  .forgot-row a:hover { color: var(--purple); }

  .btn-submit {
    width: 100%; padding: 14px;
    background: var(--purple); color: #fff;
    border: none; border-radius: var(--radius);
    font-family: inherit; font-size: 0.95rem;
    font-weight: 600; letter-spacing: 0.01em;
    cursor: pointer; margin-top: 8px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px var(--purple-glow);
  }

  .btn-submit:hover:not(:disabled) { background: var(--purple-dark); box-shadow: 0 6px 28px var(--purple-glow); }
  .btn-submit:active:not(:disabled) { transform: scale(0.98); }
  .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

  .signup-row { text-align: center; font-size: 0.88rem; color: var(--muted); margin-top: 24px; }
  .signup-row a { color: var(--purple); text-decoration: none; font-weight: 600; }
  .signup-row a:hover { text-decoration: underline; }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .page { grid-template-columns: 1fr; }

    .deco-panel { height: auto; }

    .panel-video-wrap { height: clamp(160px, 50vw, 280px); }

    .deco-panel::after {
      background: linear-gradient(to bottom, transparent 30%, var(--bg) 100%);
    }

    .deco-label {
      padding: 16px 20px 20px;
      margin-top: -36px;
    }

    .tagline { font-size: 1.35rem; }
    .form-panel { padding: 28px 20px 48px; }
    .card { max-width: 100%; }
    .cube-container { margin-top: 0; }
  }

  /* ── REDUCED MOTION ── */
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; }
    .deco-grid { animation: none; }
    .btn-submit { transition: none; }
  }
`;