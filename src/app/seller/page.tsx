'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StyledForm } from '@/components/AuthFormStyled';

export default function SellerRegister() {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/sellers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, businessName, contact, password }),
    });

    if (res.ok) {
      alert('Seller account created successfully!');
      router.push('/seller/login');
    } else {
      setError('Registration failed. Try again.');
    }
  };

  return (
    <StyledForm>
      <form className="form" onSubmit={handleRegister}>
        <div className="flex-column">
          <label>Full Name </label>
        </div>
        <div className="inputForm">
          <input
            type="text"
            className="input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex-column">
          <label>Business Name </label>
        </div>
        <div className="inputForm">
          <input
            type="text"
            className="input"
            placeholder="Enter your business/company name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div className="flex-column">
          <label>Contact (Email/Phone) </label>
        </div>
        <div className="inputForm">
          <input
            type="text"
            className="input"
            placeholder="Enter your email or phone"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />
        </div>

        <div className="flex-column">
          <label>Password </label>
        </div>
        <div className="inputForm">
          <input
            type="password"
            className="input"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="button-submit">Register as Seller</button>

        <p className="p">
          Don&apos;t have an account? <span className="span" onClick={() => router.push('/seller/login')}>Sign In</span>
        </p>
      </form>
    </StyledForm>
  );
}