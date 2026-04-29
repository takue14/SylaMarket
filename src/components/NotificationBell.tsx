'use client';

import React, { useState, useEffect } from 'react';
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
  }

  .bell {
    border: 2.5px solid #333;
    border-radius: 10px 10px 0 0;
    width: 15px;
    height: 15px;
    background: transparent;
    display: block;
    position: relative;
  }

  .bell::before,
  .bell::after {
    content: "";
    background: #333;
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .bell::before {
    top: 80%;
    width: 15px;
    height: 3px;
  }

  .bell::after {
    top: calc(100% + 5px);
    width: 10px;
    height: 3px;
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
          <div className="bell" />
        </div>
        {itemCount > 0 && (
          <div className="notification-count">{itemCount}</div>
        )}
      </div>
    </StyledWrapper>
  );
}