'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Loader from '@/components/Loader';
import LocationSettings from '@/components/LocationSettings';
import React from 'react';
import { useCart } from '@/context/CartContext';


interface OrderItem {
  product: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customer: string;
  customerName: string;
  contact: string;
  location: string;
  products: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'inprogress' | 'delivered';
  claimedBy?: string;
  createdAt: string;
}

interface CustomerProfile {
  name: string;
  contact: string;
  email?: string;
}

export default function CustomerDashboard() {

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const id = localStorage.getItem('customerId');
    if (!id) { router.push('/auth'); return; }
    setCustomerId(id);
    fetchCustomerProfile(id);
    fetchOrders(id);
    const interval = setInterval(() => fetchOrders(id), 4000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchCustomerProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) setCustomerProfile(await res.json());
    } catch (err) { console.error('Failed to fetch customer profile', err); }
  };

  const fetchOrders = async (id: string) => {
    try {
      const res = await fetch('/api/orders?as=buyer');
            const scopedOrders: Order[] = await res.json();
      setOrders(scopedOrders);
    } catch (err) { console.error('Failed to load orders', err); }
    finally { setLoading(false); }
  };

    const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (customerId) fetchOrders(customerId);
      } else {
        alert(data.message || 'Failed to cancel order.');
      }
    } catch {
      alert('Network error — please try again.');
    }
  };


  const handleReorder = async (order: Order) => {
    setReorderingId(order._id);
    let addedCount = 0;
    let unavailableCount = 0;

    try {
      for (const item of order.products) {
        if (!item.product) continue;
        try {
          const res = await fetch(`/api/products/${item.product}`);
          if (!res.ok) {
            unavailableCount++;
            continue;
          }
          const product = await res.json();
          if (product.quantity > 0) {
            addToCart(product);
            addedCount++;
          } else {
            unavailableCount++;
          }
        } catch {
          unavailableCount++;
        }
      }

      if (addedCount === 0) {
        alert('None of the items from this order are currently available.');
      } else if (unavailableCount > 0) {
        alert(`Added ${addedCount} item(s) to your cart. ${unavailableCount} item(s) are no longer available.`);
        router.push('/cart');
      } else {
        router.push('/cart');
      }
    } finally {
      setReorderingId(null);
    }
  };



  const getTrackingData = (status: string) => {
    if (status === 'pending')    return { progress: '0%',   label: 'Not Shipped', dot1: true,  dot2: false, dot3: false };
    if (status === 'inprogress') return { progress: '50%',  label: 'In Transit',  dot1: true,  dot2: true,  dot3: false };
    return                              { progress: '100%', label: 'Delivered',   dot1: true,  dot2: true,  dot3: true  };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) return <LoadingWrapper><Loader/></LoadingWrapper>;

  return (
    <DashboardContainer>

      {/* HEADER */}
      <Header>
        <h1>Welcome, {customerProfile?.name || 'Customer'}!</h1>
        <SectionTitle>My Orders ({orders.length})</SectionTitle>
      </Header>

      {/* MAIN */}
      <MainContent>

        {/* PROFILE CARD */}
        <ProfileCard>
          <Cover />

          <ProfileWrapper>
            <ArcRing />
            <ProfileCircle>
              <Initials>{getInitials(customerProfile?.name)}</Initials>
            </ProfileCircle>
          </ProfileWrapper>

          <ProfileContent>
            <h2>{customerProfile?.name || 'Customer'}</h2>
            <p>{customerProfile?.email || 'customer@email.com'}</p>

            <Stats>
              <Stat>
                <h3>{orders.length}</h3>
                <span>Orders</span>
              </Stat>
              <Stat>
                <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
                <span>Delivered</span>
              </Stat>
              <Stat>
                <h3>{orders.filter(o => o.status === 'inprogress').length}</h3>
                <span>Transit</span>
              </Stat>
            </Stats>

            <ProfileInfo>
              <InfoRow>
                <strong>Contact:</strong>
                <span>{customerProfile?.contact}</span>
              </InfoRow>
              <InfoRow>
                <strong>ID:</strong>
                <span style={{ fontSize: '11px', wordBreak: 'break-all' }}>{customerId}</span>
              </InfoRow>
            </ProfileInfo>


            <div style={{ marginTop: 16 }}>
  <LocationSettings role="buyer" userId={customerId!} />
</div>
          </ProfileContent>
        </ProfileCard>

        {/* ORDERS */}
        <OrderHistorySection>
          {orders.length === 0 ? (
            <EmptyText>You have no orders yet.</EmptyText>
          ) : (
            orders.map(order => {
              const tracking = getTrackingData(order.status);
              return (
                <TrackingCard key={order._id}>

                                                                   <TrackingTop>
                    <div className="id">Order ID: #{order._id.slice(-6)}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 999,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel order
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={reorderingId === order._id}
                          style={{
                            background: '#5b6cff',
                            border: 'none',
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 999,
                            cursor: reorderingId === order._id ? 'not-allowed' : 'pointer',
                            opacity: reorderingId === order._id ? 0.6 : 1,
                          }}
                        >
                          {reorderingId === order._id ? 'Adding…' : 'Buy again'}
                        </button>
                      )}
                    </div>
                    <div className="type">Customer Delivery</div>
                  </TrackingTop>

                  <ProductSection>
                    <ProductInfo>
                      <ProductIcon>📦</ProductIcon>
                      <ProductText>
                        <h2>{order.products[0]?.productName}</h2>
                        <p>{order.products.length} Product(s)</p>
                      </ProductText>
                    </ProductInfo>

                    <Location>
                      <h3>{order.location}</h3>
                      <p>${order.totalAmount}</p>
                    </Location>
                  </ProductSection>

                  <TrackingArea>
                    <TrackLabel className="left">Not Shipped</TrackLabel>
                    <TrackLabel className="center">In Transit</TrackLabel>
                    <TrackLabel className="right">Delivered</TrackLabel>

                    <Line>
                      <Progress style={{ width: tracking.progress }} />
                      <Dots>
                        <Dot className={`left  ${tracking.dot1 ? 'active' : ''}`} />
                        <Dot className={`center ${tracking.dot2 ? 'active' : ''}`} />
                        <Dot className={`right  ${tracking.dot3 ? 'active' : ''}`} />
                      </Dots>

                      <TransitGif>
                        {order.status === 'inprogress' ? (
                          <img src="/truck1.gif" alt="truck" />
                        ) : (
                          <img src="https://img.icons8.com/color/48/truck--v1.png" alt="truck" />
                        )}
                      </TransitGif>
                    </Line>

                    <Details>
                      <Detail>
                        <h4>Ordered</h4>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </Detail>
                      <Detail className="center">
                        <h4>Status</h4>
                        <p>{tracking.label}</p>
                      </Detail>
                      <Detail className="right">
                        <h4>Contact</h4>
                        <p>{order.contact}</p>
                      </Detail>
                    </Details>
                  </TrackingArea>

                </TrackingCard>
              );
            })
          )}
        </OrderHistorySection>

      </MainContent>
    </DashboardContainer>
  );
}

/* ======================================================
   STYLES
====================================================== */

const LoadingWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
`;

const DashboardContainer = styled.div`
  padding: 30px 20px;
  max-width: 1400px;
  margin: auto;
  min-height: 100vh;
  background: var(--bg-base);

  @media (max-width: 768px) {
    padding: 16px 12px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 28px;

  h1 {
    font-size: 2.2rem;
    color: var(--text-primary);
    margin-bottom: 6px;
  }

  @media (max-width: 768px) {
    margin-bottom: 18px;

    h1 {
      font-size: 1.4rem;
    }
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

/* ── PROFILE ── */

const ProfileCard = styled.div`
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow, 0 15px 40px rgba(0,0,0,0.07));

  @media (max-width: 768px) {
    border-radius: 24px;
  }
`;

const Cover = styled.div`
  position: relative;
  height: 120px;
  background-color:black;

  @media (max-width: 768px) {
    height: 90px;
  }
`;

const ProfileWrapper = styled.div`
  position: relative;
  width: 84px;
  height: 84px;
  margin: -38px auto 0;

  @media (max-width: 768px) {
    width: 72px;
    height: 72px;
    margin: -32px auto 0;
  }
`;

const ArcRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    #ff5f6d, #ffc371, #47e5bc, #6ea8ff, #c56dff, #ff5f6d
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
  clip-path: inset(0 0 52% 0);
`;

const ProfileCircle = styled.div`
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10px 20px rgba(0,0,0,0.07);
`;

const Initials = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #8ec5fc, #b9a6ff, #e0c3fc);
  color: white;
  font-size: 24px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const ProfileContent = styled.div`
  padding: 14px 16px 18px;
  text-align: center;

  h2 {
    font-size: 22px;
    margin-bottom: 4px;
    margin-top: 6px;
    color: var(--text-primary);
  }

  p { color: var(--text-muted); font-size: 13px; }

  @media (max-width: 768px) {
    padding: 10px 12px 14px;
    h2 { font-size: 18px; }
  }
`;

const Stats = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 20px;
  background: var(--bg-card-deep, var(--bg-card));
  box-shadow: var(--shadow, 0 10px 25px rgba(0,0,0,0.05));
`;

const Stat = styled.div`
  flex: 1;
  text-align: center;

  h3 { font-size: 20px; color: var(--text-primary); }
  span { font-size: 12px; color: var(--text-muted); }

  @media (max-width: 768px) {
    h3 { font-size: 16px; }
    span { font-size: 11px; }
  }
`;

const ProfileInfo = styled.div`
  margin-top: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);

  span { color: var(--text-muted); }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

/* ── ORDERS ── */

const OrderHistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  color: var(--text-primary);

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const EmptyText = styled.p`
  color: var(--text-muted);
`;

const TrackingCard = styled.div`
  background: #050505;
  border-radius: 28px;
  padding: 18px 18px 20px;
  color: white;
  box-shadow: 0 14px 35px rgba(0,0,0,0.16);

  @media (max-width: 768px) {
    border-radius: 20px;
    padding: 14px 14px 18px;
  }
`;

const TrackingTop = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;

  .id, .type {
    color: #a0a0a0;
    font-size: 10px;
  }
`;

const ProductSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  gap: 10px;

  @media (max-width: 500px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProductIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #d8e63c;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
`;

const ProductText = styled.div`
  h2 {
    font-size: 15px;
    margin-bottom: 2px;
  }

  p {
    color: #a0a0a0;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    h2 { font-size: 13px; }
    p  { font-size: 11px; }
  }
`;

const Location = styled.div`
  text-align: right;

  h3 { font-size: 14px; }
  p  { color: #b5b5b5; font-size: 13px; }

  @media (max-width: 768px) {
    h3 { font-size: 12px; }
    p  { font-size: 12px; }
  }
`;

const TrackingArea = styled.div`
  position: relative;
`;

const TrackLabel = styled.div`
  position: absolute;
  top: -24px;
  font-size: 10px;
  color: #b8b8b8;
  white-space: nowrap;

  &.left   { left: 0; }
  &.center { left: 50%; transform: translateX(-50%); }
  &.right  { right: 0; }

  @media (max-width: 400px) {
    font-size: 9px;
  }
`;

const Line = styled.div`
  position: relative;
  width: 100%;
  height: 14px;
  display: flex;
  align-items: center;
  border-top: 2px dashed rgba(255,255,255,0.35);
  margin: 18px 0 14px 0;
`;

const Progress = styled.div`
  position: absolute;
  left: 0;
  top: -2px;
  height: 2px;
  border-top: 2px dashed #d8e63c;
  transition: 0.5s ease;
  z-index: 1;
`;

const Dots = styled.div`
  position: absolute;
  width: 100%;
  height: 14px;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const Dot = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  top: 50%;
  transform: translateY(-50%);
  margin-top: -6px;
  z-index: 3;

  &.left   { left: 0; }
  &.center { left: 50%; transform: translate(-50%, -50%); }
  &.right  { right: 0; }

  &.active {
    background: #d8e63c;
    box-shadow: 0 0 10px rgba(216,230,60,0.9);
  }
`;

const TransitGif = styled.div`
  position: absolute;
  margin-top: -6px;
  border-radius: 40%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const Details = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.center { align-items: center; }
  &.right  { align-items: flex-end; }

  h4 {
    font-size: 12px;
    margin-bottom: 2px;
  }

  p {
    font-size: 11px;
    color: #8f8f8f;
  }

  @media (max-width: 768px) {
    h4 { font-size: 10px; }
    p  { font-size: 10px; }
  }
`;

export {};