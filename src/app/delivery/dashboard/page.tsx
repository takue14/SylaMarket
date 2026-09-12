'use client';

import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import LocationSettings from '@/components/LocationSettings';
import Ac404 from '@/components/Ac404';

interface OrderItem {
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  customerName: string;
  contact: string;
  location: string;
  products: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'inprogress' | 'delivered';
  claimedBy?: string | null;
  createdAt: string;
  isSplitPayment: boolean;
  balanceDue: number;
  balanceCollected: number;
}

const SLIDE_COUNT = 3;
const SLIDE_WIDTH = 100 / SLIDE_COUNT;

// ================== STYLES ==================

const Page = styled.div`
  --bg: var(--bg-base);
  --card-bg: var(--bg-card);
  --ink: var(--text-primary);
  --muted: var(--text-muted);
  --dark: #17181c;
  --dark-2: #232429;
  --red: #e0364f;
  --red-dark: #c22a41;
  --slate: #3c4550;
  --slate-2: #4d5866;
  --radius-lg: 28px;
  --radius-md: 20px;

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
  box-sizing: border-box;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 14px 2px;
`;

const BalanceCarousel = styled.div`
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: 0 18px 40px -18px rgba(15, 16, 20, 0.55);
`;

const BalanceTrack = styled.div<{ $dragging: boolean }>`
  display: flex;
  width: ${SLIDE_COUNT * 100}%;
  transition: ${(p) => (p.$dragging ? 'none' : 'transform .38s cubic-bezier(.22,.68,0,1)')};
  touch-action: pan-y;
  cursor: ${(p) => (p.$dragging ? 'grabbing' : 'grab')};
`;

const BalanceCard = styled.div`
  flex: 0 0 ${SLIDE_WIDTH}%;
  width: ${SLIDE_WIDTH}%;
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
  background: #fff;
  color: var(--ink);
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

const Cents = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
`;

const ChipRow = styled.div`
  display: flex;
  gap: 10px;
`;

const Chip = styled.div<{ $variant: 'red' | 'slate' | 'blue' | 'green'; $compact?: boolean }>`
  flex: 1;
  border-radius: 16px;
  padding: ${(p) => (p.$compact ? '12px 14px' : '14px')};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: ${(p) => (p.$compact ? '4px' : '10px')};
  height: ${(p) => (p.$compact ? '68px' : '88px')};
  box-sizing: border-box;
  background: ${(p) =>
    p.$variant === 'red'
      ? 'linear-gradient(150deg, var(--red), var(--red-dark))'
      : p.$variant === 'slate'
      ? 'linear-gradient(150deg, var(--slate-2), var(--slate))'
      : p.$variant === 'blue'
      ? 'linear-gradient(150deg, #4f7cff, #3b5fd9)'
      : 'linear-gradient(150deg, #3fbf7f, #2e9c66)'};
`;

const ChipWhite = styled.div`
  flex: 0 0 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--card-bg);
  color: var(--ink);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
`;

const ChipValue = styled.span`
  font-weight: 700;
  font-size: 20px;
  color: #fff;
`;

const ChipWhiteValue = styled.span`
  font-size: 20px;
  font-weight: 700;
`;

const ChipCaption = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
`;

const ChipWhiteCaption = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 14px 0 22px;
`;

const Dot = styled.span<{ $active: boolean }>`
  width: ${(p) => (p.$active ? '16px' : '6px')};
  height: 6px;
  border-radius: ${(p) => (p.$active ? '4px' : '50%')};
  background: ${(p) => (p.$active ? 'var(--ink)' : 'var(--border)')};
  cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
`;

/* ── Animated content viewport, synced to the balance card's active slide ── */

const ContentViewport = styled.div<{ $height?: number }>`
  overflow: hidden;
  transition: height 0.3s ease;
  height: ${(p) => (p.$height ? `${p.$height}px` : 'auto')};
`;

const ContentTrack = styled.div<{ $activeSlide: number }>`
  display: flex;
  width: ${SLIDE_COUNT * 100}%;
  transform: translateX(-${(p) => p.$activeSlide * SLIDE_WIDTH}%);
  transition: transform 0.38s cubic-bezier(0.22, 0.68, 0, 1);
`;

const ContentPanel = styled.div`
  flex: 0 0 ${SLIDE_WIDTH}%;
  width: ${SLIDE_WIDTH}%;
  box-sizing: border-box;
  padding: 0 2px;
  align-self: flex-start;
`;

/* ── Order cards ── */

const OrderGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const OrderCard = styled.div`
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 18px;
  padding: 16px;
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 6px 20px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CustomerName = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  color: #5b6cff;
  font-size: 14px;
  font-weight: 700;

  svg {
    width: 18px;
    height: 18px;
    fill: #5b6cff;
    flex-shrink: 0;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) =>
    props.status === 'delivered' ? '#064e3b' : props.status === 'inprogress' ? '#1e3a5f' : '#2d1f00'};
  color: ${(props) =>
    props.status === 'delivered' ? '#10b981' : props.status === 'inprogress' ? '#3b82f6' : '#f59e0b'};
`;

const CardMeta = styled.div`
  font-size: 12.5px;
  color: #9b9ba3;
  line-height: 1.6;
`;

const ProductLine = styled.div`
  font-size: 12px;
  color: #6b6b76;
`;

const CardAmount = styled.div`
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -1px;
  color: #f5f5f5;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button<{ variant: 'green' | 'red' | 'blue' }>`
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  min-width: 80px;
  transition: opacity 0.2s;
  background: ${(props) => (props.variant === 'green' ? '#10b981' : props.variant === 'red' ? '#ef4444' : '#3b82f6')};

  &:hover {
    opacity: 0.85;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--muted);
  padding: 50px 20px;
  font-size: 15px;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const AnalyticsCard = styled.div<{ bg: string; dark?: boolean }>`
  min-height: 110px;
  border-radius: 22px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${(props) => props.bg};
  color: ${(props) => (props.dark ? 'white' : '#111')};

  .label {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.75;
  }

  .value {
    font-size: 26px;
    font-weight: 800;
    margin-top: 10px;
    letter-spacing: -0.5px;
  }
`;

// ================== COMPONENT ==================

export default function DeliveryDashboard() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryGuyId, setDeliveryGuyId] = useState<string | null>(null);
  const router = useRouter();

  // ----- carousel drag state (identical mechanics to SellerDashboard) -----
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaPercent, setDragDeltaPercent] = useState(0);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  // ----- content-panel height sync, so the track resizes smoothly per slide -----
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, index));
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
    setDragDeltaPercent((delta / width) * SLIDE_WIDTH);
  };

  const handlePointerUp = () => {
    if (!isDragging || !carouselRef.current) return;
    setIsDragging(false);
    const width = carouselRef.current.getBoundingClientRect().width;
    const delta = dragCurrentX.current - dragStartX.current;
    const threshold = width * 0.18;

    if (delta < -threshold && activeSlide < SLIDE_COUNT - 1) {
      goToSlide(activeSlide + 1);
    } else if (delta > threshold && activeSlide > 0) {
      goToSlide(activeSlide - 1);
    } else {
      goToSlide(activeSlide);
    }
  };

  const trackTransform = `translateX(${-activeSlide * SLIDE_WIDTH + dragDeltaPercent}%)`;

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?as=delivery');
    if (res.ok) {
      let data = await res.json();
      const now = new Date();
      data = data.map((order: Order) => {
        const hoursOld = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursOld > 24 && order.status !== 'delivered') {
          return { ...order, status: 'pending', claimedBy: null };
        }
        return order;
      });
      setOrders(data);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem('deliveryGuyId');
    if (!id) {
      router.push('/auth');
      return;
    }
    setDeliveryGuyId(id);
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [router]);

  // Re-measure the active panel's height whenever the slide or its data changes
  useEffect(() => {
    const el = panelRefs.current[activeSlide];
    if (el) setContentHeight(el.offsetHeight);
  }, [activeSlide, orders]);

  const claimOrder = async (orderId: string) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'inprogress' }),
    });
    if (res.ok) fetchOrders();
  };

    const updateStatus = async (orderId: string, newStatus: 'pending' | 'inprogress' | 'delivered') => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: newStatus }),
    });

    if (res.ok) {
      fetchOrders();
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (data.requiresBalanceConfirmation) {
      const confirmed = confirm(
        `Confirm you have collected the remaining $${data.balanceDue.toFixed(2)} balance from the customer before marking this delivered.`
      );
      if (confirmed) {
        const retryRes = await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus, balanceCollected: true }),
        });
        if (retryRes.ok) fetchOrders();
      }
    } else {
      alert(data.message || 'Failed to update order.');
    }
  };

  const availableOrders = orders.filter((o) => o.status === 'pending' && !o.claimedBy);
  const myOrders = orders.filter((o) => o.claimedBy === deliveryGuyId || o.status === 'inprogress');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered' && o.claimedBy === deliveryGuyId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay())).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  const sum = (arr: Order[]) => arr.reduce((s, o) => s + o.totalAmount, 0);
  const todayRevenue = sum(deliveredOrders.filter((o) => o.createdAt >= startOfToday));
  const weekRevenue = sum(deliveredOrders.filter((o) => o.createdAt >= startOfWeek));
  const monthRevenue = sum(deliveredOrders.filter((o) => o.createdAt >= startOfMonth));
  const yearRevenue = sum(deliveredOrders.filter((o) => o.createdAt >= startOfYear));
  const overallRevenue = sum(deliveredOrders);

  const splitMoney = (value: number) => {
    const fixed = value.toFixed(2);
    const [whole, cents] = fixed.split('.');
    return { whole: Number(whole).toLocaleString('en-US'), cents };
  };
  const revenueSplit = splitMoney(overallRevenue);

  const renderCard = (order: Order) => (
    <OrderCard key={order._id}>
      <CardTop>
        <CustomerName>
          <svg viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.79 2.99-4S17.66 3 16 3s-3 1.79-3 4 1.34 4 3 4zm-8 0c1.66 0 2.99-1.79 2.99-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          {order.customerName}
        </CustomerName>
        <StatusBadge status={order.status}>{order.status}</StatusBadge>
      </CardTop>

      <CardMeta>
        {order.contact} &nbsp;·&nbsp; {order.location}
      </CardMeta>

      <div>
        {order.products.map((item, i) => (
          <ProductLine key={i}>
            {item.productName} × {item.quantity}
          </ProductLine>
        ))}
      </div>

            <CardAmount>${order.totalAmount}</CardAmount>
      {order.isSplitPayment && !order.balanceCollected && (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 8 }}>
          Collect ${order.balanceDue?.toFixed(2)} balance (deposit already paid)
        </div>
      )}

      <CardActions>
        {order.status === 'pending' && !order.claimedBy && (
          <ActionBtn variant="green" onClick={() => claimOrder(order._id)}>
            Claim Order
          </ActionBtn>
        )}
        {order.status === 'pending' && order.claimedBy && (
          <>
            <ActionBtn variant="green" onClick={() => updateStatus(order._id, 'delivered')}>
              Mark Delivered
            </ActionBtn>
            <ActionBtn variant="red" onClick={() => updateStatus(order._id, 'pending')}>
              Return
            </ActionBtn>
          </>
        )}
        {order.status === 'inprogress' && (
          <>
            <ActionBtn variant="green" onClick={() => updateStatus(order._id, 'delivered')}>
              Mark Delivered
            </ActionBtn>
            <ActionBtn variant="red" onClick={() => updateStatus(order._id, 'pending')}>
              Return
            </ActionBtn>
          </>
        )}
        {order.status === 'delivered' && (
          <>
            <ActionBtn variant="blue" onClick={() => updateStatus(order._id, 'inprogress')}>
              Re-open
            </ActionBtn>
            <ActionBtn variant="red" onClick={() => updateStatus(order._id, 'pending')}>
              To Pending
            </ActionBtn>
          </>
        )}
      </CardActions>
    </OrderCard>
  );

  return (
    <Page>
      <AppShell>
        <SectionTitle>Delivery Dashboard</SectionTitle>

        {/* ================== BALANCE CARD CAROUSEL — 3 slides ================== */}
        <BalanceCarousel
          ref={carouselRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <BalanceTrack $dragging={isDragging} style={{ transform: trackTransform }}>
            {/* ---- Slide 1: Available ---- */}
            <BalanceCard>
              <BalanceTop>
                <BalanceIcon>📦</BalanceIcon>
                <BalanceBadge>available</BalanceBadge>
              </BalanceTop>
              <BalanceInfo>
                <BalanceLabel>Orders waiting to be claimed</BalanceLabel>
                <BalanceAmount>{availableOrders.length}</BalanceAmount>
              </BalanceInfo>
              <ChipRow>
                <Chip $variant="slate" $compact>
                  <ChipValue>{orders.length}</ChipValue>
                  <ChipCaption>All orders</ChipCaption>
                </Chip>
                <ChipWhite>
                  <ChipWhiteValue>{myOrders.length}</ChipWhiteValue>
                  <ChipWhiteCaption>Mine</ChipWhiteCaption>
                </ChipWhite>
              </ChipRow>
            </BalanceCard>

            {/* ---- Slide 2: My Orders ---- */}
            <BalanceCard>
              <BalanceTop>
                <BalanceIcon>🚚</BalanceIcon>
                <BalanceBadge>my orders</BalanceBadge>
              </BalanceTop>
              <BalanceInfo>
                <BalanceLabel>Orders you're handling</BalanceLabel>
                <BalanceAmount>{myOrders.length}</BalanceAmount>
              </BalanceInfo>
              <ChipRow>
                <Chip $variant="blue" $compact>
                  <ChipValue>{deliveredOrders.length}</ChipValue>
                  <ChipCaption>Delivered</ChipCaption>
                </Chip>
                <ChipWhite>
                  <ChipWhiteValue>{myOrders.filter((o) => o.status === 'inprogress').length}</ChipWhiteValue>
                  <ChipWhiteCaption>In transit</ChipWhiteCaption>
                </ChipWhite>
              </ChipRow>
            </BalanceCard>

            {/* ---- Slide 3: Analysis ---- */}
            <BalanceCard>
              <BalanceTop>
                <BalanceIcon>$</BalanceIcon>
                <BalanceBadge>earnings</BalanceBadge>
              </BalanceTop>
              <BalanceInfo>
                <BalanceLabel>Total revenue delivered</BalanceLabel>
                <BalanceAmount>
                  {revenueSplit.whole}
                  <Cents>.{revenueSplit.cents}</Cents>
                </BalanceAmount>
              </BalanceInfo>
              <ChipRow>
                <Chip $variant="green" $compact>
                  <ChipValue>${todayRevenue.toFixed(0)}</ChipValue>
                  <ChipCaption>Today</ChipCaption>
                </Chip>
                <ChipWhite>
                  <ChipWhiteValue>${weekRevenue.toFixed(0)}</ChipWhiteValue>
                  <ChipWhiteCaption>This week</ChipWhiteCaption>
                </ChipWhite>
              </ChipRow>
            </BalanceCard>
          </BalanceTrack>
        </BalanceCarousel>

        {/* ================== DOTS ================== */}
        <Dots>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <Dot key={i} $active={activeSlide === i} onClick={() => goToSlide(i)} />
          ))}
        </Dots>

        {/* ================== ANIMATED CONTENT — unique per slide, slides in sync with the balance card ================== */}
        <ContentViewport $height={contentHeight}>
          <ContentTrack $activeSlide={activeSlide}>
            {/* Panel 1: Available Orders */}
            <ContentPanel ref={(el) => {panelRefs.current[0] = el}}>
              <SectionTitle style={{ fontSize: 17 }}>Available Orders</SectionTitle>
              {availableOrders.length === 0 ? (
                <Ac404/>
              ) : (
                <OrderGrid>{availableOrders.map(renderCard)}</OrderGrid>
              )}
            </ContentPanel>

            {/* Panel 2: My Orders */}
            <ContentPanel ref={(el) => {panelRefs.current[1] = el}}>
              
              <SectionTitle style={{ fontSize: 17 }}>My Orders</SectionTitle>
                            <button
                onClick={async () => {
                  const res = await fetch('/api/delivery/optimize-route');
                  const data = await res.json();
                  if (res.ok) {
                    alert('Suggested order:\n' + data.route.map((s: any, i: number) => `${i + 1}. ${s.label}`).join('\n'));
                  } else {
                    alert(data.message);
                  }
                }}
                style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#5b6cff', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Optimize my route
              </button>
              
              {myOrders.length === 0 ? (
                <EmptyState>You have no orders yet.</EmptyState>
              ) : (
                <OrderGrid>{myOrders.map(renderCard)}</OrderGrid>
              )}
            </ContentPanel>

            {/* Panel 3: Analysis */}
            <ContentPanel ref={(el) => {panelRefs.current[2] = el}}>
              <SectionTitle style={{ fontSize: 17 }}>Earnings Breakdown</SectionTitle>
              <AnalyticsGrid>
                <AnalyticsCard bg="#dcc6f5">
                  <div className="label">Today</div>
                  <div className="value">${todayRevenue.toLocaleString()}</div>
                </AnalyticsCard>
                <AnalyticsCard bg="#f1e56c">
                  <div className="label">This Week</div>
                  <div className="value">${weekRevenue.toLocaleString()}</div>
                </AnalyticsCard>
                <AnalyticsCard bg="#efc1b9">
                  <div className="label">This Month</div>
                  <div className="value">${monthRevenue.toLocaleString()}</div>
                </AnalyticsCard>
                <AnalyticsCard bg="#b9e4c9">
                  <div className="label">This Year</div>
                  <div className="value">${yearRevenue.toLocaleString()}</div>
                </AnalyticsCard>
                <AnalyticsCard bg="#1b1b1b" dark>
                  <div className="label">Overall</div>
                  <div className="value">${overallRevenue.toLocaleString()}</div>
                </AnalyticsCard>
              </AnalyticsGrid>

              {deliveryGuyId && (
                <div style={{ marginTop: 20 }}>
                  <LocationSettings role="delivery" userId={deliveryGuyId} />
                </div>
              )}
            </ContentPanel>
          </ContentTrack>
        </ContentViewport>
      </AppShell>
    </Page>
  );
}