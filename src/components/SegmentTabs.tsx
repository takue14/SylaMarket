'use client';

import { usePathname, useRouter } from 'next/navigation';
import styled from 'styled-components';

const SEGMENTS = [
  { key: 'dealo', label: 'Dealo', href: '/' },
  { key: 'fresh', label: 'Fresh', href: '/fresh' },
  { key: 'ac', label: 'Acad', href: '/ac' },
] as const;

export default function SegmentTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = SEGMENTS.findIndex((s) =>
    s.href === '/' ? pathname === '/' : pathname.startsWith(s.href)
  );
  const resolvedIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <StyledWrapper>
      <div className="tabs">
        {SEGMENTS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`tab${resolvedIndex === i ? ' active' : ''}`}
            onClick={() => router.push(s.href)}
          >
            {s.label}
          </button>
        ))}
        <span className="glider" style={{ transform: `translateX(${resolvedIndex * 100}%)` }} />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .tabs {
    display: flex;
    position: relative;
    background-color: var(--bg-card, #fff);
    box-shadow: 0 0 1px 0 rgba(24, 94, 224, 0.15), 0 6px 12px 0 rgba(24, 94, 224, 0.15);
    padding: 0.5rem;
    border-radius: 99px;
  }
  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    width: 60px;
    font-size: 0.8rem;
    color: var(--text-primary, #111);
    font-weight: 500;
    border-radius: 99px;
    cursor: pointer;
    background: transparent;
    border: none;
    z-index: 2;
    transition: color 0.15s ease-in;
  }
  .tab.active {
    color: #185ee0;
  }
  .glider {
    position: absolute;
    display: flex;
    height: 30px;
    width: 60px;
    background-color: #e6eef9;
    z-index: 1;
    border-radius: 99px;
    transition: 0.25s ease-out;
  }
  @media (max-width: 700px) {
    .tabs {
      transform: scale(0.85);
    }
  }
`;