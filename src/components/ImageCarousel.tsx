'use client';

import { useRef, useState } from 'react';

interface Props {
  images: string[];
  alt: string;
  height: number | string;
  borderRadius?: number;
}

export default function ImageCarousel({ images, alt, height, borderRadius = 16 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const list = images.length > 0 ? images : ['/placeholder.png'];

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          borderRadius,
          scrollbarWidth: 'none',
          height,
        }}
      >
        {list.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ))}
      </div>

      {list.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {list.map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                boxShadow: '0 0 2px rgba(0,0,0,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}