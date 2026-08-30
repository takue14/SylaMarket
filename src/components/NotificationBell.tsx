'use client';

import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  .notification {
    background: transparent;
    border: none;
    padding: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: 300ms;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification:hover {
    background: rgba(170, 170, 170, 0.1);
  }

  .bell-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bell {
    width: 20px;
    height: 20px;
    display: block;
  }

  .bell svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: #333;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .notification-count {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #e74c3c;
    color: white;
    font-size: 10px;
    font-weight: bold;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .notification:hover .bell-container {
    animation: bell-animation 650ms ease-out;
  }

  @keyframes bell-animation {
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-15deg) scale(1.1); }
    60% { transform: rotate(10deg) scale(1.1); }
    80% { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); }
  }
`;

interface NotificationBellProps {
  itemCount: number;
}

export default function NotificationBell({ itemCount }: NotificationBellProps) {
  return (
    <StyledWrapper>
      <div className="notification">
        <div className="bell-container">
          <div className="bell">
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>
        {itemCount > 0 && (
          <div className="notification-count">{itemCount}</div>
        )}
      </div>
    </StyledWrapper>
  );
}