'use client';

import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Link from 'next/link';
import LocationSettings from '@/components/LocationSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  imageLink?: string;
  quantity: number;
  createdAt: string;
}

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// ================== STYLES ==================

const Page = styled.div`
  --bg: var(--bg-base);
  --card-bg: var(--bg-card);
  --ink: var(--text-primary);
  --muted: var(--text-muted);
  /* Balance card stays a fixed dark gradient in both themes — like a
     bank card's face, it's a deliberate accent surface, not a page
     background that should flip with light/dark mode. */
  --dark: #17181c;
  --dark-2: #232429;
  --red: #e0364f;
  --red-dark: #c22a41;
  --slate: #3c4550;
  --slate-2: #4d5866;
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 14px;

  width: 100%;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const AppShell = styled.div`
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  padding: 28px 20px 60px;
  position: relative;
  box-sizing: border-box;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 14px 2px;
`;

/* ===== Balance carousel ===== */

const BalanceCarousel = styled.div`
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 40px -18px rgba(15, 16, 20, 0.55);
`;

const BalanceTrack = styled.div<{ $dragging: boolean }>`
  display: flex;
  width: 200%;
  transition: ${p => (p.$dragging ? 'none' : 'transform .38s cubic-bezier(.22,.68,0,1)')};
  touch-action: pan-y;
  cursor: ${p => (p.$dragging ? 'grabbing' : 'grab')};
`;

const BalanceCard = styled.div`
  flex: 0 0 50%;
  width: 50%;
  box-sizing: border-box;
  background: linear-gradient(160deg, var(--dark-2), var(--dark) 60%);
    padding: 18px 22px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 14px;
  user-select: none;
`;

const BalanceTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color:var(--text-primary);
`;

const BalanceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const BalanceIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.06);
`;

const BalanceLabel = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.01em;
`;

const BalanceBadge = styled.div`
  background: #959595;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BalanceAmount = styled.p`
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.1;
`;

const BalanceNote = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0;
  max-width: 90%;
`;

const Cents = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

const ChipRow = styled.div`
  display: flex;
  gap: 10px;
`;

const ChipGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const Chip = styled.div<{ $variant: 'red' | 'slate' | 'blue' | 'green'; $compact?: boolean }>`
  flex: 1;
  border-radius: 16px;
  padding: ${p => (p.$compact ? '12px 14px' : '14px')};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: ${p => (p.$compact ? '4px' : '10px')};
  height: ${p => (p.$compact ? '68px' : '88px')};
  box-sizing: border-box;
  cursor: default;
  background: ${p =>
    p.$variant === 'red'
      ? 'linear-gradient(150deg, var(--red), var(--red-dark))'
      : p.$variant === 'slate'
      ? 'linear-gradient(150deg, var(--slate-2), var(--slate))'
      : p.$variant === 'blue'
      ? 'linear-gradient(150deg, #4f7cff, #3b5fd9)'
      : 'linear-gradient(150deg, #3fbf7f, #2e9c66)'};
`;

const ChipIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
`;

const ChipValue = styled.span`
  font-weight: 700;
  font-size: 20px;
  color: #fff;
`;

const ChipCaption = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
`;

const ChipWhite = styled.div`
  flex: 0 0 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--bg-card);
  color: var(--ink);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.4);
`;

const ChipWhiteValue = styled.span`
  font-size: 20px;
  font-weight: 700;
`;

const ChipWhiteCaption = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionBtn = styled.button`
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 16px 10px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 24px -12px rgba(20, 21, 26, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-decoration: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -12px rgba(20, 21, 26, 0.32);
  }
  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const CircleIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ink);
  color: #7b7979;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`;

/* ===== Dots ===== */

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 14px 0 22px;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${p => (p.$active ? '16px' : '6px')};
  height: 6px;
  border-radius: ${p => (p.$active ? '4px' : '50%')};
  background: ${p => (p.$active ? 'var(--ink)' : '#cfd2da')};
  cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
`;

/* ===== Overview box (unchanged apart from removed upload button) ===== */

const OverviewBox = styled.div`
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  color: var(--ink);
  box-shadow: 0 10px 30px -18px rgba(20, 21, 26, 0.15);
`;

const OverviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
`;

/* ===== Operations card (now hosts the product listing) ===== */

const OpsCard = styled.div`
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 22px 20px 8px;
  box-shadow: 0 10px 30px -18px rgba(20, 21, 26, 0.15);
`;

/* ===== Product list styled-components — kept exactly as in the original file ===== */

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 24px;
  color: var(--text-primary, var(--ink));
`;

const MobileProductCard = styled.div`
  background: var(--bg-base, #f6f6f8);
  border-radius: 24px;
  padding: 16px;
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ProductImage = styled.img`
  width: 75px;
  height: 75px;
  border-radius: 18px;
  object-fit: cover;
  background: #222;
`;

// ================== COMPONENT ==================

export default function SellerDashboard() {
  // 0 = "Products" slide, 1 = "Analysis" slide — replaces the old mobileTab tab switcher
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});

  const router = useRouter();
  usePushNotifications(!!sellerId);

  // ----- carousel drag state -----
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaPercent, setDragDeltaPercent] = useState(0);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  const slideCount = 2;

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(slideCount - 1, index)) as 0 | 1;
    setActiveSlide(clamped);
    setDragDeltaPercent(0);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragCurrentX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    dragCurrentX.current = e.clientX;
    const width = carouselRef.current.getBoundingClientRect().width;
    const delta = dragCurrentX.current - dragStartX.current;
    setDragDeltaPercent((delta / width) * 50);
  };

  const handlePointerUp = () => {
    if (!isDragging || !carouselRef.current) return;
    setIsDragging(false);

    const width = carouselRef.current.getBoundingClientRect().width;
    const delta = dragCurrentX.current - dragStartX.current;
    const threshold = width * 0.18;

    if (delta < -threshold && activeSlide < slideCount - 1) {
      goToSlide(activeSlide + 1);
    } else if (delta > threshold && activeSlide > 0) {
      goToSlide(activeSlide - 1);
    } else {
      goToSlide(activeSlide);
    }
  };

  const trackTransform = `translateX(${-activeSlide * 50 + dragDeltaPercent}%)`;

  const fetchSellerData = async () => {
    const sellerId = localStorage.getItem('sellerId');

    if (!sellerId) {
      router.push('/seller/login');
      return;
    }

    const prodRes = await fetch(`/api/sellers/${sellerId}/products`);
    if (prodRes.ok) {
      const data = await prodRes.json();
      setProducts(data);
    }

    const orderRes = await fetch('/api/orders?as=seller');
    if (orderRes.ok) {
      const data = await orderRes.json();
      setOrders(data);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem('sellerId');
    setSellerId(id);

    fetchSellerData();
  }, []);

  // ── Guard added: rejects negative quantities ──
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    const res = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    if (res.ok) {
      fetchSellerData();
    } else {
      alert('Failed to update quantity');
    }
  };

  // ── try/catch error handling added ──
  const deleteProduct = async (productId: string) => {
    if (!confirm('Delete this product permanently?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSellerData();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const handleRestock = (productId: string) => {
    const qty = restockAmounts[productId] || 10;

    if (qty > 0) {
      updateQuantity(productId, qty);

      setRestockAmounts(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }
  };

  const listedProducts = products.filter(p => p.quantity > 0);
  const soldOutProducts = products.filter(p => p.quantity === 0);

  const totalListedValue = listedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const overallRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const splitMoney = (value: number) => {
    const fixed = value.toFixed(2);
    const [whole, cents] = fixed.split('.');
    return { whole: Number(whole).toLocaleString('en-US'), cents };
  };

  const revenueSplit = splitMoney(overallRevenue);

  return (
    <Page>
      <AppShell>
        <SectionTitle>Seller Dashboard</SectionTitle>

        {/* ================== BALANCE CARD CAROUSEL ================== */}
        <BalanceCarousel
          ref={carouselRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <BalanceTrack $dragging={isDragging} style={{ transform: trackTransform }}>
            {/* ---- Slide 1: Products (was mobileTab "products") ---- */}
            <BalanceCard>
              <BalanceTop>
                <BalanceIcon>$</BalanceIcon>
                <BalanceBadge>products</BalanceBadge>
              </BalanceTop>

              <BalanceInfo>
                <BalanceLabel>Total revenue</BalanceLabel>
                <BalanceAmount>
                  {revenueSplit.whole}
                  <Cents>.{revenueSplit.cents}</Cents>
                </BalanceAmount>
              </BalanceInfo>

              <ChipRow>
                                <Chip $variant="red" $compact>
                  <ChipValue>{products.length}</ChipValue>
                  <ChipCaption>Total products</ChipCaption>
                </Chip>

                <Chip $variant="slate" $compact>
                  <ChipValue>{listedProducts.length}</ChipValue>
                  <ChipCaption>Listed</ChipCaption>
                </Chip>

                <ChipWhite>
                  <ChipWhiteValue>{soldOutProducts.length}</ChipWhiteValue>
                  <ChipWhiteCaption>Sold out</ChipWhiteCaption>
                </ChipWhite>
              </ChipRow>

              <ActionRow>
                <Link href="/seller/upload" passHref legacyBehavior>
                  <ActionBtn as="a">
                    <CircleIcon>+</CircleIcon> Upload products
                  </ActionBtn>
                </Link>

                <Link href="/seller/bulk-upload" passHref legacyBehavior>
                  <ActionBtn as="a">
                    <CircleIcon>≡</CircleIcon> Bulk CSV
                  </ActionBtn>
                </Link>
              </ActionRow>
            </BalanceCard>

            {/* ---- Slide 2: Analysis (was mobileTab "analysis") ---- */}
            <BalanceCard>
              <BalanceTop>
                <BalanceIcon>$</BalanceIcon>
                <BalanceBadge>sales Analysis</BalanceBadge>
              </BalanceTop>

              <BalanceInfo>
                <BalanceLabel>Sales analytics</BalanceLabel>
                <BalanceNote>Order volume, delivery and inventory value at a glance.</BalanceNote>
              </BalanceInfo>

              <ChipGrid>
                                <Chip $variant="red">
                  <div>
                    <ChipValue>${totalListedValue.toFixed(0)}</ChipValue>
                    <br />
                    <ChipCaption>Total value</ChipCaption>
                  </div>
                </Chip>

                <Chip $variant="blue">
                  <ChipIcon></ChipIcon>
                  <div>
                    <ChipValue>{orders.length}</ChipValue>
                    <br />
                    <ChipCaption>Orders</ChipCaption>
                  </div>
                </Chip>

                <Chip $variant="green">
                  <ChipIcon></ChipIcon>
                  <div>
                    <ChipValue>${overallRevenue.toFixed(0)}</ChipValue>
                    <br />
                    <ChipCaption>Revenue</ChipCaption>
                  </div>
                </Chip>

                <Chip $variant="slate">
                  <ChipIcon></ChipIcon>
                  <div>
                    <ChipValue>{deliveredOrders.length}</ChipValue>
                    <br />
                    <ChipCaption>Delivered</ChipCaption>
                  </div>
                </Chip>

              </ChipGrid>
            </BalanceCard>
          </BalanceTrack>
        </BalanceCarousel>

        {/* ================== DOTS ================== */}
        <Dots>
          {Array.from({ length: slideCount }).map((_, i) => (
            <Dot key={i} $active={activeSlide === i} onClick={() => goToSlide(i)} />
          ))}
        </Dots>

        {/* ================== PRODUCT OVERVIEW (upload button removed — it now lives in the balance card) ================== */}
        <OverviewBox>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Product Overview</h3>
          </div>

          <div>
            <OverviewItem>
              <span>Total Inventory Value</span>
              <strong>${totalListedValue.toFixed(2)}</strong>
            </OverviewItem>

            <OverviewItem>
              <span>Total Revenue</span>
              <strong>${overallRevenue.toFixed(2)}</strong>
            </OverviewItem>

            <OverviewItem>
              <span>Active Products</span>
              <strong>{listedProducts.length}</strong>
            </OverviewItem>
          </div>
        </OverviewBox>

        {/* ================== LOCATION SETTINGS (preserved from the original — was broken/unreachable JSX before) ================== */}
        {sellerId && (
          <div style={{ marginBottom: 20 }}>
            <LocationSettings role="seller" userId={sellerId} />
          </div>
        )}

        {/* ================== OPERATIONS CARD — now hosts the product listing, unchanged from the original ================== */}
        <OpsCard>
          <h2 style={{ marginBottom: '20px' }}>Products</h2>

          <ProductList>
            {listedProducts.map(product => (
              <MobileProductCard key={product._id}>
                <ProductImage src={product.imageLink || '/placeholder.png'} alt={product.productName} />

                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: '6px' }}>{product.productName}</h4>

                  <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>{product.category} <strong style={{paddingRight: '10px',color:'var(--text-primary)'}}>${product.price}</strong></p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    

                    {/* ── Quantity counter (added back) ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(product._id, product.quantity - 1)}
                        style={{
                          background: '#222',
                          border: 'none',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        -
                      </button>

                      <input
                        type="number"
                        value={product.quantity}
                        onChange={e => updateQuantity(product._id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '40px',
                          textAlign: 'center',
                          padding: '4px',
                          borderRadius: '6px',
                          background: '#1a1a1a',
                          color: 'white',
                          border: '1px solid #333',
                        }}
                      />

                      <button
                        onClick={() => updateQuantity(product._id, product.quantity + 1)}
                        style={{
                          background: '#222',
                          border: 'none',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>

                                        <button
                      onClick={() => router.push(`/seller/products/${product._id}/edit`)}
                      style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteProduct(product._id)}
                      style={{
                        background: '#ef4444',
                        border: 'none',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </MobileProductCard>
            ))}
          </ProductList>

          {/* ── Sold Out section (added back) ── */}
          {soldOutProducts.length > 0 && (
            <>
              <h2 style={{ marginTop: '40px', color: '#ef4444' }}>Sold Out Products</h2>

              <ProductList>
                {soldOutProducts.map(product => (
                  <MobileProductCard key={product._id}>
                    <ProductImage src={product.imageLink || '/placeholder.png'} alt={product.productName} />

                    <div style={{ flex: 1 }}>
                      <h4>{product.productName}</h4>
                      <p style={{ color: '#999', fontSize: '13px' }}>{product.category}</p>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input
                          type="number"
                          value={restockAmounts[product._id] || 10}
                          onChange={e =>
                            setRestockAmounts(prev => ({
                              ...prev,
                              [product._id]: parseInt(e.target.value) || 10,
                            }))
                          }
                          style={{
                            width: '70px',
                            padding: '6px',
                            borderRadius: '6px',
                            background: '#1a1a1a',
                            color: 'white',
                            border: '1px solid #333',
                          }}
                        />

                        <button
                          onClick={() => handleRestock(product._id)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  </MobileProductCard>
                ))}
              </ProductList>
            </>
          )}
        </OpsCard>
      </AppShell>
    </Page>
  );
}