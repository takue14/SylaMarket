'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';

const FloatingBar = styled.div`
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-base);
  color: var(--text-primary);
  backdrop-filter: blur(12px);
  border-radius: 9999px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 99999;
  width: fit-content;
  max-width: 92vw;

  @media (max-width: 480px) {
    padding: 6px 12px;
    gap: 18px;
  }
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-primary);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #60a5fa;
    transform: scale(1.1);
  }

  svg {
    width: 24px;
    height: 24px;
    margin-bottom: 2px;
  }
`;

export default function BottomFloatingMenu() {
  const router = useRouter();

  return (
    <FloatingBar>
      <MenuItem onClick={() => router.push('/')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10m14-10v10" />
        </svg>
        Shop
      </MenuItem>

      <MenuItem onClick={() => router.push('/cart')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Cart
      </MenuItem>

      <MenuItem onClick={() => router.push('/customer/dashboard')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7" />
        </svg>
        Profile
      </MenuItem>

      <MenuItem onClick={() => window.dispatchEvent(new CustomEvent('toggleFilter'))}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z" />
        </svg>
        Filter
      </MenuItem>
    </FloatingBar>
  );
}