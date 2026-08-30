'use client';

import styled from 'styled-components';
import { usePathname, useRouter } from 'next/navigation';

import {
  FaHome,
  FaShoppingCart,
  FaUser,
  FaSearch,
} from 'react-icons/fa';

/* =========================
   STYLED COMPONENTS
========================= */

const BottomBar = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;

    position: fixed;
    bottom: 18px;
    left: 50%;

    transform: translateX(-50%);

    z-index: 999999;

    --col-orange: #d17842;
    --col-dark: #0c0f14;
    --col-darkGray: #52555a;

    width: fit-content;

    align-items: center;
    justify-content: space-evenly;

    background-color: var(--col-dark);

    border-radius: 30px;

    padding: 6px 4px;

    box-shadow: 0 8px 30px rgba(0,0,0,0.35);

    backdrop-filter: blur(10px);

    border: 1px solid rgba(255,255,255,0.05);
  }
`;

const MenuLabel = styled.button<{ active?: boolean }>`
  padding: 10px 18px;

  transition: all 200ms;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  cursor: pointer;

  position: relative;

  background: transparent;

  border: none;

  border-radius: 20px;

  svg {
    transition: all 300ms;

    fill: ${props =>
      props.active
        ? 'var(--col-orange)'
        : 'var(--col-darkGray)'};

    width: 20px;
    height: 20px;
  }

  &:hover svg {
    fill: var(--col-orange);

    opacity: 0.9;

    transform: translateY(-2px);
  }

  &.active svg {
    fill: var(--col-orange);

    transform: scale(1.18);
  }

  &::before {
    content: '';

    display: block;

    width: ${props =>
      props.active ? '70%' : '0%'};

    height: 2px;

    border-radius: 5px;

    position: absolute;

    left: ${props =>
      props.active ? '15%' : '50%'};

    bottom: 2px;

    background: var(--col-orange);

    transition: all 200ms;
  }

  &:active {
    transform: scale(0.94);
  }
`;

/* =========================
   COMPONENT
========================= */

export default function MobileBottomBar() {

  const pathname = usePathname();

  const router = useRouter();

  return (

    <BottomBar>

      {/* HOME */}

      <MenuLabel
        active={pathname === '/'}
        className={
          pathname === '/'
            ? 'active'
            : ''
        }
        onClick={() => router.push('/')}
      >
        <FaHome />
      </MenuLabel>

      {/* CART */}

      <MenuLabel
        active={pathname === '/cart'}
        className={
          pathname === '/cart'
            ? 'active'
            : ''
        }
        onClick={() => router.push('/cart')}
      >
        <FaShoppingCart />
      </MenuLabel>

      {/* PROFILE */}

      <MenuLabel
        active={pathname.includes('/customer')}
        className={
          pathname.includes('/customer')
            ? 'active'
            : ''
        }
        onClick={() =>
          router.push('/customer/dashboard')
        }
      >
        <FaUser />
      </MenuLabel>

      {/* SEARCH / FILTER */}

      <MenuLabel
        active={false}
        onClick={() =>
          window.dispatchEvent(
            new Event('toggleFilter')
          )
        }
      >
        <FaSearch />
      </MenuLabel>

    </BottomBar>
  );
}