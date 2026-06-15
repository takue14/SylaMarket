'use client';

import Image from 'next/image';
import styled, { keyframes } from 'styled-components';
import { useState, useEffect, useRef } from 'react';

interface AdItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText: string;
  badge?: string;
  badgeColor?: string;
  isLarge?: boolean;
}

/* =========================
   ANIMATIONS
========================= */

const slideRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-40px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const slideLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

/* =========================
   STYLES
========================= */

const AdsContainer = styled.div`
  max-width: 1500px;
  width: 100%;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 0 10px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 6px;
  height: 250px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    height: auto;
  }

  @media (max-width: 768px) {
    gap: 10px;
  }

  .right-column {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 6px;

    @media (max-width: 900px) {
      gap: 10px;
    }
  }

  .top-right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
  }

  .bottom-right {
    width: 100%;
    height: 100%;
  }
`;

const CardBase = styled.div<{ delay?: string }>`
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform: translateZ(0);

  animation-duration: 0.8s;
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  animation-delay: ${({ delay }) => delay || '0s'};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(0,0,0,0.18);
  }

  img {
    transition: transform 0.7s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    border-radius: 18px;
  }
`;

const LargeAd = styled(CardBase)`
  height: 100%;
  min-height: 250px;

  animation-name: ${slideRight};

  @media (max-width: 900px) {
    min-height: 220px;
  }

  @media (max-width: 768px) {
    min-height: 200px;
  }
`;

const SmallAd = styled(CardBase)`
  height: 100%;
  min-height: 120px;

  animation-name: ${slideLeft};

  @media (max-width: 768px) {
    min-height: 110px;
  }
`;

const HorizontalAd = styled(CardBase)`
  height: 100%;
  min-height: 120px;

  animation-name: ${slideUp};

  @media (max-width: 768px) {
    min-height: 120px;
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  color: white;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.82),
    rgba(0,0,0,0.2),
    transparent
  );

  @media (max-width: 768px) {
    padding: 10px;
  }

  h2 {
    margin: 0;
    font-size: 1.9rem;
    font-weight: 700;

    @media (max-width: 768px) {
      font-size: 1.1rem;
      line-height: 1.3;
    }
  }

  h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;

    @media (max-width: 768px) {
      font-size: 0.9rem;
      line-height: 1.2;
    }
  }

  p {
    margin: 8px 0;
    opacity: 0.92;
    line-height: 1.4;

    @media (max-width: 768px) {
      font-size: 0.72rem;
      margin: 5px 0;
      line-height: 1.3;
    }
  }

  .button {
    width: 100px !important;
    height: 30px !important;
    font-size: 0.85rem;

    @media (max-width: 768px) {
      width: 90px !important;
      height: 28px !important;
      font-size: 0.75rem;
      gap: 6px !important;
      padding-left: 8px !important;
    }
  }

  .svgIcon {
    @media (max-width: 768px) {
      height: 16px !important;
    }
  }
`;

const Badge = styled.span<{ color?: string }>`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${props => props.color || '#ef4444'};
  color: white;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 5;

  @media (max-width: 768px) {
    top: 8px;
    right: 8px;
    font-size: 0.65rem;
    padding: 2px 8px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
`;

const ModalContent = styled.div`
  background: var(--bg-base);
  border-radius: 18px;
  width: 90%;
  max-width: 500px;
  padding: 25px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);

  @media (max-width: 768px) {
    width: 94%;
    padding: 18px;
    border-radius: 14px;

    h2 {
      font-size: 1.1rem;
    }

    p {
      font-size: 0.9rem;
    }

    input {
      font-size: 0.9rem;
    }

    button {
      font-size: 0.9rem;
      padding: 12px !important;
    }
  }
`;

/* =========================
   COMPONENT
========================= */

export default function Ads({ ads }: { ads: AdItem[] }) {
  const [currentAds, setCurrentAds] = useState<AdItem[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ads.length === 0) return;

    let currentIndex = 0;

    const updateAds = () => {
      setCurrentAds([
        ads[currentIndex % ads.length],
        ads[(currentIndex + 1) % ads.length],
        ads[(currentIndex + 2) % ads.length],
        ads[(currentIndex + 3) % ads.length],
      ]);
      currentIndex++;
    };

    updateAds();
    intervalRef.current = setInterval(updateAds, 20000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ads]);

  const handleCardClick = (ad: AdItem) => {
    setSelectedAd(ad);
    setName(localStorage.getItem('customerName') || '');
    setContact('');
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAd) return;

    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adTitle: selectedAd.title,
        customerName: name,
        contact: contact,
        adId: selectedAd.id,
      }),
    });

    alert('Inquiry sent successfully!');
    setSelectedAd(null);
  };

  if (ads.length === 0) {
    return (
      <AdsContainer>
        <Grid>
          <LargeAd
            style={{
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h3>No Ads Yet</h3>
            </div>
          </LargeAd>
        </Grid>
      </AdsContainer>
    );
  }

  const largeAd = currentAds[0];
  const topAds = currentAds.slice(1, 3);
  const bottomAd = currentAds[3];

  return (
    <AdsContainer>
      <Grid>

        {/* LEFT LARGE CARD */}
        {largeAd && (
          <LargeAd key={largeAd.id} onClick={() => handleCardClick(largeAd)}>
            <Image
              src={largeAd.image}
              alt={largeAd.title}
              fill
              priority
              style={{ objectFit: 'cover' }}
            />

            <Overlay>
              {largeAd.badge && (
                <Badge color={largeAd.badgeColor}>
                  {largeAd.badge}
                </Badge>
              )}

              <h2>{largeAd.title}</h2>

              <p>{largeAd.description}</p>

              <button
                className="button"
                style={{
                  width: "110px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "10px",
                  backgroundColor: "rgb(161, 255, 20)",
                  borderRadius: "30px",
                  color: "rgb(19, 19, 19)",
                  fontWeight: 600,
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.116)",
                  paddingLeft: "8px",
                  transitionDuration: ".5s"
                }}
              >
                <svg
                  className="svgIcon"
                  viewBox="0 0 512 512"
                  height="1em"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ height: "20px", transitionDuration: "1.5s" }}
                >
                  <path
                    fill="rgb(19, 19, 19)"
                    d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
                  />
                </svg>

                Explore
              </button>
            </Overlay>
          </LargeAd>
        )}

        {/* RIGHT COLUMN */}
        <div className="right-column">

          {/* TOP RIGHT */}
          <div className="top-right">
            {topAds.map((ad) => (
              <SmallAd
                key={ad.id}
                onClick={() => handleCardClick(ad)}
              >
                <Image
                  src={ad.image}
                  alt={ad.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />

                <Overlay>
                  {ad.badge && (
                    <Badge color={ad.badgeColor}>
                      {ad.badge}
                    </Badge>
                  )}

                  <h3>{ad.title}</h3>

                  <button
                    className="button"
                    style={{
                      width: "110px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "10px",
                      backgroundColor: "rgb(161, 255, 20)",
                      borderRadius: "30px",
                      color: "rgb(19, 19, 19)",
                      fontWeight: 600,
                      border: "none",
                      position: "relative",
                      cursor: "pointer",
                      boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.116)",
                      paddingLeft: "8px",
                      transitionDuration: ".5s"
                    }}
                  >
                    <svg
                      className="svgIcon"
                      viewBox="0 0 512 512"
                      height="1em"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ height: "20px", transitionDuration: "1.5s" }}
                    >
                      <path
                        fill="rgb(19, 19, 19)"
                        d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
                      />
                    </svg>

                    Explore
                  </button>
                </Overlay>
              </SmallAd>
            ))}
          </div>

          {/* BOTTOM */}
          {bottomAd && (
            <div className="bottom-right">
              <HorizontalAd
                key={bottomAd.id}
                onClick={() => handleCardClick(bottomAd)}
              >
                <Image
                  src={bottomAd.image}
                  alt={bottomAd.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />

                <Overlay>
                  {bottomAd.badge && (
                    <Badge color={bottomAd.badgeColor}>
                      {bottomAd.badge}
                    </Badge>
                  )}

                  <h3>{bottomAd.title}</h3>

                  <p>{bottomAd.description}</p>
                </Overlay>
              </HorizontalAd>
            </div>
          )}
        </div>
      </Grid>

      {/* Inquiry Modal */}
      {selectedAd && (
        <ModalOverlay onClick={() => setSelectedAd(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>

            <h2 style={{ marginBottom: '10px' }}>
              {selectedAd.title}
            </h2>

            <p style={{ marginBottom: '20px', color: '#666' }}>
              {selectedAd.description}
            </p>

            <form onSubmit={handleSubmitInquiry}>

              <label>Full Name</label>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              />

              <label>Phone / Email</label>

              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  margin: '8px 0',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  marginTop: '20px',
                  fontWeight: 600
                }}
              >
                Contact Us
              </button>
            </form>

            <button
              onClick={() => setSelectedAd(null)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                marginTop: '10px'
              }}
            >
              Close
            </button>

          </ModalContent>
        </ModalOverlay>
      )}
    </AdsContainer>
  );
}