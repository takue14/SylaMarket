'use client';

import styled from 'styled-components';

const Card = styled.div<{ bg: string }>`
  flex: 1 1 0;
  min-width: 0;
  height: 130px;
  border-radius: 16px;
  padding: 14px;
  position: relative;
  overflow: hidden;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  background: ${p => p.bg};
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  margin-bottom:20px;
`;

const Thumb = styled.div`
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 100%;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255,255,255,0.15);

  img { width: 100%; height: 100%; object-fit: cover; }
`;

interface Props {
  label: string;
  image?: string;
  bg: string;
  onClick: () => void;
}

export default function StoreSpotlightCard({ label, image, bg, onClick }: Props) {
  return (
    <Card bg={bg} onClick={onClick} role="button" tabIndex={0}>
      {label}
      <Thumb>{image && <img src={image} alt="" />}</Thumb>
    </Card>
  );
}