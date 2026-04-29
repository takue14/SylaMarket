'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';

export default function DeliveryLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <StyledWrapper>
      {/* Rotating Cube */}
      <div className="cube-container">
        <div className="spinner">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>

      <div className="form-container">
        <div className="logo-container">Delivery Guy Login</div>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="form-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="signup-link">
          Don&apos;t have an account?
          <a href="/delivery/register" className="signup-link link"> Register here</a>
        </p>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f8f9fa;

  /* Rotating Cube */
  .cube-container {
    margin-bottom: 40px;
  }

  .spinner {
    width: 60px;
    height: 60px;
    animation: spinner-y0fdc1 2s infinite ease;
    transform-style: preserve-3d;
  }

  .spinner > div {
    background-color: rgba(0, 77, 255, 0.2);
    height: 100%;
    position: absolute;
    width: 100%;
    border: 3px solid #004dff;
  }

  .spinner div:nth-of-type(1) { transform: translateZ(-30px) rotateY(180deg); }
  .spinner div:nth-of-type(2) { transform: rotateY(-270deg) translateX(50%); transform-origin: top right; }
  .spinner div:nth-of-type(3) { transform: rotateY(270deg) translateX(-50%); transform-origin: center left; }
  .spinner div:nth-of-type(4) { transform: rotateX(90deg) translateY(-50%); transform-origin: top center; }
  .spinner div:nth-of-type(5) { transform: rotateX(-90deg) translateY(50%); transform-origin: bottom center; }
  .spinner div:nth-of-type(6) { transform: translateZ(30px); }

  @keyframes spinner-y0fdc1 {
    0%   { transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
    50%  { transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
    100% { transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
  }

  /* Original Form Styles */
  .form-container {
    max-width: 400px;
    width: 100%;
    background-color: #fff;
    padding: 32px 24px;
    font-size: 14px;
    font-family: inherit;
    color: #212121;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    border-radius: 10px;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.084),
      0px 2px 3px rgba(0, 0, 0, 0.168);
  }

  .form-container button:active {
    scale: 0.95;
  }

  .logo-container {
    text-align: center;
    font-weight: 600;
    font-size: 18px;
  }

  .form {
    display: flex;
    flex-direction: column;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .form-group label {
    margin-bottom: 5px;
  }

  .form-group input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: inherit;
    border: 1px solid #ccc;
  }

  .form-group input::placeholder {
    opacity: 0.5;
  }

  .form-group input:focus {
    outline: none;
    border-color: #1778f2;
  }

  .form-submit-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: inherit;
    color: #fff;
    background-color: #212121;
    border: none;
    width: 100%;
    padding: 12px 16px;
    font-size: inherit;
    gap: 8px;
    margin: 12px 0;
    cursor: pointer;
    border-radius: 6px;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.084),
      0px 2px 3px rgba(0, 0, 0, 0.168);
  }

  .form-submit-btn:hover {
    background-color: #313131;
  }

  .link {
    color: #1778f2;
    text-decoration: none;
  }

  .signup-link {
    align-self: center;
    font-weight: 500;
  }

  .signup-link .link {
    font-weight: 400;
  }

  .link:hover {
    text-decoration: underline;
  }
`;