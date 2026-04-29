// src/components/SellerLogin.tsx (fixed: escape entity)
'use client';

import { useState } from 'react';
import styles from '@/styles/SellerLogin.module.css';
import styled from 'styled-components';

interface SellerLoginProps {
  onLoginSuccess: () => void;
}

interface FormData {
  contact: string;
  password: string;
}

export default function SellerLogin({ onLoginSuccess }: SellerLoginProps) {
  const [formData, setFormData] = useState<FormData>({ contact: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sellers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('sellerId', data.sellerId);
        onLoginSuccess();  // Triggers redirect to dashboard
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  return (


    <StyledWrapper>
      <form className="form" onSubmit={handleSubmit}>
        <p className="form-title">Sign in to your account</p>
        <div className="input-container">
          <input
            name="contact"
            placeholder="Contact Email/Phone"
            value={formData.contact}
            onChange={handleChange}
            required
          />
          <span>
            <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <div className="input-container">
          <input
            name="password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span>
            <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <button className="submit" type="submit">
          Sign in
        </button>
        <p className="signup-link">
          No account?
          <a
            href="/seller"
            style={{
              background: 'none',
              border: 'none',
              color: '#0070f3',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign up
          </a>
        </p>
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .form {
    background-color: #fff;
    display: block;
    padding: 1rem;
    max-width: 350px;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .form-title {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 600;
    text-align: center;
    color: #000;
  }

  .input-container {
    position: relative;
  }

  .input-container input, .form button {
    outline: none;
    border: 1px solid #e5e7eb;
    margin: 8px 0;
  }

  .input-container input {
    background-color: #fff;
    padding: 1rem;
    padding-right: 3rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    width: 300px;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .input-container span {
    display: grid;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    padding-left: 1rem;
    padding-right: 1rem;
    place-content: center;
  }

  .input-container span svg {
    color: #9CA3AF;
    width: 1rem;
    height: 1rem;
  }

  .submit {
    display: block;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    background-color: #4F46E5;
    color: #ffffff;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    width: 100%;
    border-radius: 0.5rem;
    text-transform: uppercase;
  }

  .signup-link {
    color: #6B7280;
    font-size: 0.875rem;
    line-height: 1.25rem;
    text-align: center;
  }

  .signup-link a {
    text-decoration: underline;
  }`;
