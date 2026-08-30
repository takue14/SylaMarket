'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useNotification } from '@/context/NotificationContext';

interface Order {
  totalAmount: number;
  status: 'pending' | 'inprogress' | 'delivered';
}

interface Product {
  _id: string;
  productName: string;
  price: number;
  category: string;
  seller?: {
    _id: string;
    businessName: string;
  };
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeSellers: number;
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
  flex-wrap: wrap;
  gap: 12px;
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

const AdminBadge = styled.span`
  background: #1b1b22;
  color: #5b6cff;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
`;

/* ── Nav buttons row ── */
const NavRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const NavBtn = styled.button<{ variant?: 'purple' | 'gold' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  color: white;

  background: ${props =>
    props.variant === 'gold'
      ? 'linear-gradient(135deg, #b45309, #f59e0b)'
      : 'linear-gradient(135deg, #3730a3, #5b6cff)'};

  &:hover {
    opacity: 0.88;
    transform: translateY(-2px);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: white;
    flex-shrink: 0;
  }
`;

/* ── Analytics grid ── */
const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 32px;

  @media (min-width: 769px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const AnalyticsCard = styled.div<{ bg: string; dark?: boolean }>`
  min-height: 110px;
  border-radius: 22px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${props => props.bg};
  color: ${props => props.dark ? 'white' : '#111'};

  .label {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.7;
  }

  .value {
    font-size: 28px;
    font-weight: 800;
    margin-top: 10px;
    letter-spacing: -0.5px;
  }

  @media (max-width: 768px) {
    min-height: 95px;
    .value { font-size: 22px; }
  }
`;

/* ── Section title ── */
const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #e5e5e5;
`;

/* ── Table wrapper for horizontal scroll on mobile ── */
const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 14px;

  /* hide scrollbar but keep scroll */
  scrollbar-width: thin;
  scrollbar-color: #222 transparent;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 14px;
  overflow: hidden;
  min-width: 560px;

  thead tr {
    background: #1b1b22;
  }

  th {
    padding: 14px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: #5b6cff;
    white-space: nowrap;
  }

  th:last-child { text-align: center; }

  tbody tr {
    border-bottom: 1px solid #1f1f25;
    transition: background 0.15s;
  }

  tbody tr:last-child { border-bottom: none; }

  tbody tr:hover { background: rgba(91, 108, 255, 0.04); }

  td {
    padding: 13px 16px;
    font-size: 13.5px;
    color: #d1d1d8;
    white-space: nowrap;
  }

  td:last-child { text-align: center; }
`;

const DeleteBtn = styled.button<{ loading?: boolean }>`
  background: ${props => props.loading ? '#374151' : '#ef4444'};
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: ${props => props.loading ? 'not-allowed' : 'pointer'};
  transition: opacity 0.2s;

  &:hover {
    opacity: ${props => props.loading ? 1 : 0.85};
  }
`;

const CategoryBadge = styled.span`
  background: #1f1f2e;
  color: #818cf8;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
`;

const SellerBadge = styled.span`
  background: #0f2a1e;
  color: #10b981;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
`;


const SellerReviewCard = styled.div`
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .seller-name { font-size: 15px; font-weight: 700; color: #e5e5e5; }
  .seller-sub { font-size: 12.5px; color: #9b9ba3; margin-top: 2px; }

  .seller-photos {
    display: flex;
    gap: 12px;
    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #818cf8;
      text-decoration: none;
    }
    img {
      width: 96px;
      height: 96px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #26262e;
    }
  }

  .seller-actions {
    display: flex;
    gap: 10px;
  }
`;

const ApproveBtn = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
`;
// ================== COMPONENT ==================

export default function AdminDashboard() {
  const { notify, confirmAction } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeSellers: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);


  interface PendingDelivery {
    _id: string;
    name: string;
    contact: string;
    idPhotoUrl: string;
    livePhotoUrl: string;
  }
  const [pendingDelivery, setPendingDelivery] = useState<PendingDelivery[]>([]);


  interface PendingSeller {
    _id: string;
    name: string;
    businessName: string;
    contact: string;
    ecocashNumber: string;
    idPhotoUrl: string;
    livePhotoUrl: string;
  }
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);


  const router = useRouter();
useEffect(() => {
    fetchProductsAndAnalytics();
    fetchPendingSellers();
    fetchPendingDelivery();
  }, []);

  const fetchPendingDelivery = async () => {
    try {
      const res = await fetch('/api/admin/delivery');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPendingDelivery(data.deliveryGuys || []);
    } catch (err) {
      console.error('Failed to fetch pending delivery guys', err);
    }
  };

  const handleDeliveryVerify = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('Reject this delivery application?')) return;
    setVerifyingId(id);
    try {
      const reason = action === 'reject' ? prompt('Reason for rejection (optional):') || '' : undefined;
      const res = await fetch(`/api/admin/delivery/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setPendingDelivery((prev) => prev.filter((d) => d._id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to update delivery status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setVerifyingId(null);
    }
  };


  useEffect(() => {
    fetchProductsAndAnalytics();
    fetchPendingSellers();
  }, []);

const fetchPendingSellers = async () => {
    try {
      const res = await fetch('/api/admin/sellers');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPendingSellers(data.sellers || []);
    } catch (err) {
      console.error('Failed to fetch pending sellers', err);
    }
  };

  const handleSellerVerify = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('Reject this seller application?')) return;
    setVerifyingId(id);
    try {
      const reason = action === 'reject' ? prompt('Reason for rejection (optional):') || '' : undefined;
      const res = await fetch(`/api/admin/sellers/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setPendingSellers((prev) => prev.filter((s) => s._id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to update seller status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchProductsAndAnalytics = async () => {
    try {
      const prodRes = await fetch('/api/products');
      const allProducts: Product[] = await prodRes.json();
      setProducts(allProducts);

      const orderRes = await fetch('/api/orders');
      const orders: Order[] = await orderRes.json();

      const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: allProducts.length,
        activeSellers:
          new Set(allProducts.map(p => p.seller?._id).filter(Boolean)).size || 5,
      });
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

    const deleteProduct = async (id: string) => {
    const ok = await confirmAction('Delete this product permanently from the database?');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProductsAndAnalytics();
        notify('Product deleted.', 'success');
      } else {
        notify('Failed to delete product', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Network error', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardContainer>

      {/* ── Header ── */}
      <Header>
        <Title>Admin Dashboard</Title>
        <AdminBadge>Super Admin</AdminBadge>
      </Header>

      {/* ── Navigation buttons ── */}
      <NavRow>
        <NavBtn variant="purple" onClick={() => router.push('/admin/listings')}>
          <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          DealoAc Listings
        </NavBtn>
        
        <NavBtn variant="purple" onClick={() => router.push('/admin/inquiries')}>
          {/* Message icon */}
          <svg viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
          Inquiries
        </NavBtn>

        <NavBtn variant="gold" onClick={() => router.push('/admin/ads')}>
          {/* Ads / megaphone icon */}
          <svg viewBox="0 0 24 24">
            <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>
          </svg>
          Ads
        </NavBtn>
      </NavRow>

      {/* ── Analytics Cards ── */}
      <AnalyticsGrid>
        <AnalyticsCard bg="#dcc6f5">
          <div className="label">Total Revenue</div>
          <div className="value">${analytics.totalRevenue.toLocaleString()}</div>
        </AnalyticsCard>

        <AnalyticsCard bg="#f1e56c">
          <div className="label">Total Orders</div>
          <div className="value">{analytics.totalOrders}</div>
        </AnalyticsCard>

        <AnalyticsCard bg="#efc1b9">
          <div className="label">Total Products</div>
          <div className="value">{analytics.totalProducts}</div>
        </AnalyticsCard>

        <AnalyticsCard bg="#1b1b1b" dark>
          <div className="label">Active Sellers</div>
          <div className="value">{analytics.activeSellers}</div>
        </AnalyticsCard>
      </AnalyticsGrid>



      

{/* ── Pending Seller Verifications ── */}
      <SectionTitle style={{ color: 'var(--text-primary)' }}>
        Pending Seller Verifications {pendingSellers.length > 0 && `(${pendingSellers.length})`}
      </SectionTitle>

      {pendingSellers.length === 0 ? (
        <p style={{ color: '#8b8b95', fontSize: 13.5, marginBottom: 32 }}>
          No sellers awaiting review.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {pendingSellers.map((seller) => (
            <SellerReviewCard key={seller._id}>
              <div className="seller-info">
                <div className="seller-name">{seller.businessName}</div>
                <div className="seller-sub">{seller.name} · {seller.contact} · EcoCash: {seller.ecocashNumber}</div>
              </div>
              <div className="seller-photos">
                <a href={seller.idPhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={seller.idPhotoUrl} alt="ID photo" />
                  <span>ID photo</span>
                </a>
                <a href={seller.livePhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={seller.livePhotoUrl} alt="Live photo" />
                  <span>Live photo</span>
                </a>
              </div>
              <div className="seller-actions">
                <ApproveBtn
                  disabled={verifyingId === seller._id}
                  onClick={() => handleSellerVerify(seller._id, 'approve')}
                >
                  {verifyingId === seller._id ? '…' : 'Approve'}
                </ApproveBtn>
                <DeleteBtn
                  disabled={verifyingId === seller._id}
                  onClick={() => handleSellerVerify(seller._id, 'reject')}
                >
                  {verifyingId === seller._id ? '…' : 'Reject'}
                </DeleteBtn>
              </div>
            </SellerReviewCard>
          ))}
        </div>
      )}

      

{/* ── Pending Delivery Verifications ── */}
      <SectionTitle style={{ color: 'var(--text-primary)' }}>
        Pending Delivery Verifications {pendingDelivery.length > 0 && `(${pendingDelivery.length})`}
      </SectionTitle>

      {pendingDelivery.length === 0 ? (
        <p style={{ color: '#8b8b95', fontSize: 13.5, marginBottom: 32 }}>
          No delivery applications awaiting review.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {pendingDelivery.map((d) => (
            <SellerReviewCard key={d._id}>
              <div className="seller-info">
                <div className="seller-name">{d.name}</div>
                <div className="seller-sub">{d.contact}</div>
              </div>
              <div className="seller-photos">
                <a href={d.idPhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={d.idPhotoUrl} alt="ID photo" />
                  <span>ID photo</span>
                </a>
                <a href={d.livePhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={d.livePhotoUrl} alt="Live photo" />
                  <span>Live photo</span>
                </a>
              </div>
              <div className="seller-actions">
                <ApproveBtn disabled={verifyingId === d._id} onClick={() => handleDeliveryVerify(d._id, 'approve')}>
                  {verifyingId === d._id ? '…' : 'Approve'}
                </ApproveBtn>
                <DeleteBtn disabled={verifyingId === d._id} onClick={() => handleDeliveryVerify(d._id, 'reject')}>
                  {verifyingId === d._id ? '…' : 'Reject'}
                </DeleteBtn>
              </div>
            </SellerReviewCard>
          ))}
        </div>
      )}
      
      {/* ── Products Table ── */}
      <SectionTitle style={{ color: 'var(--text-primary)'}}>All Products — All Sellers</SectionTitle>

      <TableWrapper>
        <StyledTable>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.productName}</td>
                <td>${product.price}</td>
                <td>
                  <CategoryBadge>{product.category}</CategoryBadge>
                </td>
                <td>
                  <SellerBadge>
                    {product.seller?.businessName || 'Unknown'}
                  </SellerBadge>
                </td>
                <td>
                  <DeleteBtn
                    loading={deletingId === product._id}
                    disabled={deletingId === product._id}
                    onClick={() => deleteProduct(product._id)}
                  >
                    {deletingId === product._id ? 'Deleting…' : 'Delete'}
                  </DeleteBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </TableWrapper>

    </DashboardContainer>
  );
}