'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';   // ← Required for Next.js

const NoProductsMessage = () => {
  return (
    <StyledWrapper>
      <div className="error-card-404">
        <div className="astronaut-section-404">
          <div className="cable-404" />
          <div className="astronaut-404">
            <div className="backpack-404" />
            <div className="helmet-404">
              <div className="visor-404" />
            </div>
            <div className="body-404">
              <div className="chest-panel-404">
                <div className="light-404 light-red-404" />
                <div className="light-404 light-green-404" />
                <div className="light-404 light-blue-404" />
              </div>
            </div>
            <div className="arm-left-404" />
            <div className="arm-right-404" />
            <div className="leg-left-404" />
            <div className="leg-right-404" />
          </div>
        </div>
        <div className="content-section-404">
          <div className="error-code-404">No Products</div>
          <div className="error-title-404">Lost in Space</div>
          <div className="error-message-404">
            Houston, we have a problem. No products found in this category... or the internet drifted away.
          </div>
        </div>
        <div className="search-section-404">
          <div className="search-box-404">
            <input type="text" placeholder="Search..." className="search-input-404" />
            <button className="search-btn-404">
              <svg viewBox="0 0 24 24" width={16} height={16}>
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="buttons-section-404">
          {/* ← Changed to Next.js Link (only change) */}
          <Link href="/" className="btn-404 btn-primary-404">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </Link>
          <button className="btn-404 btn-secondary-404" onClick={() => window.location.reload()}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Retry
          </button>
        </div>
        <div className="footer-section-404">
          <a href="#" className="footer-link-404">Documentation</a>
          <a href="#" className="footer-link-404">Support</a>
          <a href="#" className="footer-link-404">Contact</a>
        </div>
        <div className="glow-bg-404" />
        <div className="stars-404">
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
          <span className="star-404" />
        </div>
      </div>
    </StyledWrapper>
  );
};

// ──────────────────────────────────────────────────────────────
// YOUR ORIGINAL STYLED COMPONENT — 100% UNCHANGED
// ──────────────────────────────────────────────────────────────
const StyledWrapper = styled.div`
  .error-card-404 {
    position: relative;
    width: 320px;
    background: rgba(30, 30, 45, 0.6);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 24px 16px;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .glow-bg-404 {
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(102, 126, 234, 0.15) 0%,
      transparent 60%
    );
    pointer-events: none;
    animation: glowPulse-404 4s ease-in-out infinite;
  }

  @keyframes glowPulse-404 {
    0%,
    100% {
      opacity: 0.5;
      transform: translateX(-50%) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translateX(-50%) scale(1.1);
    }
  }

  .stars-404 {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .star-404 {
    position: absolute;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    animation: twinkle-404 2s infinite;
  }

  .star-404:nth-child(1) {
    top: 15%;
    left: 15%;
    animation-delay: 0s;
  }
  .star-404:nth-child(2) {
    top: 25%;
    left: 85%;
    animation-delay: 0.3s;
  }
  .star-404:nth-child(3) {
    top: 60%;
    left: 10%;
    animation-delay: 0.6s;
  }
  .star-404:nth-child(4) {
    top: 75%;
    left: 80%;
    animation-delay: 0.9s;
  }
  .star-404:nth-child(5) {
    top: 40%;
    left: 90%;
    animation-delay: 1.2s;
  }
  .star-404:nth-child(6) {
    top: 20%;
    left: 50%;
    animation-delay: 0.4s;
  }
  .star-404:nth-child(7) {
    top: 80%;
    left: 30%;
    animation-delay: 0.7s;
  }
  .star-404:nth-child(8) {
    top: 35%;
    left: 20%;
    animation-delay: 1s;
  }
  .star-404:nth-child(9) {
    top: 70%;
    left: 70%;
    animation-delay: 1.3s;
  }
  .star-404:nth-child(10) {
    top: 10%;
    left: 65%;
    animation-delay: 0.2s;
  }

  @keyframes twinkle-404 {
    0%,
    100% {
      opacity: 0.2;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.2);
    }
  }

  .astronaut-section-404 {
    position: relative;
    width: 80px;
    height: 100px;
    flex-shrink: 0;
  }

  .cable-404 {
    position: absolute;
    width: 2px;
    height: 30px;
    background: linear-gradient(to bottom, #667eea, transparent);
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.6;
    animation: cableSway-404 3s ease-in-out infinite;
  }

  @keyframes cableSway-404 {
    0%,
    100% {
      transform: translateX(-50%) rotate(-2deg);
    }
    50% {
      transform: translateX(-50%) rotate(2deg);
    }
  }

  .astronaut-404 {
    width: 100%;
    height: 100%;
    position: relative;
    animation: astronautFloat-404 3s ease-in-out infinite;
  }

  @keyframes astronautFloat-404 {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .helmet-404 {
    width: 44px;
    height: 44px;
    background: linear-gradient(145deg, #f5f5f5 0%, #e0e0e0 50%, #c0c0c0 100%);
    border-radius: 50%;
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow:
      inset -5px -5px 10px rgba(0, 0, 0, 0.1),
      inset 5px 5px 10px rgba(255, 255, 255, 0.8),
      0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }

  .visor-404 {
    width: 30px;
    height: 22px;
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
    border-radius: 50%;
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    overflow: hidden;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .visor-404::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 40%,
      rgba(255, 255, 255, 0.15) 50%,
      transparent 60%
    );
    animation: visorShine-404 2.5s ease-in-out infinite;
  }

  @keyframes visorShine-404 {
    0%,
    100% {
      transform: translateX(-100%) rotate(45deg);
    }
    50% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  .body-404 {
    width: 36px;
    height: 32px;
    background: linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%);
    border-radius: 18px 18px 12px 12px;
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow:
      inset -3px -3px 8px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .chest-panel-404 {
    width: 20px;
    height: 14px;
    background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
    border-radius: 4px;
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    padding: 3px;
    align-items: center;
    justify-content: center;
  }

  .light-404 {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: lightBlink-404 1.5s ease-in-out infinite;
  }

  .light-red-404 {
    background: #ff4757;
    animation-delay: 0s;
  }
  .light-green-404 {
    background: #2ed573;
    animation-delay: 0.3s;
  }
  .light-blue-404 {
    background: #3742fa;
    animation-delay: 0.6s;
  }

  @keyframes lightBlink-404 {
    0%,
    100% {
      opacity: 0.3;
      box-shadow: none;
    }
    50% {
      opacity: 1;
      box-shadow: 0 0 6px currentColor;
    }
  }

  .arm-left-404,
  .arm-right-404 {
    width: 12px;
    height: 28px;
    background: linear-gradient(145deg, #ffffff 0%, #d8d8d8 100%);
    border-radius: 8px;
    position: absolute;
    top: 50px;
  }

  .arm-left-404 {
    left: 14px;
    transform: rotate(15deg);
    transform-origin: top center;
    animation: armWaveLeft-404 2.5s ease-in-out infinite;
  }

  .arm-right-404 {
    right: 14px;
    transform: rotate(-15deg);
    transform-origin: top center;
    animation: armWaveRight-404 2.5s ease-in-out infinite;
  }

  @keyframes armWaveLeft-404 {
    0%,
    100% {
      transform: rotate(15deg);
    }
    50% {
      transform: rotate(25deg);
    }
  }

  @keyframes armWaveRight-404 {
    0%,
    100% {
      transform: rotate(-15deg);
    }
    50% {
      transform: rotate(-25deg);
    }
  }

  .leg-left-404,
  .leg-right-404 {
    width: 14px;
    height: 24px;
    background: linear-gradient(145deg, #ffffff 0%, #d8d8d8 100%);
    border-radius: 0 0 8px 8px;
    position: absolute;
    top: 76px;
  }

  .leg-left-404 {
    left: 26px;
  }
  .leg-right-404 {
    right: 26px;
  }

  .backpack-404 {
    width: 32px;
    height: 26px;
    background: linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%);
    border-radius: 8px;
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    z-index: -1;
  }

  .content-section-404 {
    text-align: center;
    z-index: 1;
  }

  .error-code-404 {
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: -2px;
  }

  .error-title-404 {
    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .error-message-404 {
    color: #8b8b9f;
    font-size: 12px;
    line-height: 1.5;
    max-width: 240px;
  }

  .search-section-404 {
    width: 100%;
    z-index: 1;
  }

  .search-box-404 {
    position: relative;
    width: 100%;
  }

  .search-input-404 {
    width: 100%;
    padding: 10px 36px 10px 14px;
    border: 1px solid rgba(102, 126, 234, 0.25);
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 13px;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .search-input-404:focus {
    border-color: rgba(102, 126, 234, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }

  .search-input-404::placeholder {
    color: #6a6a7a;
  }

  .search-btn-404 {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: transform 0.2s ease;
    padding: 0;
  }

  .search-btn-404:hover {
    transform: translateY(-50%) scale(1.05);
  }

  .buttons-section-404 {
    display: flex;
    gap: 10px;
    width: 100%;
    z-index: 1;
  }

  .btn-404 {
    flex: 1;
    padding: 10px 16px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 12px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-primary-404 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  }

  .btn-primary-404:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
  }

  .btn-secondary-404 {
    background: transparent;
    color: #9a9aaf;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .btn-secondary-404:hover {
    border-color: rgba(102, 126, 234, 0.4);
    color: white;
    background: rgba(102, 126, 234, 0.1);
  }

  .footer-section-404 {
    display: flex;
    gap: 16px;
    padding-top: 4px;
    z-index: 1;
  }

  .footer-link-404 {
    color: #6a6a7a;
    text-decoration: none;
    font-size: 11px;
    transition: color 0.2s ease;
  }

  .footer-link-404:hover {
    color: #667eea;
  }
`;

export default NoProductsMessage;