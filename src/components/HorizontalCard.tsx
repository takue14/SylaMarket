'use client';

import Image from 'next/image';
import styled from 'styled-components';

interface HorizontalCardProps {
  image: string;
  title: string;
  tags?: string[];
  time?: number;
  onClick?: () => void;
}

const CardWrapper = styled.div`
  width: 200px;
  min-width: 200px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  height: 150px;
  width: 100%;
`;

const Overlay = styled.div`
  position: absolute;
  top: 35%;
  height: 65%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 12px 14px;
  z-index: 10;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: white;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
`;

const Tag = styled.span`
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const TimeInfo = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-items: flex-end;
  gap: 5px;
  font-size: 0.82rem;
  color: var(--text-primary);   /* was: #e0f2fe */
`;

export default function HorizontalCard({
  image,
  title,
  tags = [],
  time = 0,
  onClick,
}: HorizontalCardProps) {
  return (
    <CardWrapper onClick={onClick}>
      <ImageContainer>
        <Image
          src={image}
          alt={title}
          fill
          style={{ objectFit: 'cover' }}
        />

        <Overlay>
          <Title>{title}</Title>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {tags.length > 0 && (
              <Tags style={{ marginTop: '20px' }}>
                {tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Tags>
            )}

            <TimeInfo style={{ marginTop: '20px' }}>
              <span>$</span>
              <span>{time}</span>
            </TimeInfo>
          </div>
        </Overlay>
      </ImageContainer>
    </CardWrapper>
  );
}