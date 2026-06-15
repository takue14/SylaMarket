'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Link from 'next/link';

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

const StyledWrapper = styled.div`
  button {
    display: flex;
    align-items: center;
    font-family: inherit;
    cursor: pointer;
    font-weight: 500;
    font-size: 17px;
    padding: 0.8em 1.3em 0.8em 0.9em;
    color: white;
    background: linear-gradient(to right, #0f0c29, #302b63, #24243e);
    border: none;
    letter-spacing: 0.05em;
    border-radius: 16px;
  }

  button svg {
    margin-right: 3px;
    transform: rotate(30deg);
    transition: transform 0.5s cubic-bezier(0.76, 0, 0.24, 1);
  }

  button span {
    transition: transform 0.5s cubic-bezier(0.76, 0, 0.24, 1);
  }

  button:hover svg {
    transform: translateX(5px) rotate(90deg);
  }

  button:hover span {
    transform: translateX(7px);
  }
`;

const DashboardContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 30px;

  @media (max-width: 768px) {
    padding: 18px;
  }
`;

const DesktopView = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: var(--text-primary);
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #1f1f25;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  background: ${props => (props.active ? '#5b6cff' : '#18181b')};
  color: white;
  border: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: ${props => (props.active ? '#5b6cff' : '#23232b')};
  }
`;

const DashboardCard = styled.div`
  width: 100%;
  min-height: 150px;
  background: linear-gradient(145deg, #1b1b22, #111116);
  border-radius: 22px;
  padding: 20px;
  color: white;
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.03),
    0 10px 25px rgba(0,0,0,0.4);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #5b6cff;
    font-size: 15px;
    font-weight: 600;
  }

  .time {
    color: #7b7b86;
    font-size: 15px;
  }

  .sub-text {
    margin-top: 26px;
    color: #9b9ba3;
    font-size: 15px;
  }

  .number {
    margin-top: 10px;
    font-size: 42px;
    font-weight: 500;
    letter-spacing: -2px;
    color: #f5f5f5;
    padding-bottom: 10px;
    word-break: break-word;
  }

  .small-body {
    margin-top: 12px;
    color: #c5c5ce;
    line-height: 1.6;
    font-size: 14px;
  }

  .action-btn {
    margin-top: 12px;
    background: #5b6cff;
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .danger-btn {
    background: #ef4444;
  }

  .success-btn {
    background: #10b981;
  }
`;

const MobileTabs = styled.div`
  width: 100%;
  background: #151515;
  border-radius: 40px;
  padding: 6px;
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  position: sticky;
  top: 10px;
  z-index: 20;
`;

const MobileTab = styled.button<{ active: boolean }>`
  flex: 1;
  border: none;
  background: ${props => props.active ? '#ededed' : 'transparent'};
  color: ${props => props.active ? '#111' : '#cfcfcf'};
  font-size: 17px;
  font-weight: 600;
  padding: 14px 10px;
  border-radius: 30px;
  cursor: pointer;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
`;

const MobileAnalyticsCard = styled.div<{ bg: string; dark?: boolean }>`
  min-height: 120px;
  border-radius: 24px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: ${props => props.bg};
  color: ${props => props.dark ? 'white' : '#111'};
`;

const OverviewBox = styled.div`
  background: #161616;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 25px;
`;

const OverviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 100px;
  color: var(--text-primary);
`;

const MobileProductCard = styled.div`
  background: #141414;
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

  const [activeTab, setActiveTab] =
    useState<'overview' | 'sales' | 'inventory'>('overview');

  const [mobileTab, setMobileTab] =
    useState<'products' | 'analysis'>('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restockAmounts, setRestockAmounts] =
    useState<Record<string, number>>({});

  const router = useRouter();

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

    const orderRes = await fetch('/api/orders');
    if (orderRes.ok) {
      const data = await orderRes.json();
      setOrders(data);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  // ── Guard added: rejects negative quantities ──
  const updateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
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

  const totalListedValue = listedProducts.reduce(
    (sum, p) => sum + p.price * p.quantity, 0
  );

  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const overallRevenue = deliveredOrders.reduce(
    (sum, o) => sum + o.totalAmount, 0
  );

  return (
    <DashboardContainer>

      {/* ================== MOBILE VIEW ================== */}

      <MobileView>

        <MobileTabs>
          <MobileTab
            active={mobileTab === 'products'}
            onClick={() => setMobileTab('products')}
          >
            Product
          </MobileTab>

          <MobileTab
            active={mobileTab === 'analysis'}
            onClick={() => setMobileTab('analysis')}
          >
            Analysis
          </MobileTab>
        </MobileTabs>

        {mobileTab === 'products' && (
          <>
            <h2 style={{ fontSize: '24px', marginBottom: '18px' }}>
              Sales Analysis
            </h2>

            <AnalyticsGrid>
              <MobileAnalyticsCard bg="#dcc6f5">
                <div>
                  <div>Total Products</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                    {products.length}
                  </div>
                </div>
              </MobileAnalyticsCard>

              <MobileAnalyticsCard bg="#f1e56c">
                <div>
                  <div>Revenue</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                    ${overallRevenue.toLocaleString()}
                  </div>
                </div>
              </MobileAnalyticsCard>

              <MobileAnalyticsCard bg="#efc1b9">
                <div>
                  <div>Listed Products</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                    {listedProducts.length}
                  </div>
                </div>
              </MobileAnalyticsCard>

              <MobileAnalyticsCard bg="#1b1b1b" dark>
                <div>
                  <div>Sold Out</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                    {soldOutProducts.length}
                  </div>
                </div>
              </MobileAnalyticsCard>
            </AnalyticsGrid>

            <OverviewBox>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px',color: 'var(--text-primary)' }}>
                <h3 style={{ color: 'var(--text-primary)'}}>Product Overview</h3>
                <Link href="/seller/upload" style={{ textDecoration: 'none' }}>
                  <span style={{ color: 'var(--text-primary)'}}>Upload Products</span>
                </Link>
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

            <h2 style={{ marginBottom: '20px' }}>Products</h2>

            <ProductList style={{ color: 'var(--text-primary)'}}>
              {listedProducts.map(product => (
                <MobileProductCard key={product._id} style={{ color: 'var(--text-primary)'}}>
                  <ProductImage
                    src={product.imageLink || '/placeholder.png'}
                    alt={product.productName}
                  />

                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '6px' }}>
                      {product.productName}
                    </h4>

                    <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                      {product.category}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>${product.price}</strong>

                      {/* ── Quantity counter (added back) ── */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => updateQuantity(product._id, product.quantity - 1)}
                          style={{ background: '#222', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) =>
                            updateQuantity(product._id, parseInt(e.target.value) || 0)
                          }
                          style={{ width: '60px', textAlign: 'center', padding: '4px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333' }}
                        />

                        <button
                          onClick={() => updateQuantity(product._id, product.quantity + 1)}
                          style={{ background: '#222', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

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

            {/* ── Mobile Sold Out section (added back) ── */}
            {soldOutProducts.length > 0 && (
              <>
                <h2 style={{ marginTop: '40px', color: '#ef4444' }}>
                  Sold Out Products
                </h2>

                <ProductList>
                  {soldOutProducts.map(product => (
                    <MobileProductCard key={product._id}>
                      <ProductImage
                        src={product.imageLink || '/placeholder.png'}
                        alt={product.productName}
                      />

                      <div style={{ flex: 1 }}>
                        <h4>{product.productName}</h4>
                        <p style={{ color: '#999', fontSize: '13px' }}>
                          {product.category}
                        </p>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <input
                            type="number"
                            value={restockAmounts[product._id] || 10}
                            onChange={(e) =>
                              setRestockAmounts(prev => ({
                                ...prev,
                                [product._id]: parseInt(e.target.value) || 10,
                              }))
                            }
                            style={{ width: '70px', padding: '6px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333' }}
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
          </>
        )}

        {mobileTab === 'analysis' && (
          <AnalyticsGrid>
            <MobileAnalyticsCard bg="#dcc6f5">
              <div>
                <div>Total Value</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                  ${totalListedValue.toFixed(0)}
                </div>
              </div>
            </MobileAnalyticsCard>

            <MobileAnalyticsCard bg="#f1e56c">
              <div>
                <div>Orders</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                  {orders.length}
                </div>
              </div>
            </MobileAnalyticsCard>

            <MobileAnalyticsCard bg="#efc1b9">
              <div>
                <div>Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                  ${overallRevenue.toFixed(0)}
                </div>
              </div>
            </MobileAnalyticsCard>

            <MobileAnalyticsCard bg="#1b1b1b" dark>
              <div>
                <div>Delivered</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>
                  {deliveredOrders.length}
                </div>
              </div>
            </MobileAnalyticsCard>
          </AnalyticsGrid>
        )}

      </MobileView>

      {/* ================== DESKTOP VIEW ================== */}

      <DesktopView>

        <Header>
          <Title>Seller Dashboard</Title>
        </Header>

        <TabContainer>
          <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </Tab>
          <Tab active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
            Sales Analytics
          </Tab>
          <Tab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
            Inventory Management
          </Tab>
        </TabContainer>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <DashboardCard>
              <div className="top">
                <div className="title"><span>Total Products</span></div>
                <div className="time">Now</div>
              </div>
              <div className="sub-text">Current inventory</div>
              <div className="number">{products.length}</div>
            </DashboardCard>

            <DashboardCard>
              <div className="top">
                <div className="title"><span>Listed Value</span></div>
                <div className="time">Live</div>
              </div>
              <div className="sub-text">Inventory worth</div>
              <div className="number">${totalListedValue.toFixed(2)}</div>
            </DashboardCard>

            <DashboardCard>
              <div className="top">
                <div className="title"><span>Sold Out</span></div>
                <div className="time">Stock</div>
              </div>
              <div className="sub-text">Products unavailable</div>
              <div className="number">{soldOutProducts.length}</div>
            </DashboardCard>
          </div>
        )}

        {/* ── Sales Analytics Tab (added back) ── */}
        {activeTab === 'sales' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <DashboardCard>
              <div className="top">
                <div className="title"><span>Overall Revenue</span></div>
                <div className="time">All time</div>
              </div>
              <div className="sub-text">From delivered orders</div>
              <div className="number">${overallRevenue.toFixed(2)}</div>
            </DashboardCard>

            <DashboardCard>
              <div className="top">
                <div className="title"><span>Total Orders</span></div>
                <div className="time">All</div>
              </div>
              <div className="sub-text">Orders received</div>
              <div className="number">{orders.length}</div>
            </DashboardCard>

            <DashboardCard>
              <div className="top">
                <div className="title"><span>Delivered Orders</span></div>
                <div className="time">Completed</div>
              </div>
              <div className="sub-text">Successfully fulfilled</div>
              <div className="number">{deliveredOrders.length}</div>
            </DashboardCard>
          </div>
        )}

        {/* ── Inventory Management Tab (added back) ── */}
        {activeTab === 'inventory' && (
          <>
            <h2 style={{ marginBottom: '20px' }}>Listed Products</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111116', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#1b1b22' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Quantity</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {listedProducts.map(product => (
                  <tr key={product._id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '15px' }}>{product.productName}</td>
                    <td style={{ padding: '15px' }}>${product.price}</td>
                    <td style={{ padding: '15px' }}>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) =>
                          updateQuantity(product._id, parseInt(e.target.value) || 0)
                        }
                        style={{ width: '80px', padding: '6px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333' }}
                      />
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Desktop Sold Out section (added back) ── */}
            {soldOutProducts.length > 0 && (
              <>
                <h2 style={{ marginTop: '50px', color: '#ef4444' }}>
                  Sold Out Products
                </h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111116', borderRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#1b1b22' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Price</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Restock Qty</th>
                      <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldOutProducts.map(product => (
                      <tr key={product._id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '15px' }}>{product.productName}</td>
                        <td style={{ padding: '15px' }}>${product.price}</td>
                        <td style={{ padding: '15px' }}>
                          <input
                            type="number"
                            value={restockAmounts[product._id] || 10}
                            onChange={(e) =>
                              setRestockAmounts(prev => ({
                                ...prev,
                                [product._id]: parseInt(e.target.value) || 10,
                              }))
                            }
                            style={{ width: '80px', padding: '6px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333' }}
                          />
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRestock(product._id)}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

      </DesktopView>

    </DashboardContainer>
  );
}