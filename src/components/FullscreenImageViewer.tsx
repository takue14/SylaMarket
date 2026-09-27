'use client';

import { useEffect } from 'react';
import styled from 'styled-components';

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function FullscreenImageViewer({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <Overlay onClick={onClose}>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      <CloseBtn onClick={onClose} aria-label="Close">
        ×
      </CloseBtn>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
`;