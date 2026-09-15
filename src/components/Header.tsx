'use client';

import { useState, useRef } from 'react';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, usePathname } from 'next/navigation';
import SegmentTabs from './SegmentTabs';
import NotificationPanel from './NotificationPanel';

import {
  FaUser,
  FaBlog,
  FaStore,
  FaTruck,
  FaUserShield,
  FaCoins,
  FaSignOutAlt,
  FaShoppingBag,
  FaBars,
  FaTimes,
  FaSun,
  FaSign,
  FaUserLock,
} from 'react-icons/fa';

import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { useCart } from '@/context/CartContext';
import styled from 'styled-components';
import styles from '@/styles/Header.module.css';

// FIX 1: Removed duplicate/conflicting `import router, { Router } from 'next/router'`

const StyledFilterButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  cursor: pointer;
  box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.021);
  transition: all 0.3s;
  background: var(--bg-card);

  svg {
    height: 20px;
    fill: var(--text-muted);
    transition: all 0.3s;
  }

  &:hover {
    box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.11);
    background-color: var(--bg-card-deep);
  }

  &:hover svg {
    fill: var(--text-primary);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled.div<{ open: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 70px;
    right: ${({ open }) => (open ? '10px' : '-300px')};
    width: 240px;
    background-color: var(--bg-card);
    border-radius: 16px;
    padding: 12px;
    z-index: 999;
    transition: 0.4s ease;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .menuButton {
    font-size: 15px;
    background-color: transparent;
    border: none;
    padding: 12px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    border-radius: 10px;
    transition: 0.3s;
    text-decoration: none;
    position: relative;
  }

  .menuButton:hover {
    background-color: var(--bg-card-deep);
    color: var(--accent);
    transform: translateX(5px);
  }

  .menuButton svg {
    font-size: 18px;
    min-width: 18px;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 8px 0;
  }
`;

const HamburgerButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 24px;
    color: var(--text-primary);
    z-index: 1000;
  }
`;

/* ── Theme overlay ── */
const ThemeOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(12px);
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThemeCardWrapper = styled.div`
  .phone {
    position: relative;
    z-index: 2;
    width: 18rem;
    height: 17rem;
    background-color: #e8e8e8;
    transition: background-color 0.6s;
    box-shadow: 0 4px 35px rgba(0, 0, 0, 0.1);
    border-radius: 40px;
    display: flex;
    flex-direction: column;
  }

  .menu {
    font-size: 80%;
    opacity: 0.4;
    padding: 0.8rem 1.8rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .icons { display: flex; margin-top: 0.5rem; }

  .battery {
    width: 0.85rem;
    height: 0.45rem;
    background-color: black;
  }

  .network {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 6.8px 7.2px 6.8px;
    border-color: transparent transparent black transparent;
    transform: rotate(135deg);
    margin: 0.12rem 0.5rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    margin: auto;
    text-align: center;
    width: 70%;
    transform: translateY(5%);
  }

  .circle {
    position: relative;
    border-radius: 100%;
    width: 8rem;
    height: 8rem;
    background: linear-gradient(40deg, #ff0080, #ff8c00, #e8e8e8, #8983f7, #a3dafb 80%);
    background-size: 400%;
    transition: background-position 0.6s;
    margin: auto;
  }

  .crescent {
    position: absolute;
    border-radius: 100%;
    right: 0;
    width: 6rem;
    height: 6rem;
    background: #e8e8e8;
    transform: scale(0);
    transform-origin: top right;
    transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1), background-color 0.6s;
  }

  label, .toggle { height: 2.8rem; border-radius: 100px; }

  label {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 100px;
    position: relative;
    margin: 1.8rem 0 0 0;
    cursor: pointer;
  }

  .toggle {
    position: absolute;
    width: 50%;
    background-color: #fff;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .names {
    font-size: 90%;
    font-weight: bolder;
    color: black;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 0.6rem;
    user-select: none;
    pointer-events: none;
  }

  .names p {
    margin: 0;
    flex: 1;
    text-align: center;
  }

  .dark  { opacity: 0.5; }
  .time  { color: black; }

  [type="checkbox"] { display: none; }

  [type="checkbox"]:checked + .app .toggle {
    transform: translateX(100%);
    background-color: #34323d;
  }

  [type="checkbox"]:checked + .app .dark  { opacity: 1; color: white; }
  [type="checkbox"]:checked + .app .light { opacity: 0.5; color: white; }

  [type="checkbox"]:checked + .app .phone {
    background-color: #26242e;
    color: white;
  }

  [type="checkbox"]:checked + .app .crescent {
    transform: scale(1);
    background: #26242e;
  }

  [type="checkbox"]:checked + .app .circle    { background-position: 100% 100%; }
  [type="checkbox"]:checked + .app .body      { border-radius: 40px; }

  [type="checkbox"]:checked + .app .body .phone .menu .time { color: white; }

  [type="checkbox"]:checked + .app .body .phone .menu .icons .network {
    border-color: transparent transparent white transparent;
  }

  [type="checkbox"]:checked + .app .body .phone .menu .icons .battery {
    background-color: white;
  }
`;

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty('--header-height', `${headerRef.current.offsetHeight}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [isLoggedIn]); // re-measure when the segment tabs appear/disappear, since that changes header height

  
    useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setIsLoggedIn(!!data.authenticated))
      .catch(() => setIsLoggedIn(false));
  }, []);


  const { theme, toggleTheme } = useTheme();
  const { cart } = useCart();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isDark = theme === 'dark';

  const toggleFilter = () => {
    window.dispatchEvent(new CustomEvent('toggleFilter'));
  };

  const router = useRouter();
    const pathname = usePathname();

  function currentDashboardRole(): 'customer' | 'seller' | 'delivery' | null {
    if (pathname.startsWith('/seller')) return 'seller';
    if (pathname.startsWith('/delivery')) return 'delivery';
    if (pathname.startsWith('/customer')) return 'customer';
    return null; // on a shared/public page — logout button here defaults to buyer, since that's the primary browsing identity
  }

  // FIX 2: Changed NodeJS.Timeout to ReturnType<typeof setTimeout> for browser compatibility
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    timer.current = setTimeout(() => {
      router.push('/admin');
    }, 3000);
  };
  const handleRoleNav = async (target: 'seller' | 'delivery') => {
    setIsMenuOpen(false);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      const alreadyLoggedIn = Array.isArray(data.roles) && data.roles.includes(target);

      if (alreadyLoggedIn) {
        router.push(target === 'seller' ? '/seller/dashboard' : '/delivery/dashboard');
      } else {
        router.push(`/auth?role=${target}&mode=signin`);
      }
    } catch {
      // If the check fails for any reason, fall back to the safe default
      router.push(`/auth?role=${target}&mode=signin`);
    }
  };
  const endPress = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // FIX 3: return is now INSIDE the function (was outside due to misplaced `};`)
  return (
    <>
      <header
        className={styles.header}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 30px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          className={styles.logo}
          style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px', color: 'var(--text-primary)' }}
        >
          <img
            src={theme === 'dark' ? '/dealoshortwhite.png' : '/dealoshortblack.png'}
            width={40}
            height={40}
            alt="Dealo Logo"  // FIX 4: was "Syla Logo", corrected to match actual brand
          />
        </div>

        {/* SEGMENT TABS — always visible, independent of the collapsible mobile nav */}
        
          <div className={styles.segmentRow}>
            <SegmentTabs />
          </div>
        

        {/* DESKTOP NAVIGATION */}
        <nav
          className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}
          style={{ display: 'flex', gap: '28px', fontWeight: '700', fontSize: '1.05rem', fontFamily: '"Stack Sans Notch", sans-serif', fontOpticalSizing: 'auto', fontStyle: 'normal' }}
        >
        </nav>
          
        

        {/* RIGHT ICONS */}
                <div className={styles.icons} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationPanel asRole="buyer" />
          <Link href="/auth"><FaUserLock size={20} /></Link>
          <Link href="/cart" style={{ marginTop: '-5px' }}><NotificationBell itemCount={cartCount} /></Link>

          <StyledFilterButton onClick={toggleFilter} title="Filter / Settings">
            <svg viewBox="0 0 512 512" height="22" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z" />
            </svg>
          </StyledFilterButton>

          {/* FIX 5: aria-label added to HamburgerButton for accessibility */}
          <HamburgerButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </HamburgerButton>
        </div>
      </header>

      {/* MOBILE MENU */}
      <MobileMenu open={isMenuOpen}>
        <Link href="/" className="menuButton" onClick={() => setIsMenuOpen(false)}><FaShoppingBag />Shop</Link>
        
                 <button className="menuButton" onClick={() => handleRoleNav('seller')}>
          <FaStore />Seller
        </button>
        <button className="menuButton" onClick={() => handleRoleNav('delivery')}>
          <FaTruck />Delivery
        </button>

        {/* FIX 6: Replaced invalid <Link href=""> with a <button> for the Admin long-press action */}
        {/*<button
          className="menuButton"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
        >
          <FaUserShield />Admin
        </button>*/}

        <Link href="/credits" className="menuButton" onClick={() => setIsMenuOpen(false)}><FaCoins />Credits</Link>
               
               
                <Link href="/wishlist" className="menuButton" onClick={() => setIsMenuOpen(false)}>
          ♥ Wishlist
        </Link>
        <Link href="/settings/history" className="menuButton" onClick={() => setIsMenuOpen(false)}>
           👁️‍🗨️ View History
        </Link>

        
        <div className="divider" />

        {/* Theme replaces Settings */}
        <div
          className="menuButton"
          onClick={() => { setIsMenuOpen(false); setShowTheme(true); }}
        >
          <FaSun />
          Theme
        </div>

                <button
          className="menuButton"
          onClick={async () => {
            setIsMenuOpen(false);
            const activeRole = currentDashboardRole() ?? 'customer';
            const roleToApiRole: Record<string, string> = { customer: 'customer', seller: 'seller', delivery: 'delivery' };
            const roleToStorageKey: Record<string, string> = {
              customer: 'customerId',
              seller: 'sellerId',
              delivery: 'deliveryGuyId',
            };
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: roleToApiRole[activeRole] }),
            });
            localStorage.removeItem(roleToStorageKey[activeRole]);
            window.location.href = '/';
          }}
        >
          <FaSignOutAlt />Logout ({currentDashboardRole() ?? 'buyer'})
        </button>
      </MobileMenu>

      {/* MOBILE RESPONSIVE CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .${styles.nav}    { display: none !important; }
          .${styles.header} { padding: 14px 18px !important; }
          .${styles.icons}  { gap: 14px !important; }
          .${styles.logo} img { width: 34px; height: 34px; }
        }
      `}</style>

      {/* ── Theme overlay ── */}
      {showTheme && (
        // FIX 7: Added onKeyDown for keyboard accessibility on the overlay
        <ThemeOverlay
          onClick={() => setShowTheme(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowTheme(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Theme selector"
          tabIndex={-1}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ThemeCardWrapper>
              <div>
                <input
                  key={String(isDark)}
                  id="header-theme-switch"
                  type="checkbox"
                  defaultChecked={isDark}
                  onChange={toggleTheme}
                />
                <div className="app">
                  <div className="body">
                    <div className="phone">
                      <div className="menu" />
                      <div className="content">
                        <div className="circle">
                          <div className="crescent" />
                        </div>
                        <label htmlFor="header-theme-switch">
                          <div className="toggle" />
                          <div className="names">
                            <p className="light">Light</p>
                            <p className="dark">Dark</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ThemeCardWrapper>
          </div>
        </ThemeOverlay>
      )}
    </>
  );
}