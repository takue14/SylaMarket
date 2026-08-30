'use client';

import styled from 'styled-components';

const Card = styled.div`
  background: var(--bg-card);
  border-radius: 12px;
  padding: 10px 8px 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.06);

  &:hover {
    transform: translateY(-3px);
  }
`;

const MosaicGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 4px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
`;

const Tile = styled.div`
  background: linear-gradient(135deg, #3a3a3d, #232325);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const MoreBadge = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 9.5px;
  padding: 2px 6px;
  border-radius: 6px;
`;

const Label = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-primary);
`;

interface Props {
  label: string;
  images: string[];
  moreCount?: number;
  onClick: () => void;
}

export default function CategoryMosaicCard({ label, images, moreCount, onClick }: Props) {
  const tiles = Array.from({ length: 4 }, (_, i) => images[i] || null);

  return (
    <Card onClick={onClick} role="button" tabIndex={0} aria-label={`Browse ${label}`}>
      <MosaicGrid>
        {tiles.map((src, i) => (
          <Tile key={i}>
            {src && <img src={src} alt="" />}
          </Tile>
        ))}
        {!!moreCount && moreCount > 0 && <MoreBadge>+{moreCount} more</MoreBadge>}
      </MosaicGrid>
      <Label>{label}</Label>
    </Card>
  );
}