// src/components/SellerRegister.tsx (updated: added proper prop typing and event types)
'use client';

import { useState } from 'react';
import styles from '@/styles/SellerLogin.module.css'; // Reuse similar styles
import styled from 'styled-components';

interface SellerRegisterProps {
  onRegisterSuccess: () => void;
}

interface FormData {
  name: string;
  businessName: string;
  contact: string;
  password: string;
}

export default function SellerRegister({ onRegisterSuccess }: SellerRegisterProps) {
  const [formData, setFormData] = useState<FormData>({ 
    name: '', 
    businessName: '', 
    contact: '', 
    password: '' 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sellers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        onRegisterSuccess();  // Triggers switch to login
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  return (
 

<StyledWrapper>
      <form className="form">
        <p className="form-title">Seller Register</p>
        <div className="input-container">
          <input 
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required />
        </div>


        <div className="input-container">
          <input name="businessName"
          placeholder="Business Name"
          value={formData.businessName}
          onChange={handleChange}
          required />
          

          <input
          name="contact"
          placeholder="Contact Email/Phone"
          value={formData.contact}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />


        </div>
        <button className="submit" type="submit">
          Sign in
        </button>
        <p className="signup-link">
          Already Registered?
          <a onClick={() => window.location.href = '/seller'} style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', textDecoration: 'underline' }}>LogIn</a>
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