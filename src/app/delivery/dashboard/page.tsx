'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import LocationSettings from '@/components/LocationSettings';

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
}

// ================== STYLES ==================

const DashboardContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 24px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  color: var(--text-primary);
  margin: 0;
  font-size: 22px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const DriverBadge = styled.span`
  background: #1b1b22;
  color: #5b6cff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
`;

/* ── Tabs: same design as SellerDashboard ── */
const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #1f1f25;
  overflow-x: auto;

  /* hide scrollbar on mobile */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${props => props.active ? '#5b6cff' : '#18181b'};
  color: white;
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.active ? '#5b6cff' : '#23232b'};
  }
`;

/* ── Analytics grid: same as SellerDashboard mobile analytics ── */
const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;

  @media (min-width: 769px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1100px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const AnalyticsCard = styled.div<{ bg: string; dark?: boolean }>`
  min-height: 110px;
  border-radius: 22px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${props => props.bg};
  color: ${props => props.dark ? 'white' : '#111'};

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

  @media (max-width: 768px) {
    min-height: 95px;
    .value { font-size: 22px; }
  }
`;

/* ── Order cards: compact, dark, responsive grid ── */
const OrderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OrderCard = styled.div`
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 18px;
  padding: 16px;
  color: white;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.03),
    0 6px 20px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
  }
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
  background: ${props =>
    props.status === 'delivered' ? '#064e3b' :
    props.status === 'inprogress' ? '#1e3a5f' :
    '#2d1f00'};
  color: ${props =>
    props.status === 'delivered' ? '#10b981' :
    props.status === 'inprogress' ? '#3b82f6' :
    '#f59e0b'};
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
  margin-top: 2px;
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

  background: ${props =>
    props.variant === 'green' ? '#10b981' :
    props.variant === 'red'   ? '#ef4444' :
                                '#3b82f6'};

  &:hover { opacity: 0.85; }
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #e5e5e5;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #444;
  padding: 50px 20px;
  font-size: 15px;
`;

// ================== COMPONENT ==================

export default function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState<'available' | 'my' | 'analysis'>('available');
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryGuyId, setDeliveryGuyId] = useState<string | null>(null);
  const router = useRouter();

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?as=delivery');
    if (res.ok) {
      let data = await res.json();
      const now = new Date();
      data = data.map((order: Order) => {
        const hoursOld =
          (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
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
    if (!id) { router.push('/delivery/login'); return; }
    setDeliveryGuyId(id);
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [router]);

  const claimOrder = async (orderId: string) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: 'inprogress' }),
    });
    if (res.ok) fetchOrders();
  };

  const updateStatus = async (
    orderId: string,
    newStatus: 'pending' | 'inprogress' | 'delivered'
  ) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status: newStatus,
        claimedBy: newStatus === 'pending' ? null : deliveryGuyId,
      }),
    });
    if (res.ok) fetchOrders();
  };

  const availableOrders = orders.filter(o => o.status === 'pending' && !o.claimedBy);
  const myOrders = orders.filter(o => o.claimedBy === deliveryGuyId || o.status === 'inprogress');

  // ── Analytics ──
  const deliveredOrders = orders.filter(
    o => o.status === 'delivered' && o.claimedBy === deliveryGuyId
  );

  const now = new Date();
  const startOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek    = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear    = new Date(now.getFullYear(), 0, 1).toISOString();

  const sum = (arr: Order[]) => arr.reduce((s, o) => s + o.totalAmount, 0);

  const todayRevenue   = sum(deliveredOrders.filter(o => o.createdAt >= startOfToday));
  const weekRevenue    = sum(deliveredOrders.filter(o => o.createdAt >= startOfWeek));
  const monthRevenue   = sum(deliveredOrders.filter(o => o.createdAt >= startOfMonth));
  const yearRevenue    = sum(deliveredOrders.filter(o => o.createdAt >= startOfYear));
  const overallRevenue = sum(deliveredOrders);

  // ── Shared order card renderer ──
  const renderCard = (order: Order) => (
    <OrderCard key={order._id}>
      <CardTop>
        <CustomerName>
          <svg viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.79 2.99-4S17.66 3 16 3s-3 1.79-3 4 1.34 4 3 4zm-8 0c1.66 0 2.99-1.79 2.99-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
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
          <ProductLine key={i}>{item.productName} × {item.quantity}</ProductLine>
        ))}
      </div>

      <CardAmount>${order.totalAmount}</CardAmount>

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
    <DashboardContainer>

      <Header>
        <Title>Delivery Dashboard</Title>
        <DriverBadge>Driver ···{deliveryGuyId?.slice(-6)}</DriverBadge>
      </Header>

      {/* ── Tabs ── */}
      <TabContainer>
        <Tab active={activeTab === 'available'} onClick={() => setActiveTab('available')}>
          Available ({availableOrders.length})
        </Tab>
        <Tab active={activeTab === 'my'} onClick={() => setActiveTab('my')}>
          My Orders ({myOrders.length})
        </Tab>
        <Tab active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
          Analysis
        </Tab>
      </TabContainer>

      {/* ── Available Orders ── */}
      {activeTab === 'available' && (
        <>
          <SectionTitle style={{ color: 'var(--text-primary)'}}>Available Orders</SectionTitle>
          {availableOrders.length === 0
            ? <EmptyState>No available orders right now.</EmptyState>
            : <OrderGrid>{availableOrders.map(renderCard)}</OrderGrid>
          }
        </>
      )}

      {/* ── My Orders ── */}
      {activeTab === 'my' && (
        <>
          <SectionTitle style={{ color: 'var(--text-primary)'}}>My Orders</SectionTitle>
          {myOrders.length === 0
            ? <EmptyState>You have no orders yet.</EmptyState>
            : <OrderGrid>{myOrders.map(renderCard)}</OrderGrid>
          }
        </>
      )}

      {/* ── Analysis: same card design as SellerDashboard ── */}
      {activeTab === 'analysis' && (
        <>
        <div style={{ marginBottom: 20 }}>
      <LocationSettings role="delivery" userId={deliveryGuyId!} />
    </div>
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
        </>
      )}

    </DashboardContainer>
  );
}